// app/page.tsx
import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-700">
      <div className="text-center p-8 bg-white rounded-2xl shadow-2xl max-w-md">
        <h1 className="text-5xl font-extrabold text-gray-900 mb-4">
          PawnHub ♟️
        </h1>
        <p className="text-lg text-gray-600 mb-6">
          Strategy starts here. Ready to test your mind?
        </p>
        <Link href="/auth/login">
          <button className="px-6 py-3 bg-black text-white text-lg font-semibold rounded-xl shadow-md hover:bg-gray-800 transition">
            Login
          </button>
        </Link>
      </div>
    </main>
  );
}
