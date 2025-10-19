const nodemailer = require('nodemailer');
const { getEnvVar } = require('./env');

let transporter;

const getTransporter = () => {
  if (transporter) {
    return transporter;
  }

  const user = getEnvVar('GMAIL_USER');
  const pass = getEnvVar('GMAIL_APP_PASSWORD');

  transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user,
      pass,
    },
  });

  return transporter;
};

const sendLessonEmail = async ({ to, cc, subject, text, html, fromName, fromEmail }) => {
  const mailTransport = getTransporter();
  const response = await mailTransport.sendMail({
    from: `"${fromName}" <${fromEmail}>`,
    to,
    cc: cc && cc.length > 0 ? cc : undefined,
    subject,
    text,
    html,
  });
  return response;
};

module.exports = {
  sendLessonEmail,
};
