"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id, Doc } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import MyStats from "./MyStats";
import GroupOverview from "./GroupOverview";
import AdminPortal from "./AdminPortal";

export default function GroupPage() {
  const { group } = useParams();
  const groupId = group as Id<"pokerGroups">;

  const [tab, setTab] = useState<"my-stats" | "group-overview" | "admin">("my-stats");
  const [chipName, setChipName] = useState("");
  const [chipValue, setChipValue] = useState("");
  const [chipColor, setChipColor] = useState("");

  const addChipType = useMutation(api.pokerChipTracker.addChipType);
  const recordTransaction = useMutation(api.pokerChipTracker.recordChipTransaction);
  const updateChipCount = useMutation(api.pokerChipTracker.updateMemberChipCount);
  const adjustDistributedChips = useMutation(api.pokerChipTracker.adjustDistributedChips);

  const userId = useQuery(api.users.getCurrentUserId);
  const user = useQuery(api.users.getUserById, userId ? { userId } : "skip");
  const groupDetails = useQuery(api.pokerChipTracker.getPokerGroup, { groupId }) as Doc<"pokerGroups"> | null;
  const members = useQuery(api.pokerChipTracker.listPokerGroupMembers, { groupId });
  const chipTypes = useQuery(api.pokerChipTracker.listChipTypes, { groupId });
  const chipCounts = useQuery(api.pokerChipTracker.getMemberChipCounts, userId && groupId ? { groupId, userId } : "skip");
  const transactions = useQuery(api.pokerChipTracker.listChipTransactions, { groupId, userId: userId ?? undefined });
  const userTotal = useQuery(api.pokerChipTracker.getUserChipTotal, userId ? { groupId, userId } : "skip");

  const isAdmin = groupDetails?.admin === userId;

  const [editableCounts, setEditableCounts] = useState<{ [chipTypeId: Id<"pokerChipTypes">]: string }>({});
  const [hasChanges, setHasChanges] = useState(false);

  const [editedChipCounts, setEditedChipCounts] = useState<{
    [userId: string]: { [chipTypeId: string]: string };
  }>({});
  const [dirtyMembers, setDirtyMembers] = useState<Set<string>>(new Set());

  const handleEditChip = (userId: string, chipTypeId: string, value: string) => {
    setEditedChipCounts((prev) => ({
      ...prev,
      [userId]: { ...prev[userId], [chipTypeId]: value },
    }));
    setDirtyMembers((prev) => new Set(prev).add(userId));
  };

  const handleSaveMemberChips = async (userId: Id<"users">) => {
    const userEdits = editedChipCounts[userId];
    if (!userEdits || !chipTypes) return;
  
    const member = members?.find((m) => m.userId === userId);
    if (!member) return;
  
    for (const chipId in userEdits) {
      const newCount = parseInt(userEdits[chipId]);
      const current = member.chipCounts?.[chipId] ?? 0;
  
      if (newCount !== current) {
        const diff = newCount - current;
  
        await updateChipCount({ groupId, userId, chipTypeId: chipId as Id<"pokerChipTypes">, amount: diff });
        await recordTransaction({
          groupId,
          userId,
          chipTypeId: chipId as Id<"pokerChipTypes">,
          transactionType: diff > 0 ? "admin-add" : "admin-remove",
          amount: diff,
          timestamp: Date.now(),
          note: "Admin manual update",
        });
      }
    }
  
    setDirtyMembers((prev) => {
      const newSet = new Set(prev);
      newSet.delete(userId);
      return newSet;
    });
  };
  

  useEffect(() => {
    if (chipCounts && chipTypes) {
      const initial: typeof editableCounts = {};
      chipTypes.forEach((chip) => {
        initial[chip._id] = (chipCounts?.[chip._id] ?? 0).toString();
      });
      setEditableCounts(initial);
      setHasChanges(false);
    }
  }, [chipCounts, chipTypes]);

  const handleSubmitChipChanges = async () => {
    if (!chipTypes || !userId) return;

    for (const chip of chipTypes) {
      const newCount = parseInt(editableCounts[chip._id] ?? "0");
      const prevCount = chipCounts?.[chip._id] ?? 0;

      if (newCount !== prevCount) {
        const diff = newCount - prevCount;

        await updateChipCount({ groupId, userId, chipTypeId: chip._id, amount: diff });
        await recordTransaction({
          groupId,
          userId,
          chipTypeId: chip._id,
          transactionType: diff > 0 ? "manual-add" : "manual-remove",
          amount: diff,
          timestamp: Date.now(),
          note: "Manual update by user",
        });
      }
    }

    setHasChanges(false);
  };

  const userIdList = members?.map((m) => m.userId) ?? [];
  const usersInGroup = useQuery(api.users.getUsersByIds, userIdList.length ? { userIds: userIdList } : "skip");

  const getUserName = (userId: Id<"users">) => {
    const user = usersInGroup?.find((u) => u._id === userId);
    return user?.name ?? userId;
  };

  const getUserImage = (userId: Id<"users">) => {
    const user = usersInGroup?.find((u) => u._id === userId);
    return user?.image ?? "";
  };
  

  if (!groupDetails || !userId || !user) {
    return <div className="p-8 text-center text-lg text-muted-foreground">Loading group details...</div>;
  }

  return (
    <main className="max-w-5xl mx-auto px-4 py-8">
      <header className="mb-8 text-center">
        <h1 className="text-4xl font-bold tracking-tight">{groupDetails.name}</h1>
      </header>

      <div className="flex justify-center gap-2 mb-6">
        <Button
          size="sm"
          variant={tab === "my-stats" ? "default" : "outline"}
          onClick={() => setTab("my-stats")}
        >
          My Stats
        </Button>
        <Button
          size="sm"
          variant={tab === "group-overview" ? "default" : "outline"}
          onClick={() => setTab("group-overview")}
        >
          Group Overview
        </Button>
        {isAdmin && (
          <Button
            size="sm"
            variant={tab === "admin" ? "default" : "outline"}
            onClick={() => setTab("admin")}
          >
            Admin Portal
          </Button>
        )}
      </div>

      <Separator className="mb-6" />

      <section>
        {tab === "my-stats" && chipTypes && (
          <MyStats
            user={user}
            chipTypes={chipTypes}
            chipCounts={chipCounts ?? {}}
            userTotal={userTotal ?? 0}
            transactions={transactions ?? null}
            editableCounts={editableCounts}
            distributedCounts={
              members?.find((m) => m.userId === userId)?.distributedChipCounts ?? {}
            }
            hasChanges={hasChanges}
            onChange={(chipId, value) => {
              setEditableCounts((prev) => ({ ...prev, [chipId]: value }));
              setHasChanges(true);
            }}
            onSubmit={handleSubmitChipChanges}
          />
        )}

        {tab === "group-overview" && members && chipTypes && (
          <GroupOverview
            isAdmin={isAdmin}
            chipTypes={chipTypes}
            members={members}
            getUserName={getUserName}
            getUserImage={getUserImage}
            editedChipCounts={editedChipCounts}
            dirtyMembers={dirtyMembers}
            handleEditChip={handleEditChip}
            handleSaveMemberChips={handleSaveMemberChips}
          />
        )}

        {tab === "admin" && isAdmin && (
          <AdminPortal
            groupId={groupId}
            chipName={chipName}
            setChipName={setChipName}
            chipValue={chipValue}
            setChipValue={setChipValue}
            chipColor={chipColor}
            setChipColor={setChipColor}
            addChipType={addChipType}
            adjustDistributedChips={adjustDistributedChips}
            chipTypes={chipTypes ?? []}
            members={members ?? []}
            getUserName={getUserName}
            editedChipCounts={editedChipCounts}
            handleEditChip={handleEditChip}
            dirtyMembers={dirtyMembers}
            setDirtyMembers={setDirtyMembers}
          />
        )}
      </section>
    </main>
  );
}
