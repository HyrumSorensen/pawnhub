"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

// Right now we only have Mancala
const TABS = ["Mancala"];
// Later: Add "Quoridor", "Tic-Tac-Toe" back here

export default function Leaderboard() {
  const [selectedTab, setSelectedTab] = useState("Mancala");

  const mancalaTopPlayers = useQuery(api.gameResults.getTopPlayersForGame, {
    game: "mancala",
    limit: 10,
  });

  // // Future: Add queries for Quoridor and Tic Tac Toe
  // const quoridorTopPlayers = useQuery(api.gameResults.getTopPlayersForGame, {
  //   game: "quoridor",
  //   limit: 10,
  // });

  // const ticTacToeTopPlayers = useQuery(api.gameResults.getTopPlayersForGame, {
  //   game: "tic-tac-toe",
  //   limit: 10,
  // });

  if (!mancalaTopPlayers) {
    return <div className="p-8 text-center">Loading...</div>;
  }

  const getPlayers = () => {
    if (selectedTab === "Mancala") return mancalaTopPlayers;
    // if (selectedTab === "Quoridor") return quoridorTopPlayers ?? [];
    // if (selectedTab === "Tic-Tac-Toe") return ticTacToeTopPlayers ?? [];
    return [];
  };

  const players = getPlayers();

  return (
    <main className="p-8 flex flex-col items-center">
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

      {/* Leaderboard Section */}
      <section className="w-full max-w-3xl bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-semibold mb-6">
          🏆 {selectedTab} Top Players
        </h2>

        {players.length === 0 ? (
          <div className="text-center text-gray-500">No data yet!</div>
        ) : (
          <>
            <div className="grid grid-cols-4 font-bold border-b pb-2 mb-4">
              <div>Rank</div>
              <div>Player ID</div>
              <div>Wins</div>
              <div>Rank Points</div>
            </div>

            {players.map((player, index) => (
              <div
                key={player._id}
                className="grid grid-cols-4 py-2 border-b last:border-b-0 text-center"
              >
                <div>#{index + 1}</div>
                <div className="truncate">{player.userId}</div>
                <div>{player.wins}</div>
                <div>{player.rankPoints ?? 0}</div>
              </div>
            ))}
          </>
        )}
      </section>
    </main>
  );
}
