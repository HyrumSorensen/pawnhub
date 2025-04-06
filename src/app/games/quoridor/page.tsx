"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export default function QuoridorPage() {
  const [roomId, setRoomId] = useState<string>("");
  const router = useRouter();

  const handleJoinRoom = () => {
    router.push(`/games/quoridor/rooms/${roomId}`);
  };

  return (
    <div>
      <h1>Quoridor</h1>
      <Input value={roomId} onChange={(e) => setRoomId(e.target.value)} />
      <Button onClick={handleJoinRoom}>Join Room</Button>
    </div>
  );
}
