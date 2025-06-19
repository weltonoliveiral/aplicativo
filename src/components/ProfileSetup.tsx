import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";

const SKILL_OPTIONS = [
  "Household Chores", "Pet Care", "Elderly Care", "Tech Support", "Errands",
  "Gardening", "Cooking", "Cleaning", "Shopping", "Transportation",
  "Tutoring", "Handyman", "Moving Help", "Childcare", "Other"
];

const CATEGORY_ICONS = {
  household: "🏠",
  pets: "🐕",
  elderly: "👴",
  digital: "💻",
  errands: "🛒",
  other: "✨"
};

export function ProfileSetup() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    bio: "",
    userType: "both" as "helper" | "seeker" | "both",
    location: {
      lat: 0,
      lng: 0,
      address: "",
    },
    skills: [] as string[],
  });

  const createProfile = useMutation(api.users.createUserProfile);

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
          toast.success("Location captured!");
        },
        (error) => {
          toast.error("Could not get location. Please enter manually.");
        }
      );
    } else {
      toast.error("Geolocation is not supported by this browser.");
    }
  };

  const handleSkillToggle = (skill: string) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.includes(skill)
        ? prev.skills.filter(s => s !== skill)
        : [...prev.skills, skill]
    }));
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.email || !formData.location.address) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      await createProfile(formData);
      toast.success("Profile created successfully!");
    } catch (error) {
      toast.error("Failed to create profile. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-4">
      <div className="max-w-md mx-auto">
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-white font-bold text-xl">K</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Welcome to KindLoop</h1>
            <p className="text-gray-600 mt-2">Let's set up your profile</p>
          </div>

          <div className="mb-6">
            <div className="flex justify-between items-center">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    i <= step ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-600'
                  }`}>
                    {i}
                  </div>
                  {i < 3 && (
                    <div className={`w-16 h-1 mx-2 ${
                      i < step ? 'bg-green-500' : 'bg-gray-200'
                    }`} />
                  )}
                </div>
              ))}
            </div>
          </div>

          {step === 1 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-900">Basic Information</h2>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Enter your full name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Enter your email"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bio (Optional)
                </label>
                <textarea
                  value={formData.bio}
                  onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Tell us a bit about yourself..."
                  rows={3}
                />
              </div>

              <button
                onClick={() => setStep(2)}
                disabled={!formData.name || !formData.email}
                className="w-full bg-green-500 text-white py-3 rounded-lg font-medium hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-900">How do you want to participate?</h2>
              
              <div className="space-y-3">
                <button
                  onClick={() => setFormData(prev => ({ ...prev, userType: "seeker" }))}
                  className={`w-full p-4 rounded-lg border-2 text-left ${
                    formData.userType === "seeker"
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">🤝</span>
                    <div>
                      <h3 className="font-semibold text-gray-900">I need help</h3>
                      <p className="text-sm text-gray-600">Post tasks and find helpers</p>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => setFormData(prev => ({ ...prev, userType: "helper" }))}
                  className={`w-full p-4 rounded-lg border-2 text-left ${
                    formData.userType === "helper"
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">💝</span>
                    <div>
                      <h3 className="font-semibold text-gray-900">I want to help</h3>
                      <p className="text-sm text-gray-600">Find tasks and earn points</p>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => setFormData(prev => ({ ...prev, userType: "both" }))}
                  className={`w-full p-4 rounded-lg border-2 text-left ${
                    formData.userType === "both"
                      ? 'border-purple-500 bg-purple-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">🌟</span>
                    <div>
                      <h3 className="font-semibold text-gray-900">Both</h3>
                      <p className="text-sm text-gray-600">Sometimes I need help, sometimes I help others</p>
                    </div>
                  </div>
                </button>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => setStep(1)}
                  className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-300"
                >
                  Back
                </button>
                <button
                  onClick={() => setStep(3)}
                  className="flex-1 bg-green-500 text-white py-3 rounded-lg font-medium hover:bg-green-600"
                >
                  Next
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-900">Location & Skills</h2>
              
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
                    placeholder="Enter your address"
                  />
                  <button
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
                  onClick={() => setStep(2)}
                  className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-300"
                >
                  Back
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={!formData.location.address}
                  className="flex-1 bg-green-500 text-white py-3 rounded-lg font-medium hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Complete Setup
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
