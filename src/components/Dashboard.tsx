import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { TaskFeed } from "./TaskFeed";
import { MyTasks } from "./MyTasks";
import { CreateTask } from "./CreateTask";
import { Profile } from "./Profile";
import { SignOutButton } from "../SignOutButton";

type Tab = "feed" | "my-tasks" | "create" | "profile";

interface User {
  _id: string;
  name: string;
  email: string;
  userType: "helper" | "seeker" | "both";
  totalPoints: number;
  rating: number;
  reviewCount: number;
  skills: string[];
  location: {
    lat: number;
    lng: number;
    address: string;
  };
  bio?: string;
  profileImage?: string;
  isActive?: boolean;
}

interface DashboardProps {
  user: User;
}

export function Dashboard({ user }: DashboardProps) {
  const [activeTab, setActiveTab] = useState<Tab>("feed");

  const tabs = [
    { id: "feed" as Tab, label: "Discover", icon: "🔍", show: user.userType === "helper" || user.userType === "both" },
    { id: "my-tasks" as Tab, label: "My Tasks", icon: "📋", show: true },
    { id: "create" as Tab, label: "Post Task", icon: "➕", show: user.userType === "seeker" || user.userType === "both" },
    { id: "profile" as Tab, label: "Profile", icon: "👤", show: true },
  ].filter(tab => tab.show);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm shadow-sm sticky top-0 z-10">
        <div className="max-w-md mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-sm">K</span>
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900">KindLoop</h1>
                <p className="text-xs text-gray-600">Hi, {user.name.split(' ')[0]}!</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="text-right">
                <div className="text-sm font-semibold text-green-600">{user.totalPoints} pts</div>
                <div className="text-xs text-gray-500">⭐ {user.rating.toFixed(1)}</div>
              </div>
              <SignOutButton />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="pb-20">
        <div className="max-w-md mx-auto">
          {activeTab === "feed" && <TaskFeed user={user} />}
          {activeTab === "my-tasks" && <MyTasks user={user} />}
          {activeTab === "create" && <CreateTask user={user} />}
          {activeTab === "profile" && <Profile user={user} />}
        </div>
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200">
        <div className="max-w-md mx-auto">
          <div className="flex">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 py-3 px-2 text-center ${
                  activeTab === tab.id
                    ? 'text-green-600 bg-green-50'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <div className="text-lg mb-1">{tab.icon}</div>
                <div className="text-xs font-medium">{tab.label}</div>
              </button>
            ))}
          </div>
        </div>
      </nav>
    </div>
  );
}
