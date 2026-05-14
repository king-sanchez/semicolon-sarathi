const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

async function sendEmail(email, schemes) {

  const content = schemes
    .map((s) => `- ${s.schemeName}`)
    .join("\n");

  await transporter.sendMail({
    from: process.env.SMTP_USER,
    to: email,
    subject: "New Government Schemes Available",
    text: `You are eligible for:
${content}`,
  });
}

module.exports = {
  sendEmail,
};
