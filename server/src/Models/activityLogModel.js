import mongoose from "mongoose";

const activityLogSchema = new mongoose.Schema(
  {
    workspaceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Workspace",
      required: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    username: String,
    action: {
      type: String,
      enum: [
        "workspace-created",
        "workspace-updated",
        "book-added",
        "book-removed",
        "card-moved",
        "card-deleted",
        "note-added",
        "comment-added",
        "collaborator-added",
        "collaborator-removed",
      ],
      required: true,
    },
    targetType: {
      type: String,
      enum: ["workspace", "card", "note", "comment", "collaborator"],
    },
    targetId: String,
    targetName: String, // e.g., book title
    details: {
      fromColumn: String,
      toColumn: String,
      bookTitle: String,
      bookAuthor: String,
      commentText: String,
      oldValue: String,
      newValue: String,
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
    ipAddress: String,
    userAgent: String,
  },
  { timestamps: true }
);

// Index for quick queries
activityLogSchema.index({ workspaceId: 1, timestamp: -1 });
activityLogSchema.index({ userId: 1, timestamp: -1 });
activityLogSchema.index({ action: 1, timestamp: -1 });

// Static method to log activity
activityLogSchema.statics.logActivity = async function (data) {
  try {
    const activity = await this.create(data);
    return activity;
  } catch (error) {
    console.error("Error logging activity:", error);
    return null;
  }
};

// Get activities for a workspace
activityLogSchema.statics.getWorkspaceActivity = async function (
  workspaceId,
  limit = 50,
  skip = 0
) {
  try {
    const activities = await this.find({ workspaceId })
      .sort({ timestamp: -1 })
      .limit(limit)
      .skip(skip)
      .populate("userId", "username email");

    return activities;
  } catch (error) {
    console.error("Error fetching activities:", error);
    return [];
  }
};

// Get activities by user
activityLogSchema.statics.getUserActivity = async function (
  userId,
  limit = 50,
  skip = 0
) {
  try {
    const activities = await this.find({ userId })
      .sort({ timestamp: -1 })
      .limit(limit)
      .skip(skip)
      .populate("workspaceId", "name");

    return activities;
  } catch (error) {
    console.error("Error fetching user activities:", error);
    return [];
  }
};

const ActivityLog =
  mongoose.models.ActivityLog ||
  mongoose.model("ActivityLog", activityLogSchema);

export default ActivityLog;
