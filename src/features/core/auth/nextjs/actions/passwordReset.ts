"use server";

import crypto from "node:crypto";
import { and, desc, eq, gt, isNull, sql } from "drizzle-orm";
import type { z } from "zod";

import { db } from "@/drizzle";
import {
  UserCredentialsTable,
  UsersTable,
  UserTokensTable,
} from "@/drizzle/schema";
import { normalizeEmail } from "@/features/core/auth/core/helpers";
import {
  generateSalt,
  hashPassword,
} from "@/features/core/auth/core/passwordHasher";
import {
  evaluateResetAttempt,
  RESET_ATTEMPTS_METADATA_KEY,
  readResetAttempts,
} from "@/features/core/auth/core/passwordResetLimits";
import { hashTokenValue } from "@/features/core/auth/core/token";
import { validateInput } from "@/features/core/auth/nextjs/actions/helpers";
import { sendPasswordResetCodeEmail } from "@/features/core/auth/nextjs/emails";
import { isPasswordResetRateLimited } from "@/features/core/auth/nextjs/passwordResetRateLimit";
import {
  passwordResetRequestSchema,
  passwordResetSubmissionSchema,
} from "@/features/core/auth/schemas";
import type { TypedResponse } from "@/features/core/auth/types";
import { getT } from "@/features/core/i18n/server";

const PASSWORD_RESET_OTP_LENGTH = 6;
const PASSWORD_RESET_OTP_TTL_MS = 1000 * 60 * 10; // 10 minutes

function generateResetOtp() {
  return crypto
    .randomInt(0, 10 ** PASSWORD_RESET_OTP_LENGTH)
    .toString()
    .padStart(PASSWORD_RESET_OTP_LENGTH, "0");
}

function hashPasswordResetOtp(normalizedEmail: string, otp: string) {
  return hashTokenValue(`${normalizedEmail}:${otp}`);
}

function hashesMatch(a: string, b: string) {
  const left = Buffer.from(a, "hex");
  const right = Buffer.from(b, "hex");
  return left.length === right.length && crypto.timingSafeEqual(left, right);
}

/**
 * Atomically bumps the guess counter on a reset token and returns the new
 * value, or `null` if the token is gone or already used. The row lock makes
 * parallel guesses each get a distinct number.
 */
async function recordResetAttempt(tokenId: string): Promise<number | null> {
  const key = sql.raw(`'${RESET_ATTEMPTS_METADATA_KEY}'`);
  const path = sql.raw(`'{${RESET_ATTEMPTS_METADATA_KEY}}'`);
  const [row] = await db
    .update(UserTokensTable)
    .set({
      metadata: sql`jsonb_set(coalesce(${UserTokensTable.metadata}, '{}'::jsonb), ${path}, to_jsonb(coalesce((${UserTokensTable.metadata}->>${key})::int, 0) + 1))`,
    })
    .where(
      and(eq(UserTokensTable.id, tokenId), isNull(UserTokensTable.consumedAt)),
    )
    .returning({ metadata: UserTokensTable.metadata });

  return row ? readResetAttempts(row.metadata) : null;
}

export async function requestPasswordResetAction(
  rawInput: z.infer<typeof passwordResetRequestSchema>,
): Promise<TypedResponse<object>> {
  const { t } = await getT();
  const { email } = await validateInput(passwordResetRequestSchema, rawInput);

  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail || !normalizedEmail.includes("@")) {
    return {
      isError: true,
      message: t("authTranslations.passwordReset.request.invalidEmail"),
    };
  }

  // Before the user lookup, so the answer never depends on whether the
  // account exists.
  if (await isPasswordResetRateLimited("request", normalizedEmail)) {
    return {
      isError: true,
      message: t("authTranslations.passwordReset.tooManyRequests"),
    };
  }

  const user = await db.query.UsersTable.findFirst({
    columns: { id: true, email: true, name: true },
    where: eq(UsersTable.email, normalizedEmail),
  });

  // Avoid account enumeration
  if (!user) {
    return { isError: false };
  }

  const otp = generateResetOtp();
  const tokenHash = hashPasswordResetOtp(normalizedEmail, otp);
  const expiresAt = new Date(Date.now() + PASSWORD_RESET_OTP_TTL_MS);

  await db.transaction(async (trx) => {
    await trx
      .delete(UserTokensTable)
      .where(
        and(
          eq(UserTokensTable.userId, user.id),
          eq(UserTokensTable.type, "password_reset"),
        ),
      );

    await trx.insert(UserTokensTable).values({
      userId: user.id,
      tokenHash,
      type: "password_reset",
      expiresAt,
      metadata: {
        email: user.email,
        normalizedEmail,
        otpLength: PASSWORD_RESET_OTP_LENGTH,
        [RESET_ATTEMPTS_METADATA_KEY]: 0,
      },
    });
  });

  try {
    await sendPasswordResetCodeEmail({
      to: user.email,
      name: user.name,
      code: otp,
      expiresInMinutes: Math.floor(PASSWORD_RESET_OTP_TTL_MS / (1000 * 60)),
    });
  } catch {
    // Best-effort cleanup to prevent dangling usable tokens
    await db
      .delete(UserTokensTable)
      .where(eq(UserTokensTable.tokenHash, tokenHash));
    return {
      isError: true,
      message: t("authTranslations.passwordReset.request.emailError"),
    };
  }

  return { isError: false };
}

