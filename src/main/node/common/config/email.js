const nodemailer = require('nodemailer');
const { variables } = require('../config/env');

const transporter = nodemailer.createTransport({
  host: variables.email.host,
  port: variables.email.port,
  secure: variables.email.secure,
  auth: {
    user: variables.email.user,
    pass: variables.email.pass
  },
  tls: {
    rejectUnauthorized: variables.email.tlsRejectUnauthorized,
  },
});

module.exports = transporter;
