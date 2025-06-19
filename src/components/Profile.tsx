import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";

const SKILL_OPTIONS = [
  "Household Chores", "Pet Care", "Elderly Care", "Tech Support", "Errands",
  "Gardening", "Cooking", "Cleaning", "Shopping", "Transportation",
  "Tutoring", "Handyman", "Moving Help", "Childcare", "Other"
];

interface User {
  _id: string;
  name: string;
  email: string;
  bio?: string;
  userType: "helper" | "seeker" | "both";
  location: {
    lat: number;
    lng: number;
    address: string;
  };
  skills: string[];
  totalPoints: number;
  rating: number;
  reviewCount: number;
}

interface ProfileProps {
  user: User;
}

export function Profile({ user }: ProfileProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user.name,
    bio: user.bio || "",
    userType: user.userType,
    location: user.location,
    skills: user.skills,
  });

  const updateProfile = useMutation(api.users.updateUserProfile);
  const userReviews = useQuery(api.reviews.getUserReviews, { userId: user._id as any });

  const handleSkillToggle = (skill: string) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.includes(skill)
        ? prev.skills.filter(s => s !== skill)
        : [...prev.skills, skill]
    }));
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

  const handleSave = async () => {
    try {
      await updateProfile(formData);
      setIsEditing(false);
      toast.success("Profile updated successfully!");
    } catch (error) {
      toast.error("Failed to update profile. Please try again.");
    }
  };

  const handleCancel = () => {
    setFormData({
      name: user.name,
      bio: user.bio || "",
      userType: user.userType,
      location: user.location,
      skills: user.skills,
    });
    setIsEditing(false);
  };

  return (
    <div className="p-4 space-y-4">
      {/* Profile Header */}
      <div className="bg-white rounded-lg p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-xl">
                {user.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">{user.name}</h1>
              <p className="text-gray-600">{user.email}</p>
              <div className="flex items-center space-x-4 mt-1">
                <span className="text-sm text-green-600 font-semibold">
                  {user.totalPoints} points
                </span>
                <span className="text-sm text-gray-600">
                  ⭐ {user.rating.toFixed(1)} ({user.reviewCount} reviews)
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
          >
            {isEditing ? "Cancel" : "Edit"}
          </button>
        </div>

        {isEditing ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bio
              </label>
              <textarea
                value={formData.bio}
                onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                rows={3}
                placeholder="Tell us about yourself..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                User Type
              </label>
              <div className="space-y-2">
                {[
                  { value: "seeker", label: "I need help", icon: "🤝" },
                  { value: "helper", label: "I want to help", icon: "💝" },
                  { value: "both", label: "Both", icon: "🌟" },
                ].map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setFormData(prev => ({ ...prev, userType: option.value as any }))}
                    className={`w-full p-3 rounded-lg border text-left flex items-center space-x-3 ${
                      formData.userType === option.value
                        ? 'border-green-500 bg-green-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <span className="text-xl">{option.icon}</span>
                    <span>{option.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Location
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

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Skills & Interests
              </label>
              <div className="grid grid-cols-2 gap-2">
                {SKILL_OPTIONS.map((skill) => (
                  <button
                    key={skill}
                    onClick={() => handleSkillToggle(skill)}
                    className={`p-2 text-sm rounded-lg border ${
                      formData.skills.includes(skill)
                        ? 'border-green-500 bg-green-50 text-green-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {skill}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={handleCancel}
                className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="flex-1 bg-green-500 text-white py-3 rounded-lg font-medium hover:bg-green-600"
              >
                Save Changes
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {user.bio && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">About</h3>
                <p className="text-gray-700">{user.bio}</p>
              </div>
            )}

            <div>
              <h3 className="font-semibold text-gray-900 mb-2">User Type</h3>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800">
                {user.userType === "both" ? "Helper & Seeker" : 
                 user.userType === "helper" ? "Helper" : "Seeker"}
              </span>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Location</h3>
              <p className="text-gray-700">📍 {user.location.address}</p>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Skills & Interests</h3>
              <div className="flex flex-wrap gap-2">
                {user.skills.map((skill) => (
                  <span key={skill} className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Recent Reviews */}
      <div className="bg-white rounded-lg p-6 shadow-sm">
        <h3 className="font-semibold text-gray-900 mb-4">Recent Reviews</h3>
        {userReviews === undefined ? (
          <div className="animate-pulse space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="border-b border-gray-200 pb-3">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : userReviews.length === 0 ? (
          <p className="text-gray-600 text-center py-4">No reviews yet</p>
        ) : (
          <div className="space-y-4">
            {userReviews.slice(0, 5).map((review) => (
              <div key={review._id} className="border-b border-gray-200 pb-4 last:border-b-0">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <span className="font-medium text-gray-900">{review.reviewerName}</span>
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <span key={i} className={`text-sm ${
                          i < review.rating ? 'text-yellow-400' : 'text-gray-300'
                        }`}>
                          ⭐
                        </span>
                      ))}
                    </div>
                  </div>
                  <span className="text-xs text-gray-500">{review.taskTitle}</span>
                </div>
                {review.comment && (
                  <p className="text-gray-700 text-sm">{review.comment}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
