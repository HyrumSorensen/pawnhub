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
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

export default function PokerChipTracker() {
  const router = useRouter();

  const userId = useQuery(api.users.getCurrentUserId);
  const user = userId
    ? // eslint-disable-next-line react-hooks/rules-of-hooks
      useQuery(api.users.getUserById, { userId })
    : undefined;

  const joinGroup = useMutation(api.pokerChipTracker.joinPokerGroup);
  const createGroup = useMutation(api.pokerChipTracker.createPokerGroup);

  const [groupCode, setGroupCode] = useState("");
  const [newGroupCode, setNewGroupCode] = useState("");
  const [error, setError] = useState("");

  const group = useQuery(
    api.pokerChipTracker.getGroupByCode,
    groupCode.length === 8 ? { groupCode } : "skip"
  );

  useEffect(() => {
    // Generate a clean 8-char group code
    const generateCode = () => {
      const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
      let code = "";
      for (let i = 0; i < 8; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return code;
    };

    setNewGroupCode(generateCode());
  }, []);

  const handleJoin = async () => {
    setError("");

    if (!group || !userId) {
      setError("Group not found or not ready.");
      return;
    }

    await joinGroup({
      groupId: group._id as Id<"pokerGroups">,
      userId,
      joinedAt: Date.now(),
    });

    router.push(`/games/poker-chip-tracker/groups/${group._id}`);
  };

  const handleCreate = async () => {
    if (!userId) return;

    const createdAt = Date.now();

    const groupId = await createGroup({
      name: "My Poker Group",
      admin: userId,
      createdAt,
      groupCode: newGroupCode,
    });

    await joinGroup({
      groupId: groupId as Id<"pokerGroups">,
      userId: userId as Id<"users">,
      joinedAt: createdAt,
    });

    router.push(`/games/poker-chip-tracker/groups/${groupId}`);
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center flex items-center justify-center">
            <MdOutlineGroup className="inline-block mr-2 text-4xl" />
            Poker Chip Tracker
          </CardTitle>
          <CardDescription className="text-center">
            Enter a group code to join a poker session
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Join Existing Group */}
            <div className="space-y-2">
              <Label htmlFor="groupCode">Group Code</Label>
              <InputOTP
                maxLength={8}
                pattern={REGEXP_ONLY_DIGITS_AND_CHARS}
                value={groupCode}
                onChange={(value) => setGroupCode(value.toUpperCase())}
              >
                <InputOTPGroup>
                  {[...Array(8)].map((_, i) => (
                    <InputOTPSlot
                      key={i}
                      index={i}
                      className="w-12 h-12 text-2xl"
                    />
                  ))}
                </InputOTPGroup>
              </InputOTP>
              {error && <p className="text-sm text-red-500 mt-1">{error}</p>}
            </div>
            <Button
              type="submit"
              className="w-full"
              onClick={handleJoin}
              disabled={groupCode.length !== 8 || !user}
            >
              Join Group
            </Button>

            {/* OR separator */}
            <div className="flex items-center justify-center gap-2">
              <Separator className="flex-1" />
              <span className="text-sm text-muted-foreground">OR</span>
              <Separator className="flex-1" />
            </div>

            {/* Create New Group */}
            <div className="flex flex-col items-center justify-center gap-2">
              <div className="text-3xl font-bold">{newGroupCode}</div>
              <Button
                variant="outline"
                className="w-full"
                onClick={handleCreate}
                disabled={!user}
              >
                Create New Group
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
