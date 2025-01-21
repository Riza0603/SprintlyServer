import nodemailer from "nodemailer";

var transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: "shreyas.ganglia@gmail.com",
    pass: "dahv ozwa kfzc ycob",
  },
  debug: true, // Enable debug output
});

// Async function to send email
export const sendEmail = async (to, subject, text) => {
  const mailOptions = {
    from: "Sprintly",
    to,
    subject,
    text,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent: " + info.response);
    return { success: true, response: info.response };
  } catch (error) {
    console.log("Error sending email:", error);
    return { success: false, error };
  }
};
