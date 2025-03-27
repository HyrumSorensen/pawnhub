"use client";

import { useAuthActions } from "@convex-dev/auth/react";

export default function Games() {
  const { signOut } = useAuthActions();

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-700">
      <div className="text-center p-8 bg-white rounded-2xl shadow-2xl max-w-md">
        <h1 className="text-5xl font-extrabold text-gray-900 mb-4">Games</h1>
        {/* sign out for testing */}
        <button onClick={() => signOut()}>Sign out</button>
      </div>
    </main>
  );
}
