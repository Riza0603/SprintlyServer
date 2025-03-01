import transporter from "../config/emailTransporter.js";


//Project Addition Email
export const sendProjectAdditionEmail = async (emails, pname, pdescription, pstart, pend) => {
    if (!emails) return;

  const startDate = new Date(pstart).toDateString(); 
  const endDate = new Date(pend).toDateString();
    await transporter.sendMail({
        from: "sprintlyganglia@gmail.com",
        to: emails.join(","), 
        subject: `You have been added to the project: ${pname}`,
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f4f4f4; text-align: center;">
            <div style="max-width: 500px; margin: auto; background: #ffffff; padding: 30px; border-radius: 10px; 
                        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);">
              <h2 style="color: #333;">You're Now Part of <span style="color: #2563eb;">${pname}</span>!</h2>
              <p style="color: #555; font-size: 16px;">
                Dear Team Member, <br><br>
                We are pleased to inform you that you have been successfully added to the project 
                <strong style="color: #2563eb;">${pname}</strong>
              </p>
    
              <div style="background-color: #f8f9fa; padding: 15px; border-radius: 8px; margin: 15px 0; text-align: left;">
                <p style="font-size: 16px;"><strong>📌 Project Name:</strong> ${pname}</p>
                <p style="font-size: 16px;"><strong>📄 Description:</strong> ${pdescription}</p>
                <p style="font-size: 16px;"><strong>📅 Start Date:</strong> ${startDate}</p>
                <p style="font-size: 16px;"><strong>⏳ End Date:</strong> ${endDate}</p>
              </div>
    
              <p style="color: #555; font-size: 16px;">
                Click the button below to access the project dashboard and get started:
              </p>
    
              <a href="http://localhost:5173/user-registration"
                style="display: inline-block; padding: 15px 25px; font-size: 16px; font-weight: bold; color: #fff; 
                       background: #2563eb; border-radius: 8px; text-decoration: none; margin: 20px 0;">
                View Project
              </a>
    
              <footer style="margin-top: 20px; font-size: 12px; color: #888;">
                <p>&copy; ${new Date().getFullYear()} Sprintly. All rights reserved.</p>
              </footer>
            </div>
          </div>
        `,
      });
};

//Project Removal Email
export const sendProjectRemovalEmail = async (user, projectName) => {
    if (!user.email) return;

    await transporter.sendMail({
        from: "sprintlyganglia@gmail.com",
        to: user.email,
        subject: `You have been removed from the project: ${projectName}`,
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f4f4f4; text-align: center;">
            <div style="max-width: 500px; margin: auto; background: #ffffff; padding: 30px; border-radius: 10px; 
                        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);">
              <h2 style="color: #d32f2f;">Project Removal Notice</h2>
              <p style="color: #555; font-size: 16px;">
                Hello ${user.name}, you have been removed from the project 
                <strong style="color: #2563eb;">${projectName}</strong>.
              </p>
  
              <div style="background-color: #f8f9fa; padding: 15px; border-radius: 8px; margin: 15px 0; text-align: left;">
                <p style="font-size: 16px;"><strong>📌 Project Name:</strong> ${projectName}</p>
              </div>
  
              <p style="color: #555; font-size: 14px;">
                If you believe this was a mistake, please contact the project manager.
              </p>
  
              <footer style="margin-top: 20px; font-size: 12px; color: #888;">
                <p>&copy; ${new Date().getFullYear()} Sprintly. All rights reserved.</p>
              </footer>
            </div>
          </div>
        `,
      });  
};

//Task assignment email
export const sendTaskAssignmentEmail = async (user, project, title, description, startDate, endDate, priority, createdBy) => {
    if (!user.email) return;

await transporter.sendMail({
    from: "sprintlyganglia@gmail.com",
    to: user.email,
    subject: `New Task Assigned: ${title}`,
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f4f4f4; text-align: center;">
        <div style="max-width: 500px; margin: auto; background: #ffffff; padding: 30px; border-radius: 10px; 
                    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);">
          <h2 style="color: #2563eb;">New Task Assigned</h2>
          <p style="color: #555; font-size: 16px;">
            Hello ${user.name}, a new task has been assigned to you in the project 
            <strong style="color: #2563eb;">${project.pname}</strong>.
          </p>

          <div style="background-color: #f8f9fa; padding: 15px; border-radius: 8px; margin: 15px 0; text-align: left;">
            <p style="font-size: 16px;"><strong>📌 Task Title:</strong> ${title}</p>
            <p style="font-size: 16px;"><strong>📄 Description:</strong> ${description}</p>
            <p style="font-size: 16px;"><strong>📅 Start Date:</strong> ${startDate || "Not Set"}</p>
            <p style="font-size: 16px;"><strong>⏳ End Date:</strong> ${endDate || "Not Set"}</p>
            <p style="font-size: 16px;"><strong>🔹 Priority:</strong> ${priority}</p>
            <p style="font-size: 16px;"><strong>📌 Assigned By:</strong> ${createdBy}</p>
          </div>

          <a href="http://localhost:5173/user-registration"
            style="display: inline-block; padding: 15px 25px; font-size: 16px; font-weight: bold; color: #fff; 
                   background: #2563eb; border-radius: 8px; text-decoration: none; margin: 20px 0;">
            View Task
          </a>

          <footer style="margin-top: 20px; font-size: 12px; color: #888;">
            <p>&copy; ${new Date().getFullYear()} Sprintly. All rights reserved.</p>
          </footer>
        </div>
      </div>
    `,
  });
};

//Task Update Email
export const sendTaskUpdateEmail = async (user, project, title, changesList) => {
    if (!user.email) return;

await transporter.sendMail({
    from: "sprintlyganglia@gmail.com",
    to: user.email,
    subject: `Task Updated: ${title}`,
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f4f4f4; text-align: center;">
        <div style="max-width: 500px; margin: auto; background: #ffffff; padding: 30px; border-radius: 10px;
                    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);">
          <h2 style="color: #2563eb;">Task Updated</h2>
          <p style="color: #555; font-size: 16px;">
            Hello ${user.name}, the task <strong style="color: #2563eb;">${title}</strong> in project 
            <strong style="color: #2563eb;">${project.pname}</strong> has been updated.
          </p>

          <div style="background-color: #f8f9fa; font-size: 16px; padding: 15px; border-radius: 8px; margin: 15px 0; text-align: left;">
            ${changesList}
          </div>

          <a href="http://localhost:5173/user-registration"
            style="display: inline-block; padding: 15px 25px; font-size: 16px; font-weight: bold; color: #fff;
                  background: #2563eb; border-radius: 8px; text-decoration: none; margin: 20px 0;">
            View Task
          </a>

          <footer style="margin-top: 20px; font-size: 12px; color: #888;">
            <p>&copy; ${new Date().getFullYear()} Sprintly. All rights reserved.</p>
          </footer>
        </div>
      </div>
    `,
  });
};