export async function resetPasswordAction(
  rawInput: unknown,
): Promise<TypedResponse<{ message: string }>> {
  const { t } = await getT();
  const { email, otp, password } = await validateInput(
    passwordResetSubmissionSchema,
    rawInput,
  );

  const normalizedEmail = normalizeEmail(email);

  if (await isPasswordResetRateLimited("reset", normalizedEmail)) {
    return {
      isError: true,
      message: t("authTranslations.passwordReset.tooManyRequests"),
    };
  }

  // One message for every failure — unknown email, no code, wrong code,
  // revoked code — so a response never confirms an account or a lockout.
  const invalidCode = {
    isError: true,
    message: t("authTranslations.passwordReset.reset.invalidCode"),
  } as const;
  const now = new Date();

  const user = await db.query.UsersTable.findFirst({
    columns: { id: true },
    where: eq(UsersTable.email, normalizedEmail),
  });
  if (!user) return invalidCode;

  // A guess cannot be looked up by its hash (a wrong code finds nothing to
  // count against), so load the user's live reset token and compare.
  const tokenRecord = await db.query.UserTokensTable.findFirst({
    columns: { id: true, tokenHash: true },
    where: and(
      eq(UserTokensTable.userId, user.id),
      eq(UserTokensTable.type, "password_reset"),
      isNull(UserTokensTable.consumedAt),
      gt(UserTokensTable.expiresAt, now),
    ),
    orderBy: desc(UserTokensTable.createdAt),
  });
  if (!tokenRecord) return invalidCode;

  // Count the guess before checking it, so at most MAX_RESET_CODE_ATTEMPTS
  // guesses are ever compared, however many arrive in parallel.
  const attemptNumber = await recordResetAttempt(tokenRecord.id);
  if (attemptNumber === null) return invalidCode;

  const verdict = evaluateResetAttempt(
    attemptNumber,
    hashesMatch(
      tokenRecord.tokenHash,
      hashPasswordResetOtp(normalizedEmail, otp),
    ),
  );
  if (verdict !== "accept") {
    if (verdict === "reject_and_revoke") {
      await db
        .delete(UserTokensTable)
        .where(eq(UserTokensTable.id, tokenRecord.id));
    }
    return invalidCode;
  }

  const salt = generateSalt();
  const passwordHash = await hashPassword(password, salt);

  try {
    await db.transaction(async (trx) => {
      // Claim the token first: a code is good for exactly one reset.
      const [claimed] = await trx
        .update(UserTokensTable)
        .set({ consumedAt: now })
        .where(
          and(
            eq(UserTokensTable.id, tokenRecord.id),
            isNull(UserTokensTable.consumedAt),
          ),
        )
        .returning({ id: UserTokensTable.id });
      if (!claimed) throw new Error("Password reset token already used");

      const credentials = await trx.query.UserCredentialsTable.findFirst({
        columns: { userId: true },
        where: eq(UserCredentialsTable.userId, user.id),
      });

      if (credentials) {
        await trx
          .update(UserCredentialsTable)
          .set({
            passwordHash,
            passwordSalt: salt,
            mustChangePassword: false,
            lastChangedAt: now,
          })
          .where(eq(UserCredentialsTable.userId, user.id));
      } else {
        await trx.insert(UserCredentialsTable).values({
          userId: user.id,
          passwordHash,
          passwordSalt: salt,
          mustChangePassword: false,
          lastChangedAt: now,
        });
      }
    });
  } catch {
    return {
      isError: true,
      message: t("authTranslations.passwordReset.reset.error"),
    };
  }

  return {
    isError: false,
    message: t("authTranslations.profile.password.submit"),
  };
}
