import nodemailer from "nodemailer";

type InvitationMail = {
  to: string;
  tenantName: string;
  role: string;
  inviteUrl: string;
};

export async function sendInvitationEmail(input: InvitationMail) {
  if (!process.env.SMTP_HOST || !process.env.SMTP_FROM) {
    return { sent: false, reason: "smtp_not_configured" as const };
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: Number(process.env.SMTP_PORT ?? 587) === 465,
    auth:
      process.env.SMTP_USER || process.env.SMTP_PASSWORD
        ? {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASSWORD
          }
        : undefined
  });

  await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to: input.to,
    subject: `Einladung zu ${input.tenantName}`,
    text: `Du wurdest als ${input.role} zu ${input.tenantName} eingeladen.\n\n${input.inviteUrl}`,
    html: `<p>Du wurdest als <strong>${input.role}</strong> zu <strong>${input.tenantName}</strong> eingeladen.</p><p><a href="${input.inviteUrl}">Einladung annehmen</a></p>`
  });

  return { sent: true as const };
}
