import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { TaskDetail } from "./TaskDetail";
import { TaskCompletionModal } from "./TaskCompletionModal";
import { toast } from "sonner";

const CATEGORY_ICONS = {
  household: "🏠",
  pets: "🐕",
  elderly: "👴",
  digital: "💻",
  errands: "🛒",
  other: "✨"
};

const STATUS_COLORS = {
  open: "bg-blue-100 text-blue-800",
  assigned: "bg-yellow-100 text-yellow-800",
  in_progress: "bg-purple-100 text-purple-800",
  completed: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
};

interface User {
  _id: string;
  userType: "helper" | "seeker" | "both";
}

interface MyTasksProps {
  user: User;
}

export function MyTasks({ user }: MyTasksProps) {
  const [activeTab, setActiveTab] = useState<"posted" | "helping">("posted");
  const [selectedTask, setSelectedTask] = useState<string | null>(null);
  const [showCompletionModal, setShowCompletionModal] = useState<string | null>(null);

  const postedTasks = useQuery(api.tasks.getMyTasks, { type: "posted" });
  const helpingTasks = useQuery(api.tasks.getMyTasks, { type: "helping" });

  const assignTask = useMutation(api.tasks.assignTask);
  const completeTask = useMutation(api.tasks.completeTask);

  const handleAssignTask = async (taskId: string, helperId: string) => {
    try {
      await assignTask({ taskId: taskId as any, helperId: helperId as any });
      toast.success("Task assigned successfully!");
    } catch (error) {
      toast.error("Failed to assign task. Please try again.");
    }
  };

  const handleCompleteTask = async (taskId: string) => {
    try {
      await completeTask({ taskId: taskId as any });
      toast.success("Task marked as completed!");
      setShowCompletionModal(taskId);
    } catch (error) {
      toast.error("Failed to complete task. Please try again.");
    }
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString() + " " + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (selectedTask) {
    return (
      <TaskDetail
        taskId={selectedTask}
        onBack={() => setSelectedTask(null)}
        onAssignTask={handleAssignTask}
        onCompleteTask={handleCompleteTask}
      />
    );
  }

  const showTabs = user.userType === "both";
  const tasks = activeTab === "posted" ? postedTasks : helpingTasks;

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
    <>
      <div className="p-4 space-y-4">
        <div className="bg-white rounded-lg p-4 shadow-sm">
          <h2 className="font-semibold text-gray-900 mb-3">My Tasks</h2>
          
          {showTabs && (
            <div className="flex bg-gray-100 rounded-lg p-1 mb-4">
              <button
                onClick={() => setActiveTab("posted")}
                className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                  activeTab === "posted"
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Posted by Me
              </button>
              <button
                onClick={() => setActiveTab("helping")}
                className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                  activeTab === "helping"
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                I'm Helping
              </button>
            </div>
          )}
        </div>

        <div className="space-y-3">
          {tasks.length === 0 ? (
            <div className="bg-white rounded-lg p-8 text-center shadow-sm">
              <div className="text-4xl mb-4">
                {activeTab === "posted" ? "📝" : "🤝"}
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">
                {activeTab === "posted" ? "No tasks posted yet" : "No tasks you're helping with"}
              </h3>
              <p className="text-gray-600 text-sm">
                {activeTab === "posted" 
                  ? "Create your first task to get help from your neighbors."
                  : "Browse the task feed to find ways to help your community."
                }
              </p>
            </div>
          ) : (
            tasks.map((task) => (
              <div
                key={task._id}
                onClick={() => setSelectedTask(task._id)}
                className="bg-white rounded-lg p-4 shadow-sm border border-gray-100 cursor-pointer hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <span className="text-xl">
                      {CATEGORY_ICONS[task.category as keyof typeof CATEGORY_ICONS]}
                    </span>
                    <div>
                      <h3 className="font-semibold text-gray-900">{task.title}</h3>
                      {activeTab === "helping" && 'seeker' in task && task.seeker && (
                        <p className="text-sm text-gray-600">
                          by {task.seeker.name} • ⭐ {task.seeker.rating.toFixed(1)}
                        </p>
                      )}
                      {activeTab === "posted" && 'helper' in task && task.helper && (
                        <p className="text-sm text-gray-600">
                          helped by {task.helper.name} • ⭐ {task.helper.rating.toFixed(1)}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      STATUS_COLORS[task.status as keyof typeof STATUS_COLORS]
                    }`}>
                      {task.status.replace('_', ' ')}
                    </span>
                    <div className="text-sm font-semibold text-green-600 mt-1">
                      {task.rewardPoints} pts
                    </div>
                  </div>
                </div>

                <p className="text-gray-700 text-sm mb-3 line-clamp-2">
                  {task.description}
                </p>

                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>📍 {task.location.address}</span>
                  <span>{formatTime(task._creationTime)}</span>
                </div>

                {task.status === "open" && activeTab === "posted" && (
                  <div className="mt-3 text-xs text-blue-600">
                    {task.applicants.length} applicant{task.applicants.length !== 1 ? 's' : ''} waiting
                  </div>
                )}

                {task.status === "assigned" && (
                  <div className="mt-3 flex justify-end">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCompleteTask(task._id);
                      }}
                      className="bg-green-500 text-white px-3 py-1 rounded text-xs font-medium hover:bg-green-600"
                    >
                      Mark Complete
                    </button>
                  </div>
                )}

                {task.status === "completed" && (
                  <div className="mt-3 flex justify-end">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowCompletionModal(task._id);
                      }}
                      className="bg-blue-500 text-white px-3 py-1 rounded text-xs font-medium hover:bg-blue-600"
                    >
                      View Reviews
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Task Completion Modal */}
      {showCompletionModal && (
        <TaskCompletionModal
          taskId={showCompletionModal}
          onClose={() => setShowCompletionModal(null)}
        />
      )}
    </>
  );
}
