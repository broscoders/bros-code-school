// Central place for resolving JWT signing secrets. In production we refuse to
// start with a missing secret rather than silently falling back to a value
// that is committed to source control (anyone reading the repo would then be
// able to forge valid tokens, including for admin/platform-admin accounts).
// In development, a fallback keeps local setup friction-free.

const DEV_FALLBACK = "dev_secret_change_this";
const isProduction = process.env.NODE_ENV === "production";

function resolveSecret(envValue: string | undefined, name: string): string {
  if (envValue && envValue.trim().length > 0) return envValue;
  if (isProduction) {
    throw new Error(
      `${name} is not set. Refusing to start in production with a missing JWT secret ` +
        `(a hardcoded fallback would let anyone who has read the source code forge valid tokens).`
    );
  }
  return DEV_FALLBACK;
}

export function getJwtSecret(): string {
  return resolveSecret(process.env.JWT_SECRET, "JWT_SECRET");
}

export function getPlatformJwtSecret(): string {
  return resolveSecret(process.env.PLATFORM_JWT_SECRET || process.env.JWT_SECRET, "PLATFORM_JWT_SECRET or JWT_SECRET");
}
