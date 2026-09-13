import nodemailer from "nodemailer";

// SMTP configuration comes from environment variables — see .env.
// SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, EMAIL_FROM
let transporter: nodemailer.Transporter | null = null;

function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: Number(process.env.SMTP_PORT) === 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }
  return transporter;
}

export async function sendMail(to: string, subject: string, html: string) {
  // If SMTP isn't configured yet (e.g. local dev without credentials), don't crash
  // the request — just log so the flow can still be tested end-to-end.
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.warn(`[mailer] SMTP not configured — would have sent "${subject}" to ${to}`);
    console.warn(html);
    return;
  }

  await getTransporter().sendMail({
    from: process.env.EMAIL_FROM || process.env.SMTP_USER,
    to,
    subject,
    html,
  });
}

export function generateSixDigitCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export function verificationEmailHtml(name: string, code: string) {
  return `
    <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
      <h2 style="color:#1e293b;">Verify your email</h2>
      <p>Hi ${name},</p>
      <p>Use the code below to verify your account. It expires in 15 minutes.</p>
      <p style="font-size: 28px; font-weight: bold; letter-spacing: 6px; color:#1d3557;">${code}</p>
      <p style="color:#64748b; font-size: 13px;">If you didn't request this, you can ignore this email.</p>
    </div>
  `;
}

export function invitationEmailHtml(name: string, inviteUrl: string, roleLabel: string, schoolName: string) {
  return `
    <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
      <h2 style="color:#1e293b;">You've been invited to ${schoolName}</h2>
      <p>Hi ${name},</p>
      <p>You've been invited to join ${schoolName} as a <strong>${roleLabel}</strong>.</p>
      <p style="margin: 24px 0;">
        <a href="${inviteUrl}" style="background:#1d3557; color:#fff; padding:12px 20px; border-radius:6px; text-decoration:none; font-weight:bold;">Accept invitation</a>
      </p>
      <p style="color:#64748b; font-size: 13px;">This invitation expires in 7 days. If you weren't expecting this, you can ignore this email.</p>
    </div>
  `;
}

export function loginAlertEmailHtml(name: string, code: string) {
  return `
    <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
      <h2 style="color:#c0392b;">Multiple failed login attempts</h2>
      <p>Hi ${name},</p>
      <p>There have been several unsuccessful login attempts on your account. For your safety, the account has been temporarily locked.</p>
      <p>If this wasn't you, use the code below to reset your password:</p>
      <p style="font-size: 28px; font-weight: bold; letter-spacing: 6px; color:#1d3557;">${code}</p>
      <p style="color:#64748b; font-size: 13px;">If this was you, just wait 15 minutes and try logging in again.</p>
    </div>
  `;
}

export function passwordResetEmailHtml(name: string, code: string) {
  return `
    <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
      <h2 style="color:#1e293b;">Reset your password</h2>
      <p>Hi ${name},</p>
      <p>Use the code below to reset your password. It expires in 15 minutes.</p>
      <p style="font-size: 28px; font-weight: bold; letter-spacing: 6px; color:#1d3557;">${code}</p>
      <p style="color:#64748b; font-size: 13px;">If you didn't request this, you can ignore this email — your password will stay the same.</p>
    </div>
  `;
}

export function bulkAccountCreatedEmailHtml(name: string, email: string, tempPassword: string, schoolName: string, loginUrl: string) {
  return `
    <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
      <h2 style="color:#1e293b;">Your ${schoolName} account is ready</h2>
      <p>Hi ${name},</p>
      <p>An account has been created for you. Please log in and change your password right away.</p>
      <p><strong>Email:</strong> ${email}<br/><strong>Temporary password:</strong> <span style="font-family: monospace; font-size: 16px;">${tempPassword}</span></p>
      <p style="margin: 24px 0;">
        <a href="${loginUrl}" style="background:#1d3557; color:#fff; padding:12px 20px; border-radius:6px; text-decoration:none; font-weight:bold;">Log in</a>
      </p>
      <p style="color:#64748b; font-size: 13px;">You'll be asked to set a new password the first time you log in.</p>
    </div>
  `;
}
