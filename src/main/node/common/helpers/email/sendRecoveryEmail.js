const { Buffer } = require('buffer');
const transporter = require('../../config/email');
const { variables } = require('../../config/env');

async function sendRecoveryEmail(to, code) {
  let html;
  const template = variables.email.recoverHtml;
  if (!template) throw new Error('No hay template de recuperación en variables de entorno');
  const decoded = Buffer.from(template, 'base64').toString('utf-8');
  const link = `${variables.email.frontendUrl}/reset/${code}`;
  html = decoded.replace(/:link/g, link);

  const mailOptions = {
    from: variables.email.from,
    to,
    subject: variables.email.recoverSubject,
    html,
  };

  await transporter.sendMail(mailOptions);
}

module.exports = sendRecoveryEmail;
