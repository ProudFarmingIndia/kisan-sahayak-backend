const nodemailer = require('nodemailer');

// Create reusable transporter
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: Number(process.env.EMAIL_PORT),
  secure: false, // false for port 587
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

/**
 * Send OTP email
 */
const sendOtpEmail = async (to, otp) => {
  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to,
    subject: 'Kisan Sahayak - Password Reset OTP',
    html: `
      <h2>Password Reset OTP</h2>
      <p>Your OTP is:</p>
      <h1>${otp}</h1>
      <p>This OTP will expire in 10 minutes.</p>
      <p>If you did not request this, please ignore this email.</p>
    `,
  };

  const info = await transporter.sendMail(mailOptions);

  console.log('Email sent:', info.messageId);

  return info;
};

module.exports = {
  sendOtpEmail,
};