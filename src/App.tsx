import { Authenticated, Unauthenticated, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { SignInForm } from "./SignInForm";
import { SignOutButton } from "./SignOutButton";
import { Toaster } from "sonner";
import { useState, useEffect } from "react";
import { Dashboard } from "./components/Dashboard";
import { ProfileSetup } from "./components/ProfileSetup";

export default function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      <Authenticated>
        <AuthenticatedApp />
      </Authenticated>
      <Unauthenticated>
        <UnauthenticatedApp />
      </Unauthenticated>
      <Toaster />
    </div>
  );
}

function AuthenticatedApp() {
  const currentUser = useQuery(api.users.getCurrentUser);

  if (currentUser === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (!currentUser) {
    return <ProfileSetup />;
  }

  return <Dashboard user={currentUser as any} />;
}

function UnauthenticatedApp() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-white/80 backdrop-blur-sm shadow-sm">
        <div className="max-w-md mx-auto px-4 py-4">
          <div className="flex items-center justify-center">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-sm">K</span>
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
                KindLoop
              </h1>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Connect. Help. Grow.
            </h2>
            <p className="text-lg text-gray-600 mb-8">
              Join your neighborhood community and make a difference, one small act of kindness at a time.
            </p>
            
            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="bg-white rounded-lg p-4 shadow-sm border border-green-100">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-2xl">🤝</span>
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">Need Help?</h3>
                <p className="text-sm text-gray-600">Post tasks and find trusted neighbors ready to assist</p>
              </div>
              
              <div className="bg-white rounded-lg p-4 shadow-sm border border-blue-100">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-2xl">💝</span>
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">Want to Help?</h3>
                <p className="text-sm text-gray-600">Earn points while helping others in your community</p>
              </div>
            </div>
          </div>

          <SignInForm />
        </div>
      </main>
    </div>
  );
}
