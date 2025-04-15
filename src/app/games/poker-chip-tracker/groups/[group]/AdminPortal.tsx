"use client";

import { Id, Doc } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";

interface AdminPortalProps {
  groupId: Id<"pokerGroups">;
  chipName: string;
  setChipName: (val: string) => void;
  chipValue: string;
  setChipValue: (val: string) => void;
  chipColor: string;
  setChipColor: (val: string) => void;

  addChipType: (args: {
    groupId: Id<"pokerGroups">;
    name: string;
    value: number;
    createdAt: number;
    color?: string;
  }) => Promise<string>;
  

  adjustDistributedChips: (args: {
    groupId: Id<"pokerGroups">;
    userId: Id<"users">;
    chipTypeId: Id<"pokerChipTypes">;
    amount: number;
  }) => Promise<null>;
  

  chipTypes: Doc<"pokerChipTypes">[];
  members: Doc<"pokerGroupMembers">[];
  getUserName: (userId: Id<"users">) => string;
  editedChipCounts: { [userId: string]: { [chipTypeId: string]: string } };
  handleEditChip: (userId: string, chipTypeId: string, value: string) => void;
  dirtyMembers: Set<string>;
  setDirtyMembers: React.Dispatch<React.SetStateAction<Set<string>>>;
}

export default function AdminPortal({
  groupId,
  chipName,
  setChipName,
  chipValue,
  setChipValue,
  chipColor,
  setChipColor,
  addChipType,
  adjustDistributedChips,
  chipTypes,
  members,
  getUserName,
  editedChipCounts,
  handleEditChip,
  dirtyMembers,
  setDirtyMembers,
}: AdminPortalProps) {
  return (
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

      {/* Manage Distributed Chips Table */}
      <div className="mt-8">
        <h3 className="text-lg font-medium mb-2">Distributed Chips</h3>

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
                  <th className="px-4 py-2 border border-gray-300 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {members.map((member) => (
                  <tr key={member._id}>
                    <td className="px-4 py-2 border border-gray-300 text-left">
                      {getUserName(member.userId)}
                    </td>

                    {chipTypes.map((chip) => {
                      const distCount = member.distributedChipCounts?.[chip._id] ?? 0;
                      return (
                        <td key={chip._id} className="px-2 py-2 border border-gray-300 text-center">
                          <input
                            type="number"
                            className="w-16 px-1 py-0.5 border rounded text-center"
                            value={
                              editedChipCounts[member.userId]?.[chip._id] ??
                              distCount.toString()
                            }
                            onChange={(e) =>
                              handleEditChip(member.userId, chip._id, e.target.value)
                            }
                          />
                        </td>
                      );
                    })}

                    <td className="px-4 py-2 border border-gray-300 text-center">
                      {dirtyMembers.has(member.userId) && (
                        <Button
                          size="sm"
                          onClick={async () => {
                            const userEdits = editedChipCounts[member.userId];
                            if (!userEdits || !chipTypes) return;
                            for (const chipTypeIdStr in userEdits) {
                                const chipTypeId = chipTypeIdStr as Id<"pokerChipTypes">;
                                const newCount = parseInt(userEdits[chipTypeId] ?? "0");
                                const current = member.distributedChipCounts?.[chipTypeId] ?? 0;
                              
                                if (newCount !== current) {
                                  const diff = newCount - current;
                              
                                  await adjustDistributedChips({
                                    groupId,
                                    userId: member.userId,
                                    chipTypeId,
                                    amount: diff,
                                  });
                                }
                              }
                              
                              

                            setDirtyMembers((prev) => {
                              const newSet = new Set(prev);
                              newSet.delete(member.userId);
                              return newSet;
                            });
                          }}
                        >
                          Save
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p>No data available yet.</p>
        )}
      </div>
    </section>
  );
}
