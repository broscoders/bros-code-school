# JazzCash Integration — Setup Guide

The code for JazzCash online fee payments is built and ready
(`server/src/utils/jazzcash.ts`, wired into the Parent Fees page). It
will not work until you complete JazzCash's own merchant onboarding and
add 5 values to your environment variables. This is not a "get an API
key instantly" service like Stripe — it's a real merchant account tied
to your bank, and JazzCash reviews it before activating.

## Step 1 — Apply for a JazzCash Merchant Account

1. Go to **https://www.jazzcash.com.pk** → Business / Merchant Services,
   or contact JazzCash's merchant onboarding team directly.
2. You'll need standard business documents: your organization's
   registration/NTN, a bank account for settlement, and owner CNIC.
   Since a school is a legitimate registered business, this is a normal
   application — it typically takes a few business days to a couple of
   weeks for approval, not instant.
3. Ask specifically for **API integration access** (Mobile Wallet /
   MWALLET transaction type), not just the JazzCash retail app.

## Step 2 — Get sandbox access first

Before going live, JazzCash gives you **sandbox** credentials to test
with fake transactions. Use these first:
- `sandbox.jazzcash.com.pk` — apply for sandbox access at
  https://sandbox.jazzcash.com.pk/SandboxDocumentation/ (their official
  developer portal — this is where sandbox merchant IDs are issued)

## Step 3 — Collect these 3 credentials

JazzCash will give you, for both sandbox and (later) live:
- **Merchant ID** (`pp_MerchantID`)
- **Password** (`pp_Password`)
- **Integrity Salt** (also called Hash Key — used to sign every request)

## Step 4 — Get the current API endpoint URL from JazzCash directly

This is important: **do not use an endpoint URL from a blog post or old
tutorial.** JazzCash's exact API path has changed across versions over
the years and different sources online disagree with each other. When
you get sandbox/live access, JazzCash's onboarding documentation or your
account manager will give you the *current* Mobile Wallet transaction
endpoint URL for your account. Use exactly that.

## Step 5 — Set these 5 environment variables

In Vercel (or wherever the server is hosted) → Settings → Environment
Variables, add:

| Variable | Value |
|---|---|
| `JAZZCASH_MERCHANT_ID` | from Step 3 |
| `JAZZCASH_PASSWORD` | from Step 3 |
| `JAZZCASH_INTEGRITY_SALT` | from Step 3 |
| `JAZZCASH_API_URL` | the exact URL from Step 4 |
| `JAZZCASH_RETURN_URL` | `https://yourdomain.com/parent/fees` (or wherever you want JazzCash to redirect back to — this can stay a placeholder for the Mobile Wallet flow used here, but JazzCash requires the field to be present) |

**Do this in sandbox first.** Set the sandbox values, test a payment
end-to-end from a real JazzCash sandbox test account, confirm it shows
up correctly on an invoice, *then* swap the 5 values to your live
credentials once you're confident it works.

## What happens if these aren't set

The "Pay via JazzCash" button on the Parent Fees page will show a clear
message — *"Online payment is not configured for this school yet. Please
pay through the school office."* — instead of failing silently or
crashing. Nothing else in the app is affected either way.

## Easypaisa (optional, separate integration)

Everything above is JazzCash-specific. Easypaisa is a separate
company with its own separate merchant application and API - if you also
want Easypaisa as a payment option, that's a second, similar integration
(different application process, different credentials, different API
shape) that isn't included in this build. Let your developer know if you
want that added once JazzCash is confirmed working.
