"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id, Doc } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

export default function GroupPage() {
  const { group } = useParams();
  const groupId = group as Id<"pokerGroups">;

  const [tab, setTab] = useState<"my-stats" | "group-overview" | "admin">("my-stats");
  const [chipName, setChipName] = useState("");
  const [chipValue, setChipValue] = useState("");
  const [chipColor, setChipColor] = useState("");

  // Mutations (called top-level to satisfy React rules)
  const addChipType = useMutation(api.pokerChipTracker.addChipType);
  const recordTransaction = useMutation(api.pokerChipTracker.recordChipTransaction);
  const updateChipCount = useMutation(api.pokerChipTracker.updateMemberChipCount);

  // Queries
  const userId = useQuery(api.users.getCurrentUserId);
  const user = useQuery(
    api.users.getUserById,
    userId ? { userId } : "skip"
  );
  
  const groupDetails = useQuery(api.pokerChipTracker.getPokerGroup, { groupId }) as Doc<"pokerGroups"> | null;
  const members = useQuery(api.pokerChipTracker.listPokerGroupMembers, { groupId });
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

  const userChipTotals = members?.map((member) => {
    const total = transactions
      ?.filter((tx) => tx.userId === member.userId)
      .reduce((sum, tx) => sum + tx.amount, 0) ?? 0;

    return {
      userId: member.userId,
      total,
    };
  }) ?? [];

  const [editableCounts, setEditableCounts] = useState<{ [chipTypeId: Id<"pokerChipTypes">]: string }>({});
  const [hasChanges, setHasChanges] = useState(false);

  const [editedChipCounts, setEditedChipCounts] = useState<{
    [userId: string]: { [chipTypeId: string]: string };
  }>({});
  const [dirtyMembers, setDirtyMembers] = useState<Set<string>>(new Set());
  
  const handleEditChip = (userId: string, chipTypeId: string, value: string) => {
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
        <Button variant={tab === "my-stats" ? "default" : "outline"} onClick={() => setTab("my-stats")}>
          My Stats
        </Button>
        <Button variant={tab === "group-overview" ? "default" : "outline"} onClick={() => setTab("group-overview")}>
          Group Overview
        </Button>
        {isAdmin && (
          <Button variant={tab === "admin" ? "default" : "outline"} onClick={() => setTab("admin")}>
            Admin Portal
          </Button>
        )}
      </div>

      <Separator className="mb-6" />

      {/* My Stats Tab */}
      {tab === "my-stats" && (
        <section>
          <h2 className="text-xl font-semibold mb-4">My Stats</h2>
          <p className="mb-2"><strong>Name:</strong> {user.name ?? "Unnamed User"}</p>
          <p className="mb-4"><strong>Total Chips:</strong> {userTotal ?? 0}</p>
          <h3 className="text-lg font-medium mb-2">Recent Transactions</h3>
          {transactions?.length ? (
            <ul className="list-disc pl-5">
              {transactions.map((tx) => (
                <li key={tx._id}>
                  {tx.transactionType} — {tx.amount} ({new Date(tx.timestamp).toLocaleString()})
                </li>
              ))}
            </ul>
          ) : (
            <p>No transactions yet.</p>
          )}
{/* Chip Count Table */}
<div className="mt-8">
  <h3 className="text-lg font-medium mb-2">My Chip Inventory</h3>

  {chipTypes?.length ? (
    <div className="overflow-x-auto">
      <table className="table-auto w-full border border-gray-300 text-sm">
        <thead>
          <tr className="bg-gray-100">
            {chipTypes.map((chip) => (
              <th key={chip._id} className="px-4 py-2 border border-gray-300 text-left">
                {chip.name}
              </th>
            ))}
            <th className="px-4 py-2 border border-gray-300 text-left">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            {chipTypes.map((chip) => (
              <td key={chip._id} className="px-2 py-2 border border-gray-300 text-center">
                <input
                  type="number"
                  className="w-16 px-1 py-0.5 border rounded text-center"
                  value={editableCounts[chip._id] ?? ""}
                  onChange={(e) => {
                    setEditableCounts((prev) => ({
                      ...prev,
                      [chip._id]: e.target.value,
                    }));
                    setHasChanges(true);
                  }}
                />
              </td>
            ))}
            <td className="px-2 py-2 border border-gray-300 text-center">
              {hasChanges && (
                <Button size="sm" onClick={handleSubmitChipChanges}>
                  Save
                </Button>
              )}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  ) : (
    <p>No chip types have been defined yet.</p>
  )}
</div>


        </section>
      )}

      {/* Group Overview Tab */}
      {tab === "group-overview" && (
        <section>
          <h2 className="text-xl font-semibold mb-4">Group Members</h2>
          <ul className="list-disc pl-5 mb-6">
            {members?.map((member) => (
              <li key={member._id}>{member.userId}</li>
            ))}
          </ul>

          <h2 className="text-xl font-semibold mb-2">Chip Types</h2>
          {chipTypes?.length ? (
            <ul className="list-disc pl-5">
              {chipTypes.map((chip) => (
                <li key={chip._id}>
                  {chip.name} - ${chip.value}
                  {chip.color && ` (${chip.color})`}
                </li>
              ))}
            </ul>
          ) : (
            <p>No chip types defined yet.</p>
          )}

<h2 className="text-xl font-semibold mt-6 mb-2">All Member Chip Counts</h2>
{chipTypes?.length && members?.length ? (
  <div className="overflow-x-auto">
    <table className="table-auto w-full border border-gray-300 text-sm">
      <thead>
        <tr className="bg-gray-100">
          <th className="px-4 py-2 border border-gray-300 text-left">User</th>
          {chipTypes.map((chip) => (
            <th key={chip._id} className="px-4 py-2 border border-gray-300 text-left">
              {chip.name}
            </th>
          ))}
          {isAdmin && <th className="px-4 py-2 border border-gray-300 text-left">Actions</th>}
        </tr>
      </thead>
      <tbody>
        {members.map((member) => (
          <tr key={member._id}>
            <td className="px-4 py-2 border border-gray-300 text-left">
              {getUserName(member.userId)}
            </td>

            {chipTypes.map((chip) => {
              const current = member.chipCounts?.[chip._id] ?? 0;

              if (!isAdmin) {
                return (
                  <td key={chip._id} className="px-4 py-2 border border-gray-300 text-center">
                    {current}
                  </td>
                );
              }

              return (
                <td key={chip._id} className="px-2 py-2 border border-gray-300 text-center">
                  <input
                    type="number"
                    className="w-16 px-1 py-0.5 border rounded text-center"
                    value={
                      editedChipCounts[member.userId]?.[chip._id] ??
                      current.toString()
                    }
                    onChange={(e) =>
                      handleEditChip(member.userId, chip._id, e.target.value)
                    }
                  />
                </td>
              );
            })}
            {isAdmin && (
              <td className="px-4 py-2 border border-gray-300 text-center">
                {dirtyMembers.has(member.userId) && (
                  <Button
                    size="sm"
                    onClick={() =>
                      handleSaveMemberChips(member.userId as Id<"users">)
                    }
                  >
                    Save
                  </Button>
                )}
              </td>
            )}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
) : (
  <p>No data available yet.</p>
)}

        </section>
      )}

      {/* Admin Portal Tab */}
      {tab === "admin" && isAdmin && (
        <section>
          <h2 className="text-xl font-semibold mb-4">Admin Portal</h2>

          {/* Add Chip Form */}
          <div className="mb-6">
            <h3 className="text-lg font-medium mb-2">Add New Chip Type</h3>
            <form
              className="space-y-2"
              onSubmit={async (e) => {
                e.preventDefault();
                if (!chipName || !chipValue) return;

                await addChipType({
                  groupId,
                  name: chipName,
                  value: parseFloat(chipValue),
                  createdAt: Date.now(),
                  color: chipColor || undefined,
                });

                setChipName("");
                setChipValue("");
                setChipColor("");
              }}
            >
              <input
                type="text"
                placeholder="Chip Name"
                className="w-full border rounded px-2 py-1"
                value={chipName}
                onChange={(e) => setChipName(e.target.value)}
              />
              <input
                type="number"
                placeholder="Chip Value"
                className="w-full border rounded px-2 py-1"
                value={chipValue}
                onChange={(e) => setChipValue(e.target.value)}
              />
              <input
                type="text"
                placeholder="Chip Color (optional)"
                className="w-full border rounded px-2 py-1"
                value={chipColor}
                onChange={(e) => setChipColor(e.target.value)}
              />
              <Button type="submit">Add Chip</Button>
            </form>
          </div>

          {/* Manage Member Chips */}
          <div>
            <h3 className="text-lg font-medium mb-2">Manage Member Chips</h3>
            {members?.map((member) => {
              const userTotal = userChipTotals.find((u) => u.userId === member.userId)?.total ?? 0;

              return (
                <div
                  key={member._id}
                  className="border p-3 rounded mb-2 flex justify-between items-center"
                >
                  <div>
                    <p>User: {member.userId}</p>
                    <p>Chips: {userTotal}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => recordChip("add", member.userId, 1)}
                    >
                      +1
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => recordChip("remove", member.userId, -1)}
                    >
                      -1
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
