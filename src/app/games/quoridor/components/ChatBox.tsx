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
    <div className="flex flex-col w-80 h-[500px] border rounded p-2 bg-white shadow-md">
      <div className="flex-1 overflow-y-auto mb-2">
        {messages.map((msg, i) => (
          <div key={i} className="mb-1 p-1 bg-gray-100 rounded">
            {msg}
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          className="flex-1 border p-1 rounded"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          placeholder="Type a message..."
        />
        <button
          className="bg-blue-500 text-white px-2 py-1 rounded"
          onClick={sendMessage}
        >
          Send
        </button>
      </div>
    </div>
  );
}
