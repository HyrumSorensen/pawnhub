"use client";

import { useState } from "react";

export default function ChatBox() {
  const [messages, setMessages] = useState<string[]>([]);
  const [input, setInput] = useState("");

  const sendMessage = () => {
    if (!input.trim()) return;
    setMessages((prev) => [...prev, input]);
    setInput("");
  };

  return (
    <div className="flex flex-col w-80 h-[500px] bg-white border border-gray-300 rounded-xl shadow-lg overflow-hidden">
      {/* Title bar */}
      <div className="bg-black text-white text-center py-2 font-semibold text-sm tracking-wide">
        Game Chat
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-2 p-3 bg-white">
        {messages.map((msg, i) => (
          <div
            key={i}
            className="bg-gray-100 text-black px-3 py-2 rounded-lg w-fit max-w-full break-words"
          >
            {msg}
          </div>
        ))}
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
