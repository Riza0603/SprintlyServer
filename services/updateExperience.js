import cron from "node-cron";
import UserModel from "../models/User.js";
import { calculateExperience } from "./calculateExperience.js";

// Runs every minute for debugging/demo purposes
cron.schedule("0 0 1 * *", async () => {
  //console.log("⏳ Running experience update job...");

  try {
    const users = await UserModel.find({ dateOfJoining: { $exists: true } });

    for (const user of users) {
      const newExperience = calculateExperience(user.dateOfJoining);

      if (user.experience !== newExperience) {
        console.log(`🔁 Updating ${user.name}: ${user.experience} → ${newExperience}`);
        user.experience = newExperience;
        await user.save();
      }
    }

    console.log("✅ Experience update completed.");
  } catch (error) {
    console.error("❌ Error updating experience:", error);
  }
});
