import NotificationModel from "../models/Notification.js";

export const createNotification = async ({ user_id, type, message, entity_id, metadata = {} }) => {
  try {
    // Validate required fields
    if (!user_id || !type || !message || !entity_id) {
      console.warn("Missing required fields for notification:", { user_id, type, message, entity_id });
      return;
    }

    // Create and save the notification
    const notification = new NotificationModel({
      user_id,
      type,
      message,
      entity_id,
      metadata,
      is_read: false,
      created_at: new Date(),
    });

    await notification.save();
    //console.log("Notification created successfully:", notification);
  } catch (error) {
    console.error("Error creating notification:", error);
  }
};


export const getNotifications = async (req, res) => {
  try {
    const userId = req.params.userId;
    //console.log("Fetching notifications for user:", userId);

    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    const notifications = await NotificationModel.find({ user_id: userId }) 
      .sort({ created_at: -1 });

    // Format response to merge metadata into the main object
    const formattedNotifications = notifications.map(notification => ({
      ...notification.toObject(),
      ...(notification.metadata || {}) 
    }));

    res.status(200).json(formattedNotifications);
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({ message: "Error fetching notifications" });
  }
};


  
// Mark Single Notification as Read
export const markNotificationAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`🔍 Marking notification ID: ${id}`); 

    const notification = await NotificationModel.findByIdAndUpdate(id, { is_read: true });

    if (!notification) {
      return res.status(404).json({ message: "Notification not found" }); 
    }

    res.status(200).json({ message: "Notification marked as read" });
  } catch (error) {
    console.error("❌ Error marking notification as read:", error);
    res.status(500).json({ message: "Error updating notification" });
  }
};


// Mark All Notifications as Read for a User
export const markAllNotificationsAsRead = async (req, res) => {
    try {
      const { userId } = req.params;
      await NotificationModel.updateMany({ user_id: userId }, { is_read: true });
      res.status(200).json({ message: "All notifications marked as read" });
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
      res.status(500).json({ message: "Error updating notifications" });
    }
};



export const getUnreadNotificationCount = async (req, res) => {
  try {
    const { userId } = req.params;
    const unreadCount = await NotificationModel.countDocuments({ user_id: userId, is_read: false });

    res.status(200).json({ count: unreadCount }); // Use 'count' for frontend consistency
  } catch (error) {
    console.error("Error fetching unread count:", error);
    res.status(500).json({ message: "Error fetching unread count" });
  }
};


export const clearNotifications = async (req, res) => {
  try {
    const { userId } = req.params; 
    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    // Delete all notifications for the user
    const result = await NotificationModel.deleteMany({ user_id: userId });

    return res.status(200).json({ 
      message: "All notifications cleared successfully", 
      deletedCount: result.deletedCount 
    });
  } catch (error) {
    console.error("Error clearing notifications:", error);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};