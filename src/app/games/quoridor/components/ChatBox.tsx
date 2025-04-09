"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
interface ChatBoxProps {
  room: string;
  playerId: Id<"users">; // user ID to tag messages
}

export default function ChatBox({ room, playerId }: ChatBoxProps) {
  const chat = useQuery(api.games.getGameChat, { room });
  const addChat = useMutation(api.games.addGameChat);

  const [input, setInput] = useState("");

  const sendMessage = async () => {
    if (!input.trim()) return;

    await addChat({
      room,
      player: playerId,
      message: input,
    });

    setInput("");
  };

  return (
    <div className="flex flex-col w-80 h-[500px] bg-white border border-gray-300 rounded-xl shadow-lg overflow-hidden">
      {/* Title */}
      <div className="bg-black text-white text-center py-2 font-semibold text-sm tracking-wide">
        Game Chat
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-2 p-3 bg-white">
        {chat?.map((entryStr, i) => {
          try {
            const entry = JSON.parse(entryStr);
            return (
              <div
                key={i}
                className="bg-gray-100 text-black px-3 py-2 rounded-lg w-fit max-w-full break-words"
              >
                <strong>
                  {entry.player === playerId ? "You" : entry.player}:
                </strong>{" "}
                {entry.message}
              </div>
            );
          } catch (e) {
            console.error(e);
            return null;
          }
        })}
      </div>

      {/* Input */}
      <div className="flex gap-2 p-3 border-t border-gray-200 bg-white">
        <input
          className="flex-1 bg-white border border-gray-300 text-black px-3 py-2 rounded-lg placeholder-gray-500 outline-none focus:ring-2 focus:ring-black"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          placeholder="Type a message..."
        />
        <button
          className="bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition"
          onClick={sendMessage}
        >
          Send
        </button>
      </div>
    </div>
  );
}
