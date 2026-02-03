import React, { useState, useEffect } from "react";
import { Bell, User, Plus, Trash2, Move } from "lucide-react";

export default function ActivityFeed({ socket, workspaceId }) {
  const [activities, setActivities] = useState([]);
  const [isVisible, setIsVisible] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!socket || !workspaceId) return;

    // Listen for real-time book additions
    socket.on("book-added-real-time", (data) => {
      const activity = {
        id: `activity-${Date.now()}`,
        type: "book-added",
        user: data.username,
        userId: data.userId,
        book: data.book,
        message: data.message,
        timestamp: data.timestamp,
      };
      setActivities((prev) => [activity, ...prev.slice(0, 49)]); // Keep last 50
      setUnreadCount((prev) => prev + 1);
    });

    // Listen for card moved events
    socket.on("workspace-updated", () => {
      // Could track card movements here (placeholder)
    });

    // Listen for activity log events
    socket.on("activity-added", (activity) => {
      setActivities((prev) => [
        {
          ...activity,
          id: `activity-${Date.now()}`,
        },
        ...prev.slice(0, 49),
      ]);
      setUnreadCount((prev) => prev + 1);
    });

    return () => {
      socket.off("book-added-real-time");
      socket.off("activity-added");
      socket.off("workspace-updated");
    };
  }, [socket, workspaceId]);

  const getActivityIcon = (type) => {
    switch (type) {
      case "book-added":
        return <Plus className="text-green-400" size={16} />;
      case "card-moved":
        return <Move className="text-blue-400" size={16} />;
      case "card-deleted":
        return <Trash2 className="text-red-400" size={16} />;
      default:
        return <Bell className="text-gray-400" size={16} />;
    }
  };

  const getActivityColor = (type) => {
    switch (type) {
      case "book-added":
        return "bg-green-900 border-green-700";
      case "card-moved":
        return "bg-blue-900 border-blue-700";
      case "card-deleted":
        return "bg-red-900 border-red-700";
      default:
        return "bg-gray-800 border-gray-700";
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-40">
      {/* Notification Bell */}
      <button
        onClick={() => {
          setIsVisible(!isVisible);
          if (!isVisible) setUnreadCount(0);
        }}
        className="relative mb-4 p-3 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg transition"
      >
        <Bell size={24} />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* Activity Feed Panel */}
      {isVisible && (
        <div className="absolute bottom-20 right-0 w-96 max-h-96 bg-gray-800 border border-gray-700 rounded-lg shadow-xl overflow-hidden flex flex-col">
          <div className="bg-gray-900 border-b border-gray-700 p-4">
            <h3 className="text-white font-bold text-lg">Activity Feed</h3>
            <p className="text-gray-400 text-xs">Real-time workspace updates</p>
          </div>

          <div className="overflow-y-auto flex-1">
            {activities.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <Bell size={32} className="mx-auto mb-2 opacity-50" />
                <p>No activities yet</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-700">
                {activities.map((activity) => (
                  <div
                    key={activity.id}
                    className={`p-3 border-l-4 ${getActivityColor(activity.type)}`}
                  >
                    <div className="flex gap-3">
                      <div className="shrink-0 mt-1">
                        {getActivityIcon(activity.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 bg-linear-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shrink-0">
                            <User size={12} className="text-white" />
                          </div>
                          <p className="text-white font-medium text-sm">
                            {activity.user}
                          </p>
                        </div>
                        <p className="text-gray-300 text-sm mt-1">
                          {activity.message}
                        </p>
                        {activity.book && (
                          <div className="mt-2 bg-gray-700 rounded p-2">
                            <p className="text-white text-xs font-medium truncate">
                              {activity.book.title}
                            </p>
                            {activity.book.author && (
                              <p className="text-gray-400 text-xs truncate">
                                {activity.book.author}
                              </p>
                            )}
                          </div>
                        )}
                        <p className="text-gray-500 text-xs mt-1">
                          {new Date(activity.timestamp).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={() => {
              setActivities([]);
              setIsVisible(false);
            }}
            className="w-full bg-gray-700 hover:bg-gray-600 text-gray-300 p-2 text-xs font-medium transition"
          >
            Clear All
          </button>
        </div>
      )}
    </div>
  );
}
