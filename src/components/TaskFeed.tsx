import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";

const CATEGORY_ICONS = {
  household: "🏠",
  pets: "🐕",
  elderly: "👴",
  digital: "💻",
  errands: "🛒",
  other: "✨"
};

const CATEGORY_LABELS = {
  household: "Household",
  pets: "Pet Care",
  elderly: "Elderly Care",
  digital: "Tech Help",
  errands: "Errands",
  other: "Other"
};

interface User {
  _id: string;
  location: {
    lat: number;
    lng: number;
    address: string;
  };
}

interface TaskFeedProps {
  user: User;
}

export function TaskFeed({ user }: TaskFeedProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>();
  const [radius, setRadius] = useState(10);

  const tasks = useQuery(api.tasks.getNearbyTasks, {
    lat: user.location.lat,
    lng: user.location.lng,
    radiusKm: radius,
    category: selectedCategory as any,
  });

  const applyForTask = useMutation(api.tasks.applyForTask);

  const handleApply = async (taskId: string) => {
    try {
      await applyForTask({ taskId: taskId as any });
      toast.success("Applied successfully! The task owner will review your application.");
    } catch (error) {
      toast.error("Failed to apply. Please try again.");
    }
  };

  const formatDistance = (taskLat: number, taskLng: number) => {
    const R = 6371; // Earth's radius in km
    const dLat = (taskLat - user.location.lat) * Math.PI / 180;
    const dLon = (taskLng - user.location.lng) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(user.location.lat * Math.PI / 180) * Math.cos(taskLat * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;
    return distance < 1 ? `${Math.round(distance * 1000)}m` : `${distance.toFixed(1)}km`;
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) return `${diffDays}d ago`;
    if (diffHours > 0) return `${diffHours}h ago`;
    return "Just now";
  };

  if (tasks === undefined) {
    return (
      <div className="p-4">
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-lg p-4 shadow-sm">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      {/* Filters */}
      <div className="bg-white rounded-lg p-4 shadow-sm">
        <h2 className="font-semibold text-gray-900 mb-3">Find Tasks Near You</h2>
        
        {/* Radius Filter */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Distance: {radius}km
          </label>
          <input
            type="range"
            min="1"
            max="50"
            value={radius}
            onChange={(e) => setRadius(Number(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
          />
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedCategory(undefined)}
            className={`px-3 py-1 rounded-full text-sm ${
              !selectedCategory
                ? 'bg-green-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All
          </button>
          {Object.entries(CATEGORY_ICONS).map(([category, icon]) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-3 py-1 rounded-full text-sm flex items-center space-x-1 ${
                selectedCategory === category
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <span>{icon}</span>
              <span>{CATEGORY_LABELS[category as keyof typeof CATEGORY_LABELS]}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Task List */}
      <div className="space-y-3">
        {tasks.length === 0 ? (
          <div className="bg-white rounded-lg p-8 text-center shadow-sm">
            <div className="text-4xl mb-4">🔍</div>
            <h3 className="font-semibold text-gray-900 mb-2">No tasks found</h3>
            <p className="text-gray-600 text-sm">
              Try expanding your search radius or check back later for new tasks.
            </p>
          </div>
        ) : (
          tasks.map((task) => (
            <div key={task._id} className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <span className="text-xl">
                    {CATEGORY_ICONS[task.category as keyof typeof CATEGORY_ICONS]}
                  </span>
                  <div>
                    <h3 className="font-semibold text-gray-900">{task.title}</h3>
                    <p className="text-sm text-gray-600">
                      by {task.seeker?.name} • ⭐ {task.seeker?.rating.toFixed(1)}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold text-green-600">
                    {task.rewardPoints} pts
                  </div>
                  <div className="text-xs text-gray-500">
                    {formatDistance(task.location.lat, task.location.lng)}
                  </div>
                </div>
              </div>

              <p className="text-gray-700 text-sm mb-3 line-clamp-2">
                {task.description}
              </p>

              <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                <span>📍 {task.location.address}</span>
                <span>{formatTime(task._creationTime)}</span>
              </div>

              {task.scheduledTime && (
                <div className="text-xs text-blue-600 mb-3">
                  ⏰ Scheduled for {new Date(task.scheduledTime).toLocaleDateString()}
                </div>
              )}

              <div className="flex items-center justify-between">
                <div className="text-xs text-gray-500">
                  {task.applicants.length} applicant{task.applicants.length !== 1 ? 's' : ''}
                </div>
                <button
                  onClick={() => handleApply(task._id)}
                  className="bg-green-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-600 transition-colors"
                >
                  Apply to Help
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
