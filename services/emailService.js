import transporter from "../config/emailTransporter.js";

export const sendEmail = async (email, subject, content, type) => {
    let emailHtml;

    if (type === "verifyOTP" || type === "resendOTP") {
        emailHtml = `
        <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f4f4f4; text-align: center;">
          <div style="max-width: 500px; margin: auto; background: #ffffff; padding: 30px; border-radius: 10px; 
                      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1); text-align: left;">
            
            <div style="display: flex; align-items: center; margin-bottom: 20px;">
              <img src="https://res.cloudinary.com/dkpvbsfee/image/upload/v1740632251/sprintlyLogo_wn57mg.png" 
                   alt="Sprintly Logo" width="50" 
                   style="margin-right: 10px;">
              <h2 style="font-style: italic; color: #333; margin: 0; line-height: 50px;">Sprintly</h2>
            </div>

            <h2 style="color: #333; text-align: center;">Verify Your Email</h2>
            <p style="color: #555; font-size: 16px; text-align: center;">
              Use the OTP below to verify your email:
            </p>

            <div style="width: 100%; display: flex; justify-content: center; margin: 20px 0;">
              <div style="padding: 15px 25px; font-size: 24px; font-weight: bold; color: #fff; background: #2563eb; 
                          border-radius: 8px; text-align: center; margin-left: auto; margin-right: auto;">
                ${content}  <!-- OTP Code Here -->
              </div>
            </div>

            <p style="color: #555; font-size: 14px; text-align: center;">
              This OTP is valid for a limited time. If you did not request this, please ignore this email.
            </p>

            <a href="mailto:sprintlyganglia@gmail.com" 
               style="display: block; text-align: center; margin-top: 15px; color: #2563eb; font-size: 14px; text-decoration: none;">
              Need help? Contact Support
            </a>

            <footer style="margin-top: 20px; font-size: 12px; color: #888; text-align: center;">
              <p>&copy; ${new Date().getFullYear()} Sprintly. All rights reserved.</p>
            </footer>

          </div>
        </div>
      `;
    } else if (type === "resetPassword") {
        emailHtml = `
        <div style="font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 40px 0; text-align: center;">
          <div style="max-width: 500px; margin: auto; background: #ffffff; padding: 30px; border-radius: 10px; 
                      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1); text-align: left;">
            
            <div style="display: flex; align-items: center; margin-bottom: 20px;">
              <img src="https://res.cloudinary.com/dkpvbsfee/image/upload/v1740632251/sprintlyLogo_wn57mg.png" 
                   alt="Sprintly Logo" width="50" 
                   style="margin-right: 10px;">
              <h2 style="font-style: italic; color: #333; margin: 0; line-height: 50px;">Sprintly</h2>
            </div>

            <h2 style="color: #333; margin-bottom: 15px;">Reset Your Password</h2>
            <p style="color: #555; font-size: 16px; margin-bottom: 20px;">
              We received a request to reset your password. Click the button below to proceed:
            </p>

            <a href="${content}"
               style="display: inline-block; padding: 14px 28px; font-size: 16px; font-weight: bold; color: #fff; 
                      background: #2563eb; border-radius: 6px; text-decoration: none;">
              Reset Password
            </a>

            <p style="color: #555; font-size: 14px; margin-top: 20px;">
              If you did not request a password reset, please ignore this email.
            </p>

            <a href="mailto:sprintlyganglia@gmail.com" 
               style="display: block; text-align: center; margin-top: 15px; color: #2563eb; font-size: 14px; text-decoration: none;">
              Need help? Contact Support
            </a>

            <footer style="margin-top: 30px; font-size: 12px; color: #888; text-align: center;">
              <p>&copy; ${new Date().getFullYear()} Sprintly. All rights reserved.</p>
            </footer>

          </div>
        </div>
      `;
    }

    const mailOptions = {
        from: "Sprintly <your-email@example.com>",
        to: email,
        subject,
        html: emailHtml,
    };

    try {
        await transporter.sendMail(mailOptions);
        return true;
    } catch (error) {
        console.error("Error sending email:", error);
        return false;
    }
};
