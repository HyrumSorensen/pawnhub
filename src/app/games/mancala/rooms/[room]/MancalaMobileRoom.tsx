"use client";

import { useState } from "react";
import ChatBox from "@/components/ChatBox";
import Image from "next/image";
import { MancalaGameState } from "../../MancalaGameEngine";
import { Id } from "@/convex/_generated/dataModel";
import { MessageSquare, X } from "lucide-react"; // 👈 icons for chat toggle

type User = {
  _id: Id<"users">;
  _creationTime: number;
  name?: string;
  email?: string;
  phone?: string;
  image?: string;
  emailVerificationTime?: number;
  phoneVerificationTime?: number;
  isAnonymous?: boolean;
  avatarUrl?: string;
};

export default function MancalaMobileRoom({
  board,
  localState,
  handleMove,
  showEndScreen,
  didWin,
  handlePlayAgain,
  roomId,
  userId,
  user,
}: {
  board: number[];
  localState: MancalaGameState;
  handleMove: (pitIndex: number) => void;
  showEndScreen: boolean;
  didWin: boolean | null;
  handlePlayAgain: () => void;
  roomId: string;
  userId: Id<"users">;
  user: User;
}) {
  const [showChat, setShowChat] = useState(false);

  return (
    <main className="flex flex-col p-4 items-center gap-6 relative">

      {/* Chat toggle button */}
      <button
        className="fixed top-4 right-4 bg-blue-500 text-white rounded-full p-3 shadow-md z-50"
        onClick={() => setShowChat(!showChat)}
      >
        {showChat ? <X size={24} /> : <MessageSquare size={24} />}
      </button>

      {/* Show ChatBox fullscreen if toggled */}
      {showChat ? (
        <div className="fixed inset-0 bg-white z-40 p-4 flex flex-col">
          <ChatBox room={roomId} playerId={userId} user={user} />
        </div>
      ) : (
        <>
          {/* Current Turn Box */}
          <div className="bg-white/90 p-4 rounded-lg shadow-md text-center w-full max-w-xs">
            <h3 className="text-lg font-semibold mb-2">Current Turn</h3>
            <div className="flex items-center justify-center gap-2">
              <div
                className={`w-3 h-3 rounded-full ${
                  localState.currentPlayer === 1 ? "bg-blue-500" : "bg-gray-300"
                }`}
              />
              <span className="font-medium">Player {localState.currentPlayer}</span>
            </div>
          </div>

          {/* Board */}
          <div className="flex flex-col items-center bg-[url('/assets/mancala/wood-bg.svg')] bg-cover bg-center p-4 rounded-xl w-full max-w-xs gap-4">
            {/* P2 Store */}
            <Store label="P2" count={board[13]} labelPos="bottom" />

            {/* Pit columns */}
            <div className="flex flex-row justify-center gap-4">
              {/* Player 2 pits */}
              <div className="flex flex-col gap-2">
                {[12, 11, 10, 9, 8, 7].map((index) => (
                  <Pit
                    key={`p2-${index}`}
                    count={board[index]}
                    onClick={() => handleMove(index)}
                    isClickable={localState.currentPlayer === 2}
                    labelPos="left"
                  />
                ))}
              </div>

              {/* Player 1 pits */}
              <div className="flex flex-col gap-2">
                {board.slice(0, 6).map((count, i) => (
                  <Pit
                    key={`p1-${i}`}
                    count={count}
                    onClick={() => handleMove(i)}
                    isClickable={localState.currentPlayer === 1}
                    labelPos="right"
                  />
                ))}
              </div>
            </div>

            {/* P1 Store */}
            <Store label="P1" count={board[6]} labelPos="top" />
          </div>
        </>
      )}

      {/* End Screen */}
      {showEndScreen && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50">
          <div className="bg-white rounded-2xl p-8 shadow-2xl flex flex-col items-center max-w-xs w-full">
            <h1 className={`text-3xl font-bold mb-4 ${didWin ? "text-green-500" : "text-red-500"}`}>
              {didWin ? "YOU WON!" : "YOU LOST"}
            </h1>
            <p className="text-gray-700 text-md mb-8 text-center">
              {didWin ? "Congratulations!" : "Better luck next time!"}
            </p>
            <div className="flex gap-4">
              <button
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg font-semibold"
                onClick={() => window.location.href = "/games"}
              >
                Browse Games
              </button>
              <button
                className="px-4 py-2 bg-blue-500 text-white hover:bg-blue-600 rounded-lg font-semibold"
                onClick={handlePlayAgain}
              >
                Play Again
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

function Pit({
  count,
  onClick,
  isClickable,
  labelPos,
}: {
  count: number;
  onClick: () => void;
  isClickable: boolean;
  labelPos: "top" | "bottom" | "left" | "right";
}) {
  return (
    <div className="flex items-center gap-1">
      {labelPos === "left" && <span className="font-semibold text-xs">{count}</span>}
      <button
        onClick={onClick}
        disabled={!isClickable || count === 0}
        className="relative w-14 h-14 bg-amber-100 rounded-full shadow-md hover:brightness-105 transition"
      >
        {count > 0 ? (
          <Image
            src={`/assets/mancala/pit-${Math.min(count, 4)}.svg`}
            alt="Pit"
            fill
            className="object-cover rounded-full opacity-90"
          />
        ) : (
          <Image
            src="/assets/mancala/pit-empty.svg"
            alt="Pit"
            fill
            className="object-cover rounded-full opacity-90"
          />
        )}
      </button>
      {labelPos === "right" && <span className="font-semibold text-xs">{count}</span>}
    </div>
  );
}

function Store({
  label,
  count,
  labelPos,
}: {
  label: string;
  count: number;
  labelPos: "top" | "bottom";
}) {
  return (
    <div className="flex flex-col items-center gap-1 mt-2">
      {labelPos === "top" && <span className="text-xs font-medium">{label}</span>}
      {labelPos === "bottom" && <span className="font-semibold text-sm">{count}</span>}

      <div className="w-48 h-16 bg-yellow-200 rounded-xl shadow-inner relative overflow-hidden">
        <div className="absolute inset-0 transform rotate-90">
          {count > 0 ? (
            <Image
              src={`/assets/mancala/store-${Math.min(count, 4)}.svg`}
              alt={`${label} Store`}
              fill
              className="object-cover rounded-xl opacity-90"
            />
          ) : (
            <Image
              src="/assets/mancala/store-empty.svg"
              alt={`${label} Store`}
              fill
              className="object-cover rounded-xl opacity-90"
            />
          )}
        </div>
      </div>
    </div>
  );
}
