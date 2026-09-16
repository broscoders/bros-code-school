import rateLimit from "express-rate-limit";

// These endpoints send email (or attempt a login) and had no protection at
// all against being hammered - anyone could spam another person's inbox
// with verification/reset codes indefinitely (harassment + burns the
// school's email quota), or grind through login attempts across many
// different accounts without ever being IP-throttled. Per-account lockout
// (already in authController) only kicks in per account; this adds the
// missing per-IP ceiling the blueprint's "Login protection" requirement
// calls for.

export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many login attempts from this device. Please try again in a few minutes." },
});

export const emailActionLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many requests. Please wait a few minutes before trying again." },
});

// Looser than emailActionLimiter - that one guards a single person's own
// auth actions (their own password reset, their own invite acceptance),
// where 5 tries in 15 minutes is already generous. This one guards an
// *admin* bulk-inviting staff, which legitimately means dozens of emails
// in one sitting (onboarding a whole term's new teachers) - the limit
// here is about stopping runaway spam, not normal admin usage.
export const bulkEmailActionLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many invitations sent. Please wait a few minutes before sending more." },
});
