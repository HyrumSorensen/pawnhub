"use client";

import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Doc } from "@/convex/_generated/dataModel";
import EmojiPicker, { EmojiClickData } from "emoji-picker-react";
import { Smile, ChevronDown, ChevronUp } from "lucide-react";

interface ChatBoxProps {
  room: string;
  playerId: Id<"users">;
  user: Doc<"users">;
}

export default function ChatBox({ room, playerId, user }: ChatBoxProps) {
  const chat = useQuery(api.games.getGameChat, { room });
  const addChat = useMutation(api.games.addGameChat);

  const [input, setInput] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const emojiPickerRef = useRef<HTMLDivElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chat]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        emojiPickerRef.current &&
        !emojiPickerRef.current.contains(event.target as Node)
      ) {
        setShowEmojiPicker(false);
      }
    };
    if (showEmojiPicker) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showEmojiPicker]);

  const sendMessage = async () => {
    if (!input.trim()) return;

    await addChat({
      room,
      player: playerId,
      name: user.name!,
      message: input,
    });

    setInput("");
    setShowEmojiPicker(false);
  };

  const handleEmojiClick = (emojiData: EmojiClickData) => {
    setInput((prev) => prev + emojiData.emoji);
    setShowEmojiPicker(false);
  };

  return (
    <div
      className={`flex flex-col w-80 bg-white border border-gray-300 rounded-xl shadow-lg overflow-hidden relative transition-all duration-300 ${
        collapsed ? "h-[44px]" : "h-[500px]"
      }`}
    >
      {/* Header / Toggle */}
      <div
        className="bg-black text-white flex items-center justify-between px-3 py-2 font-semibold text-sm tracking-wide cursor-pointer"
        onClick={() => setCollapsed((prev) => !prev)}
      >
        <span>Game Chat</span>
        {collapsed ? (
          <ChevronDown className="w-4 h-4" />
        ) : (
          <ChevronUp className="w-4 h-4" />
        )}
      </div>

      {/* Chat content */}
      {!collapsed && (
        <>
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
                    <strong>{entry.name}:</strong> {entry.message}
                  </div>
                );
              } catch (e) {
                console.error(e);
                return null;
              }
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Emoji Picker */}
          {showEmojiPicker && (
            <div
              ref={emojiPickerRef}
              className="absolute bottom-16 left-2 z-20 bg-white rounded shadow-lg border border-gray-200"
            >
              <EmojiPicker
                onEmojiClick={handleEmojiClick}
                height={350}
                width={300}
              />
            </div>
          )}

          {/* Input Section */}
          <div className="flex items-center gap-2 px-2 py-2 border-t border-gray-200 bg-white">
            <button
              onClick={() => setShowEmojiPicker((prev) => !prev)}
              className="p-2 rounded-full hover:bg-gray-100 transition"
              title="Pick emoji"
            >
              <Smile className="w-5 h-5 text-gray-600" />
            </button>

            <input
              className="flex-1 bg-white border border-gray-300 text-black px-2 py-1.5 rounded-lg placeholder-gray-500 outline-none text-sm focus:ring-2 focus:ring-black"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              placeholder="Type a message..."
            />

            <button
              className="shrink-0 bg-black text-white text-sm px-3 py-1.5 rounded-lg hover:bg-gray-800 transition"
              onClick={sendMessage}
            >
              Send
            </button>
          </div>
        </>
      )}
    </div>
  );
}
