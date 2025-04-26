"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

const TABS = ["Mancala"];

export default function LeaderboardPage() {
  const [selectedTab, setSelectedTab] = useState("Mancala");

  const userId = useQuery(api.users.getCurrentUserId);

  const mancalaTopPlayers = useQuery(api.gameResults.getTopPlayersForGame, {
    game: "mancala",
    limit: 10,
  });

  const myStats = useQuery(
    api.gameResults.getMyStatsForGame,
    userId ? { game: "mancala", userId } : "skip"
  );

  const userIds = mancalaTopPlayers?.map((p) => p.userId) ?? [];
  const topPlayersInfo = useQuery(
    api.users.getUsersByIds,
    userIds.length > 0 ? { userIds } : "skip"
  );

  if (!mancalaTopPlayers || !myStats || (userIds.length > 0 && !topPlayersInfo)) {
    return <div className="p-8 text-center">Loading...</div>;
  }

  const getPlayers = () => {
    if (selectedTab === "Mancala") return mancalaTopPlayers;
    return [];
  };

  const players = getPlayers();

  const getRankLabel = (rankPoints: number | undefined) => {
    if (rankPoints === undefined) return "Unranked";
    if (rankPoints < 50) return "Iron";
    if (rankPoints < 100) return "Bronze";
    if (rankPoints < 150) return "Silver";
    if (rankPoints < 200) return "Gold";
    if (rankPoints < 250) return "Platinum";
    if (rankPoints < 300) return "Emerald";
    if (rankPoints < 350) return "Pro";
    if (rankPoints < 400) return "Master";
    return "Grandmaster";
  };

  const getUserName = (id: string) => {
    const found = topPlayersInfo?.find((u) => u._id === id);
    return found ? found.name : id;
  };

  return (
    <main className="p-8 flex flex-col items-center gap-8">
      <h1 className="text-4xl font-bold mb-8">Leaderboards</h1>

      {/* Tabs */}
      <div className="flex gap-4 mb-8">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setSelectedTab(tab)}
            className={`px-4 py-2 rounded-full font-semibold ${
              selectedTab === tab
                ? "bg-blue-500 text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* My Stats Section */}
      <section className="w-full max-w-4xl bg-white p-6 rounded-lg shadow-md flex flex-col gap-6">
        <h2 className="text-2xl font-semibold mb-4">🎯 My Stats - {selectedTab}</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
          <div className="p-4 bg-gray-100 rounded-lg">
            <div className="text-sm text-gray-500">Wins</div>
            <div className="text-2xl font-bold">{myStats?.wins ?? 0}</div>
          </div>
          <div className="p-4 bg-gray-100 rounded-lg">
            <div className="text-sm text-gray-500">Losses</div>
            <div className="text-2xl font-bold">{myStats?.losses ?? 0}</div>
          </div>
          <div className="p-4 bg-gray-100 rounded-lg">
            <div className="text-sm text-gray-500">Win Rate</div>
            <div className="text-2xl font-bold">
              {myStats?.winRate ? `${myStats.winRate.toFixed(1)}%` : "0%"}
            </div>
          </div>
          <div className="p-4 bg-gray-100 rounded-lg">
            <div className="text-sm text-gray-500">Rank</div>
            <div className="text-2xl font-bold">
              {getRankLabel(myStats?.rankPoints)}
            </div>
          </div>
        </div>
      </section>

      {/* Leaderboard Section */}
      <section className="w-full max-w-4xl bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-semibold mb-6">
          🏆 {selectedTab} Top Players
        </h2>

        {players.length === 0 ? (
          <div className="text-center text-gray-500">No data yet!</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full table-auto text-center">
              <thead>
                <tr className="bg-gray-100">
                  <th className="px-4 py-2">Rank</th>
                  <th className="px-4 py-2">Player</th>
                  <th className="px-4 py-2">Wins</th>
                  <th className="px-4 py-2">Rank Points</th>
                </tr>
              </thead>
              <tbody>
                {players.map((player, index) => (
                  <tr key={player._id} className="border-b last:border-none">
                    <td className="px-4 py-2">#{index + 1}</td>
                    <td className="px-4 py-2">{getUserName(player.userId)}</td>
                    <td className="px-4 py-2">{player.wins}</td>
                    <td className="px-4 py-2">{player.rankPoints ?? 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
