var nodemailer = require('nodemailer');

var transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: 'shreyas.ganglia@gmail.com',
    pass: 'dahv ozwa kfzc ycob'
  },
  debug: true // Enable debug output
});




var mailOptions = {
  from: 'shreyas.ganglia@gmail.com',
  to: 'shreyyy2103@gmail.com',
  subject: 'Sending Email using Node.js',
  text: 'That was easy!'
};

transporter.sendMail(mailOptions, function(error, info){
  if (error) {
    console.log(error);
  } else {
    console.log('Email sent: ' + info.response);
  }
});