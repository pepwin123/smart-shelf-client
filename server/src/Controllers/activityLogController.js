import ActivityLog from "../Models/activityLogModel.js";

export const logActivity = async (req, res, next) => {
  try {
    const { workspaceId, action, targetType, targetId, targetName, details } =
      req.body;
    const userId = req.user._id;

    if (!workspaceId || !action) {
      return res.status(400).json({
        success: false,
        message: "workspaceId and action required",
      });
    }

    const activity = await ActivityLog.create({
      workspaceId,
      userId,
      username: req.user.username,
      action,
      targetType,
      targetId,
      targetName,
      details,
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    });

    return res.status(201).json({
      success: true,
      activity,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to log activity",
      error: error.message,
    });
  }
};

// Get workspace activity log
export const getWorkspaceActivityLog = async (req, res, next) => {
  try {
    const { workspaceId } = req.params;
    const { limit = 50, skip = 0 } = req.query;

    const activities = await ActivityLog.getWorkspaceActivity(
      workspaceId,
      parseInt(limit),
      parseInt(skip)
    );

    const totalCount = await ActivityLog.countDocuments({ workspaceId });

    return res.status(200).json({
      success: true,
      activities,
      total: totalCount,
      limit: parseInt(limit),
      skip: parseInt(skip),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch activity log",
      error: error.message,
    });
  }
};

// Get user activity log
export const getUserActivityLog = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { limit = 50, skip = 0 } = req.query;

    const activities = await ActivityLog.getUserActivity(
      userId,
      parseInt(limit),
      parseInt(skip)
    );

    const totalCount = await ActivityLog.countDocuments({ userId });

    return res.status(200).json({
      success: true,
      activities,
      total: totalCount,
      limit: parseInt(limit),
      skip: parseInt(skip),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch user activity log",
      error: error.message,
    });
  }
};

// Get activity statistics
export const getActivityStats = async (req, res, next) => {
  try {
    const { workspaceId } = req.params;

    const stats = await ActivityLog.aggregate([
      { $match: { workspaceId: new require("mongoose").Types.ObjectId(workspaceId) } },
      {
        $group: {
          _id: "$action",
          count: { $sum: 1 },
        },
      },
      {
        $sort: { count: -1 },
      },
    ]);

    const topContributors = await ActivityLog.aggregate([
      { $match: { workspaceId: new require("mongoose").Types.ObjectId(workspaceId) } },
      {
        $group: {
          _id: "$userId",
          username: { $first: "$username" },
          count: { $sum: 1 },
        },
      },
      {
        $sort: { count: -1 },
      },
      {
        $limit: 10,
      },
    ]);

    return res.status(200).json({
      success: true,
      stats: {
        actionCounts: stats,
        topContributors,
        totalActivities: stats.reduce((sum, s) => sum + s.count, 0),
      },
    });
    
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to get activity stats",
      error: error.message,
    });
  }
};

// Clear old activities (cleanup - optional admin endpoint)
export const clearOldActivities = async (req, res, next) => {
  try {
    const { daysOld = 90 } = req.body;
    const cutoffDate = new Date(Date.now() - daysOld * 24 * 60 * 60 * 1000);

    const result = await ActivityLog.deleteMany({
      timestamp: { $lt: cutoffDate },
    });

    return res.status(200).json({
      success: true,
      message: `Deleted ${result.deletedCount} activities older than ${daysOld} days`,
      result,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to clear old activities",
      error: error.message,
    });
  }
};
