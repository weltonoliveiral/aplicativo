import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";
import { TaskCompletionModal } from "./TaskCompletionModal";

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

interface TaskDetailProps {
  taskId: string;
  onBack: () => void;
  onAssignTask: (taskId: string, helperId: string) => void;
  onCompleteTask: (taskId: string) => void;
}

export function TaskDetail({ taskId, onBack, onAssignTask, onCompleteTask }: TaskDetailProps) {
  const [showChat, setShowChat] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const [showCompletionModal, setShowCompletionModal] = useState(false);

  const task = useQuery(api.tasks.getTaskById, { taskId: taskId as any });
  const messages = useQuery(api.messages.getTaskMessages, { taskId: taskId as any });
  const sendMessage = useMutation(api.messages.sendMessage);
  const markAsRead = useMutation(api.messages.markMessagesAsRead);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      await sendMessage({ taskId: taskId as any, content: newMessage });
      setNewMessage("");
      await markAsRead({ taskId: taskId as any });
    } catch (error) {
      toast.error("Failed to send message");
    }
  };

  const handleCompleteTask = async () => {
    try {
      await onCompleteTask(taskId);
      setShowCompletionModal(true);
    } catch (error) {
      toast.error("Failed to complete task. Please try again.");
    }
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString() + " " + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (task === undefined) {
    return (
      <div className="p-4">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-3/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
          <div className="h-20 bg-gray-200 rounded mb-4"></div>
        </div>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="p-4">
        <button onClick={onBack} className="mb-4 text-blue-600 hover:text-blue-800">
          ← Back
        </button>
        <div className="text-center py-8">
          <p className="text-gray-600">Task not found</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="p-4 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <button onClick={onBack} className="text-blue-600 hover:text-blue-800 font-medium">
            ← Back
          </button>
          {task.status === "assigned" && (
            <button
              onClick={() => setShowChat(!showChat)}
              className="bg-blue-500 text-white px-3 py-1 rounded text-sm"
            >
              {showChat ? "Hide Chat" : "Show Chat"}
            </button>
          )}
        </div>

        {/* Task Details */}
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center space-x-3">
              <span className="text-2xl">
                {CATEGORY_ICONS[task.category as keyof typeof CATEGORY_ICONS]}
              </span>
              <div>
                <h1 className="text-xl font-bold text-gray-900">{task.title}</h1>
                <p className="text-gray-600">
                  by {task.seeker?.name} • ⭐ {task.seeker?.rating.toFixed(1)} ({task.seeker?.reviewCount} reviews)
                </p>
              </div>
            </div>
            <div className="text-right">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                STATUS_COLORS[task.status as keyof typeof STATUS_COLORS]
              }`}>
                {task.status.replace('_', ' ')}
              </span>
              <div className="text-lg font-bold text-green-600 mt-1">
                {task.rewardPoints} pts
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Description</h3>
              <p className="text-gray-700">{task.description}</p>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Location</h3>
              <p className="text-gray-700">📍 {task.location.address}</p>
            </div>

            {task.scheduledTime && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Scheduled Time</h3>
                <p className="text-gray-700">⏰ {formatTime(task.scheduledTime)}</p>
              </div>
            )}

            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Posted</h3>
              <p className="text-gray-700">{formatTime(task._creationTime)}</p>
            </div>

            {task.helper && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Helper</h3>
                <p className="text-gray-700">
                  {task.helper.name} • ⭐ {task.helper.rating.toFixed(1)} ({task.helper.reviewCount} reviews)
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Applicants (for task owner) */}
        {task.status === "open" && task.applicants.length > 0 && (
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <h3 className="font-semibold text-gray-900 mb-4">
              Applicants ({task.applicants.length})
            </h3>
            <div className="space-y-3">
              {task.applicants.filter(Boolean).map((applicant) => applicant && (
                <div key={applicant._id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{applicant.name}</p>
                    <p className="text-sm text-gray-600">
                      ⭐ {applicant.rating.toFixed(1)} ({applicant.reviewCount} reviews)
                    </p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {applicant.skills.slice(0, 3).map((skill) => (
                        <span key={skill} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                  <button
                    onClick={() => onAssignTask(task._id, applicant._id)}
                    className="bg-green-500 text-white px-4 py-2 rounded font-medium hover:bg-green-600"
                  >
                    Assign
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Chat */}
        {showChat && task.status === "assigned" && (
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <h3 className="font-semibold text-gray-900 mb-4">Chat</h3>
            
            <div className="space-y-3 mb-4 max-h-60 overflow-y-auto">
              {messages?.map((message) => (
                <div key={message._id} className={`p-3 rounded-lg ${
                  message.messageType === "system" 
                    ? "bg-blue-50 text-blue-800 text-center text-sm"
                    : "bg-gray-50"
                }`}>
                  {message.messageType === "text" && (
                    <div>
                      <p className="font-medium text-sm text-gray-600 mb-1">
                        {message.senderName}
                      </p>
                      <p className="text-gray-900">{message.content}</p>
                    </div>
                  )}
                  {message.messageType === "system" && (
                    <p>{message.content}</p>
                  )}
                </div>
              ))}
            </div>

            <form onSubmit={handleSendMessage} className="flex space-x-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
              <button
                type="submit"
                disabled={!newMessage.trim()}
                className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 disabled:opacity-50"
              >
                Send
              </button>
            </form>
          </div>
        )}

        {/* Action Buttons */}
        {task.status === "assigned" && (
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <button
              onClick={handleCompleteTask}
              className="w-full bg-green-500 text-white py-3 rounded-lg font-medium hover:bg-green-600"
            >
              Mark as Complete
            </button>
          </div>
        )}
      </div>

      {/* Task Completion Modal */}
      {showCompletionModal && (
        <TaskCompletionModal
          taskId={taskId}
          onClose={() => setShowCompletionModal(false)}
        />
      )}
    </>
  );
}
