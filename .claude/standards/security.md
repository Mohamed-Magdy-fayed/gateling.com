# Standard: Security (Authentication / Authorization / Defensive Coding)

Enforced by the `security` agent on high-risk changes; applies to all code always.

## Authorization (the #1 real-world failure)

1. Every data access verifies the caller's right to *that resource* — ownership or role, server-side. Client-supplied IDs are untrusted claims (IDOR).
2. Authorization at the data-access layer or procedure body, not only in UI (hiding a button is not access control) and not only in middleware (route-level checks miss object-level access).
3. Deny by default: new procedures start protected; public is the explicit exception.
4. Role checks read from the session/DB server-side — never from client-provided role fields.

## Authentication & sessions

- Session tokens: httpOnly, secure, sameSite cookies; rotated on privilege change; server-side revocation possible.
- Credentials: passwords hashed with a modern KDF (argon2/bcrypt); constant-time comparison; rate-limited + lockout on auth endpoints.
- OAuth/WebAuthn flows: validate `state`/challenge; verify token audience and issuer.
- Password reset and email-change flows are auth-critical: single-use, expiring tokens; notify the old address.

## Input & output

- All external input (API, forms, webhooks, query params, headers) schema-validated at the boundary.
- SQL through the ORM/parameterization only. HTML output escaped by the framework — `dangerouslySetInnerHTML` requires sanitization and a review.
- File uploads: validate type by content not extension, cap size, store outside the web root (Firebase Storage), serve with safe content-type; never execute or path-join user filenames.
- SSRF: user-supplied URLs are fetched only through an allowlist.

## Secrets & data

- Secrets in env/secret manager only — never code, logs, client bundles (`NEXT_PUBLIC_` is public by definition), or error messages.
- Log user IDs, not PII payloads. Error responses to clients carry no stack traces or query text.
- Audit log for sensitive actions: who, what, when (see `standards/errors-observability.md`).

## Dependencies

- New deps: maintained, widely used, no known CVEs, license-compatible. Advisories triaged by actual exposure (`/deps`).
