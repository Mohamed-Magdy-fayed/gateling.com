import { expect, type Page, test } from "@playwright/test";

/**
 * Sign-up -> /my-account critical path. Each test creates its own account
 * so it tolerates parallel runs (per playbooks/playwright.md).
 */

function uniqueEmail() {
  return `qa-e2e-${Date.now()}-${Math.random().toString(36).slice(2)}@gateling.com`;
}

function uniquePhone() {
  // Egyptian mobile format (01[0125]xxxxxxxx) with a unique 8-digit suffix
  // so parallel/repeated runs don't collide on the users.phone unique index.
  const suffix = Date.now().toString().slice(-8);
  return `010${suffix}`;
}

/**
 * The sign-up form waits for a Turnstile token (test keys pass instantly,
 * but asynchronously); submitting before it lands shows a "still checking"
 * toast instead of signing up.
 */
async function waitForTurnstileToken(page: Page) {
  await expect(
    page.locator('input[name="cf-turnstile-response"]'),
  ).not.toHaveValue("", { timeout: 15_000 });
}

test("sign-up redirects to /my-account without an error toast", async ({
  page,
}) => {
  // Regression: signUpAction redirects on success, and Next.js implements
  // redirect() by throwing — sign-up-form.tsx used to wrap the call in
  // toast.promise, which caught that throw and showed a scary
  // "An error occurred NEXT_REDIRECT" toast right after a successful signup.
  await page.goto("/sign-up");

  await page.getByLabel("Name").fill("QA E2E User");
  await page.getByLabel("Email").fill(uniqueEmail());
  await page.getByLabel("Phone number").fill(uniquePhone());
  await page.getByLabel("Password").fill("QaTest12345!");
  await waitForTurnstileToken(page);

  await page.getByRole("button", { name: "Sign Up" }).click();

  await expect(page).toHaveURL(/\/my-account/, { timeout: 10_000 });
  await expect(page.getByText(/error occurred/i)).toHaveCount(0);
  await expect(page.getByText(/NEXT_REDIRECT/i)).toHaveCount(0);
});

test("fresh account sees the empty inquiries/calls state on /my-account", async ({
  page,
}) => {
  await page.goto("/sign-up");
  await page.getByLabel("Name").fill("QA E2E User");
  await page.getByLabel("Email").fill(uniqueEmail());
  await page.getByLabel("Phone number").fill(uniquePhone());
  await page.getByLabel("Password").fill("QaTest12345!");
  await waitForTurnstileToken(page);
  await page.getByRole("button", { name: "Sign Up" }).click();

  await expect(page).toHaveURL(/\/my-account/, { timeout: 10_000 });
  await expect(page.getByText(/No inquiries yet/i)).toBeVisible();
  await expect(page.getByText(/No calls booked yet/i)).toBeVisible();
});

test("sign-up with the honeypot filled is rejected and creates no session", async ({
  page,
}) => {
  await page.goto("/sign-up");
  await page.getByLabel("Name").fill("QA E2E User");
  await page.getByLabel("Email").fill(uniqueEmail());
  await page.getByLabel("Phone number").fill(uniquePhone());
  await page.getByLabel("Password").fill("QaTest12345!");
  // What a form-filling bot does: every input gets a value.
  await page
    .locator('input[name="website"]')
    .fill("https://spam.example", { force: true });
  await waitForTurnstileToken(page);
  await page.getByRole("button", { name: "Sign Up" }).click();

  await expect(page.getByText(/couldn't verify this request/i)).toBeVisible();
  await expect(page).toHaveURL(/\/sign-up/);
});
