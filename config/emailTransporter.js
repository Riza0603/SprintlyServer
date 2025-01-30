const nodemailer= require('nodemailer');

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: "sprintlyganglia@gmail.com",
    pass: "wkok oeee drxd kmcg",
  },
  logger: true,
  debug: true,
});

export default transporter;
