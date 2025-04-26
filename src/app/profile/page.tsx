"use client";

import { useState, useRef } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, Upload } from "lucide-react";
import { useAuthActions } from "@convex-dev/auth/react";
import { format } from "date-fns"; // For nicer date formatting

export default function ProfilePage() {
  const { signOut } = useAuthActions();
  const userId = useQuery(api.users.getCurrentUserId);
  const user = useQuery(api.users.getUserById, userId ? { userId } : "skip");
  const updateProfile = useMutation(api.users.updateUserProfile);
  const generateUploadUrl = useMutation(api.storage.generateUploadUrl);
  const getImageUrl = useMutation(api.storage.getImageUrl);

  const myRecentGames = useQuery(api.gameHistory.getMyRecentGames, userId ? { userId, limit: 10 } : "skip");


  const [name, setName] = useState(user?.name ?? "");
  const [isEditing, setIsEditing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [showAllGames, setShowAllGames] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSave = async () => {
    if (!userId) return;
    await updateProfile({
      userId,
      name,
    });
    setIsEditing(false);
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !userId) return;

    setIsUploading(true);
    try {
      const uploadUrl = await generateUploadUrl();

      const response = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });

      if (!response.ok) {
        throw new Error("Upload failed");
      }

      const { storageId } = await response.json();

      const imageUrl = await getImageUrl({ storageId });

      await updateProfile({
        userId,
        avatarUrl: imageUrl ?? undefined,
      });
    } catch (error) {
      console.error("Error uploading avatar:", error);
    } finally {
      setIsUploading(false);
    }
  };

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto w-full space-y-8">
        <div className="space-y-8">
          {/* Profile Section */}
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Avatar className="h-24 w-24">
                <AvatarImage src={user.avatarUrl} />
                <AvatarFallback>
                  <User className="h-12 w-12" />
                </AvatarFallback>
              </Avatar>
              <Button
                variant="outline"
                size="icon"
                className="absolute bottom-0 right-0 rounded-full"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
              >
                <Upload className="h-4 w-4" />
              </Button>
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleAvatarUpload}
              />
            </div>
            <div>
              <h1 className="text-2xl font-bold">{user.name}</h1>
              <p className="text-muted-foreground">{user.email}</p>
            </div>
          </div>

          {/* Edit Name Section */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Name</Label>
              <div className="flex space-x-2 items-center">
                <div className="max-w-sm w-full">
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={!isEditing}
                  />
                </div>
                {!isEditing ? (
                  <Button onClick={() => setIsEditing(true)}>Edit</Button>
                ) : (
                  <Button onClick={handleSave}>Save</Button>
                )}
              </div>

            </div>

            <div>
              <Label>Email</Label>
              <div className="max-w-sm w-full">
                <Input value={user.email ?? ""} disabled />
              </div>

            </div>
          </div>

          {/* Sign Out */}
          <div className="pt-4">
            <Button variant="destructive" onClick={() => signOut()}>
              Sign Out
            </Button>
          </div>

{/* Game History Section */}
<div className="pt-12">
  <h2 className="text-2xl font-bold mb-6">🕹️ Recent Games</h2>

  {myRecentGames && myRecentGames.length > 0 ? (
    <div className="overflow-x-auto">
      <table className="min-w-full table-auto text-left border rounded-lg shadow-sm">
        <thead className="bg-gray-100">
          <tr>
            <th className="px-4 py-2">Date</th>
            <th className="px-4 py-2">Game</th>
            <th className="px-4 py-2">Players</th>
            <th className="px-4 py-2">Status</th>
          </tr>
        </thead>
        <tbody>
          {myRecentGames.slice(0, showAllGames ? myRecentGames.length : 5).map((game) => (
            <tr key={game.gameId} className="border-t">
              <td className="px-4 py-2 text-sm text-gray-600">
                {format(new Date(game.createdAt), "PPpp")}
              </td>
              <td className="px-4 py-2 font-semibold">
                {game.game.charAt(0).toUpperCase() + game.game.slice(1)}
              </td>
              <td className="px-4 py-2 text-sm text-gray-700">
                {game.players.join(", ")}
              </td>
              <td className="px-4 py-2 text-sm text-gray-500">
                {game.completed ? "Completed" : "In Progress"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Show More Button */}
      {myRecentGames.length > 5 && (
        <div className="flex justify-center mt-4">
          <Button variant="outline" onClick={() => setShowAllGames(!showAllGames)}>
            {showAllGames ? "Show Less" : "Show More"}
          </Button>
        </div>
      )}
    </div>
  ) : (
    <div className="text-gray-500">No recent games found.</div>
  )}
</div>


        </div>
      </div>
    </div>
  );
}
