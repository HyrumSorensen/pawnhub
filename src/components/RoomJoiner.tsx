"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { REGEXP_ONLY_DIGITS_AND_CHARS } from "input-otp";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { Separator } from "@/components/ui/separator";
import { useRouter } from "next/navigation";
import { MdOutlineGroup } from "react-icons/md";

export default function RoomJoiner({ path }: { path: string }) {
  const [roomId, setRoomId] = useState("");
  const [newRoomId, setNewRoomId] = useState("");
  const router = useRouter();

  function generateRoomId() {
    const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let result = "";
    for (let i = 0; i < 8; i++) {
      result += characters.charAt(
        Math.floor(Math.random() * characters.length)
      );
    }
    return result;
  }

  useEffect(() => {
    setNewRoomId(generateRoomId());
  }, []);

  return (
    <div className="flex justify-center items-center min-h-screen bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center flex items-center justify-center">
            <MdOutlineGroup className="inline-block mr-2 text-4xl" />
            Quoridor
          </CardTitle>
          <CardDescription className="text-center">
            Enter a room ID to join a game
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="roomId">Room ID</Label>
              <InputOTP
                maxLength={8}
                pattern={REGEXP_ONLY_DIGITS_AND_CHARS}
                value={roomId}
                onChange={(value) => setRoomId(value.toUpperCase())}
              >
                <InputOTPGroup>
                  <InputOTPSlot index={0} className="w-12 h-12 text-2xl" />
                  <InputOTPSlot index={1} className="w-12 h-12 text-2xl" />
                  <InputOTPSlot index={2} className="w-12 h-12 text-2xl" />
                  <InputOTPSlot index={3} className="w-12 h-12 text-2xl" />
                  <InputOTPSlot index={4} className="w-12 h-12 text-2xl" />
                  <InputOTPSlot index={5} className="w-12 h-12 text-2xl" />
                  <InputOTPSlot index={6} className="w-12 h-12 text-2xl" />
                  <InputOTPSlot index={7} className="w-12 h-12 text-2xl" />
                </InputOTPGroup>
              </InputOTP>
            </div>
            <Button
              type="submit"
              className="w-full"
              onClick={() => {
                router.push(`${path}/${roomId}`);
              }}
            >
              Join Room
            </Button>
            <div className="flex items-center justify-center gap-2">
              <Separator className="flex-1" />
              <span className="text-sm text-muted-foreground">OR</span>
              <Separator className="flex-1" />
            </div>
            <div className="flex flex-col items-center justify-center gap-2">
              <div className="text-3xl font-bold">{newRoomId}</div>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  router.push(`${path}/${newRoomId}`);
                }}
              >
                Create Room
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
