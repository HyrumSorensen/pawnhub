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

  const [tab, setTab] = useState<"my-stats" | "group-overview" | "admin">(
    "my-stats"
  );
  const [chipName, setChipName] = useState("");
  const [chipValue, setChipValue] = useState("");
  const [chipColor, setChipColor] = useState("");

  // Mutations (called top-level to satisfy React rules)
  const addChipType = useMutation(api.pokerChipTracker.addChipType);
  const recordTransaction = useMutation(
    api.pokerChipTracker.recordChipTransaction
  );
  const updateChipCount = useMutation(
    api.pokerChipTracker.updateMemberChipCount
  );
  const adjustDistributedChips = useMutation(
    api.pokerChipTracker.adjustDistributedChips
  );

  // Queries
  const userId = useQuery(api.users.getCurrentUserId);
  const user = useQuery(api.users.getUserById, userId ? { userId } : "skip");

  const groupDetails = useQuery(api.pokerChipTracker.getPokerGroup, {
    groupId,
  }) as Doc<"pokerGroups"> | null;
  const members = useQuery(api.pokerChipTracker.listPokerGroupMembers, {
    groupId,
  });
  const chipTypes = useQuery(api.pokerChipTracker.listChipTypes, { groupId });
  const chipCounts = useQuery(
    api.pokerChipTracker.getMemberChipCounts,
    userId && groupId ? { groupId, userId } : "skip"
  );

  const transactions = useQuery(api.pokerChipTracker.listChipTransactions, {
    groupId,
    userId: userId ?? undefined,
  });

  const userTotal = useQuery(
    api.pokerChipTracker.getUserChipTotal,
    userId ? { groupId, userId } : "skip"
  );

  // Derived
  const isAdmin = groupDetails?.admin === userId;

  const userChipTotals =
    members?.map((member) => {
      const total =
        transactions
          ?.filter((tx) => tx.userId === member.userId)
          .reduce((sum, tx) => sum + tx.amount, 0) ?? 0;
      console.log("chip totals:", userChipTotals);

      return {
        userId: member.userId,
        total,
      };
    }) ?? [];

  const [editableCounts, setEditableCounts] = useState<{
    [chipTypeId: Id<"pokerChipTypes">]: string;
  }>({});
  const [hasChanges, setHasChanges] = useState(false);

  const [editedChipCounts, setEditedChipCounts] = useState<{
    [userId: string]: { [chipTypeId: string]: string };
  }>({});
  const [dirtyMembers, setDirtyMembers] = useState<Set<string>>(new Set());

  const handleEditChip = (
    userId: string,
    chipTypeId: string,
    value: string
  ) => {
    setEditedChipCounts((prev) => ({
      ...prev,
      [userId]: {
        ...prev[userId],
        [chipTypeId]: value,
      },
    }));
    setDirtyMembers((prev) => new Set(prev).add(userId));
  };

  const handleSaveMemberChips = async (userId: Id<"users">) => {
    const userEdits = editedChipCounts[userId];
    if (!userEdits || !chipTypes) return;

    for (const chip of chipTypes) {
      const newCount = parseInt(userEdits[chip._id] ?? "0");
      const member = members?.find((m) => m.userId === userId);
      const current = member?.chipCounts?.[chip._id] ?? 0;

      if (newCount !== current) {
        const diff = newCount - current;

        await updateChipCount({
          groupId,
          userId,
          chipTypeId: chip._id,
          amount: diff,
        });

        await recordTransaction({
          groupId,
          userId,
          chipTypeId: chip._id,
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

  // initialize editableCounts when chipCounts load
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

        // Update chip count
        await updateChipCount({
          groupId,
          userId,
          chipTypeId: chip._id,
          amount: diff,
        });

        // Record transaction
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

  // Action handler
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const recordChip = async (
    type: "add" | "remove",
    targetUserId: Id<"users">,
    amount: number
  ) => {
    const defaultChip = chipTypes?.[0];
    if (!defaultChip) return;

    await recordTransaction({
      groupId,
      userId: targetUserId,
      chipTypeId: defaultChip._id,
      transactionType: type,
      amount,
      timestamp: Date.now(),
    });
  };

  const userIdList = members?.map((m) => m.userId) ?? [];

  const usersInGroup = useQuery(
    api.users.getUsersByIds,
    userIdList.length ? { userIds: userIdList } : "skip"
  );

  // Helper: map userId -> name
  const getUserName = (userId: Id<"users">) => {
    const user = usersInGroup?.find((u) => u._id === userId);
    return user?.name ?? userId;
  };

  if (!groupDetails || !userId || !user) {
    return <div className="p-6">Loading group...</div>;
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">{groupDetails.name}</h1>

      {/* Tabs */}
      <div className="flex gap-4 mb-6">
        <Button
          variant={tab === "my-stats" ? "default" : "outline"}
          onClick={() => setTab("my-stats")}
        >
          My Stats
        </Button>
        <Button
          variant={tab === "group-overview" ? "default" : "outline"}
          onClick={() => setTab("group-overview")}
        >
          Group Overview
        </Button>
        {isAdmin && (
          <Button
            variant={tab === "admin" ? "default" : "outline"}
            onClick={() => setTab("admin")}
          >
            Admin Portal
          </Button>
        )}
      </div>

      <Separator className="mb-6" />

      {tab === "my-stats" && user && chipTypes && (
        <MyStats
          user={user}
          chipTypes={chipTypes}
          chipCounts={chipCounts ?? {}}
          userTotal={userTotal ?? 0}
          transactions={transactions ?? null}
          editableCounts={editableCounts}
          distributedCounts={
            members?.find((m) => m.userId === userId)?.distributedChipCounts ??
            {}
          }
          hasChanges={hasChanges}
          onChange={(chipId, value) => {
            setEditableCounts((prev) => ({
              ...prev,
              [chipId]: value,
            }));
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
    </div>
  );
}
