# SMS & WhatsApp Notifications — Setup Guide

The code is built and wired into the automated fee-reminder flow as a
working example. It will stay silent (logged as "not configured" in the
Communication Log) until you add the environment variables below.

## Important: phone numbers aren't collected anywhere yet

This is the real first step, before either integration matters: **no
form in the app currently asks for or stores a phone number.** A `phone`
field now exists on the User model, but nothing writes to it yet. Before
SMS/WhatsApp can reach anyone, someone (a developer) needs to add a phone
field to the relevant creation/edit forms (Parent, Student, Teacher,
Staff) so there's actually a number on file to send to. This wasn't
built as part of this pass — flag it if you want it done next.

## WhatsApp — Meta WhatsApp Business Cloud API

This is Meta's own official, actively-maintained API - not a
third-party reseller.

1. Create a Meta Business Account and a WhatsApp Business Account (WABA)
   at **business.facebook.com** if you don't already have one.
2. In Meta for Developers (**developers.facebook.com**) → create an app
   → add the WhatsApp product.
3. Get a **permanent access token**: Business Manager → System Users →
   create an admin system user → generate a token with
   `whatsapp_business_messaging` permission. (A temporary token from the
   Quickstart page expires in 24 hours — don't use that for production.)
4. Note your **Phone Number ID** (shown in the WhatsApp → API Setup page
   in Meta for Developers — this is a numeric ID, not your actual phone
   number).
5. **Create and get approval for a message template** — WhatsApp requires
   a pre-approved template for any message you send that isn't a reply
   within 24 hours of the customer messaging you first. A "fee reminder"
   or "student absent" alert is exactly this kind of business-initiated
   message. Go to WhatsApp Manager → Message Templates → create one
   (e.g. named `school_notification`, category Utility, with a body like
   "{{1}}: {{2}}" to carry a title and message). Submission review by
   Meta usually takes minutes to a day.
6. Set these environment variables:

| Variable | Value |
|---|---|
| `WHATSAPP_ACCESS_TOKEN` | the permanent token from step 3 |
| `WHATSAPP_PHONE_NUMBER_ID` | from step 4 |
| `WHATSAPP_TEMPLATE_NAME` | the template name from step 5, once approved |
| `WHATSAPP_API_VERSION` | optional, defaults to `v21.0` |

## SMS — Twilio

Twilio was used here instead of a local Pakistani SMS reseller on
purpose: that market is fragmented (H3 Techs, EasySendSMS, Releans, and
others) with no single dominant, consistently-documented API — the same
"don't guess at an endpoint" concern as JazzCash. Twilio is
well-documented and does deliver SMS to Pakistani numbers. If you'd
rather use a specific local reseller instead (e.g. for cost or an
existing relationship), that's a similar swap in `server/src/utils/sms.ts`
once you have that provider's exact, current API documentation in hand.

1. Create an account at **twilio.com**.
2. From the Twilio Console, get your **Account SID** and **Auth Token**.
3. Buy or set up a Twilio phone number capable of sending SMS.
4. Set these environment variables:

| Variable | Value |
|---|---|
| `TWILIO_ACCOUNT_SID` | from step 2 |
| `TWILIO_AUTH_TOKEN` | from step 2 |
| `TWILIO_PHONE_NUMBER` | your Twilio number, e.g. `+15005550006` |

## What's already wired up

The automated Fee Due/Overdue reminder (Automation page → these two
rules) sends the same message via in-app notification, SMS, and WhatsApp
in parallel whenever a parent has a phone number and the relevant
channel is configured — none of the three block or depend on each other.
This is the reference implementation; the same pattern
(`sendSms(...).catch(() => {})` / `sendWhatsAppTemplate(...).catch(() =>
{})` right next to an existing `notify(...)` call) can be copied into
other automation triggers (Student Absent, Exam Approaching, Assignment
Deadline, Result Published) once you're ready to expand coverage.

Every attempt (success or failure) is recorded in Communication Log
(Admin sidebar), same as email.
