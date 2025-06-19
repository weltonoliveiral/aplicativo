import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";

const CATEGORY_OPTIONS = [
  { value: "household", label: "Household", icon: "🏠" },
  { value: "pets", label: "Pet Care", icon: "🐕" },
  { value: "elderly", label: "Elderly Care", icon: "👴" },
  { value: "digital", label: "Tech Help", icon: "💻" },
  { value: "errands", label: "Errands", icon: "🛒" },
  { value: "other", label: "Other", icon: "✨" },
];

interface User {
  _id: string;
  location: {
    lat: number;
    lng: number;
    address: string;
  };
}

interface CreateTaskProps {
  user: User;
}

export function CreateTask({ user }: CreateTaskProps) {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "household" as const,
    location: user.location,
    scheduledTime: "",
    rewardPoints: 10,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const createTask = useMutation(api.tasks.createTask);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.description.trim()) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsSubmitting(true);
    
    try {
      const taskData = {
        ...formData,
        scheduledTime: formData.scheduledTime ? new Date(formData.scheduledTime).getTime() : undefined,
      };
      
      await createTask(taskData);
      toast.success("Task created successfully!");
      
      // Reset form
      setFormData({
        title: "",
        description: "",
        category: "household",
        location: user.location,
        scheduledTime: "",
        rewardPoints: 10,
      });
    } catch (error) {
      toast.error("Failed to create task. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLocationRequest = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData(prev => ({
            ...prev,
            location: {
              lat: position.coords.latitude,
              lng: position.coords.longitude,
              address: "Current Location",
            }
          }));
          toast.success("Location updated!");
        },
        (error) => {
          toast.error("Could not get location. Please enter manually.");
        }
      );
    } else {
      toast.error("Geolocation is not supported by this browser.");
    }
  };

  return (
    <div className="p-4">
      <div className="bg-white rounded-lg p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Create a New Task</h2>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Task Title *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="e.g., Help with grocery shopping"
              maxLength={100}
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category *
            </label>
            <div className="grid grid-cols-2 gap-2">
              {CATEGORY_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, category: option.value as any }))}
                  className={`p-3 rounded-lg border text-left flex items-center space-x-2 ${
                    formData.category === option.value
                      ? 'border-green-500 bg-green-50 text-green-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <span className="text-lg">{option.icon}</span>
                  <span className="text-sm font-medium">{option.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description *
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="Describe what help you need in detail..."
              rows={4}
              maxLength={500}
            />
            <div className="text-xs text-gray-500 mt-1">
              {formData.description.length}/500 characters
            </div>
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Location *
            </label>
            <div className="flex space-x-2">
              <input
                type="text"
                value={formData.location.address}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  location: { ...prev.location, address: e.target.value }
                }))}
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Enter task location"
              />
              <button
                type="button"
                onClick={handleLocationRequest}
                className="px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
              >
                📍
              </button>
            </div>
          </div>

          {/* Scheduled Time */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Preferred Time (Optional)
            </label>
            <input
              type="datetime-local"
              value={formData.scheduledTime}
              onChange={(e) => setFormData(prev => ({ ...prev, scheduledTime: e.target.value }))}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              min={new Date().toISOString().slice(0, 16)}
            />
          </div>

          {/* Reward Points */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Reward Points: {formData.rewardPoints}
            </label>
            <input
              type="range"
              min="5"
              max="100"
              step="5"
              value={formData.rewardPoints}
              onChange={(e) => setFormData(prev => ({ ...prev, rewardPoints: Number(e.target.value) }))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>5 pts</span>
              <span>100 pts</span>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting || !formData.title.trim() || !formData.description.trim()}
            className="w-full bg-green-500 text-white py-3 rounded-lg font-medium hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSubmitting ? "Creating Task..." : "Create Task"}
          </button>
        </form>
      </div>
    </div>
  );
}
