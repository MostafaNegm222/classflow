const nodemailer = require("nodemailer");

// One reusable SMTP transport built from environment variables.
function createTransport() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
}

async function sendPasswordResetEmail(to, resetUrl) {
  await createTransport().sendMail({
    from: process.env.EMAIL_FROM,
    to,
    subject: "ClassFlow password reset",
    text: `Reset your ClassFlow password here (valid for 15 minutes): ${resetUrl}`,
  });
}

module.exports = { sendPasswordResetEmail };
