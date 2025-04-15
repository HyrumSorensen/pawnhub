"use client";

import { Id, Doc } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";

interface GroupOverviewProps {
  isAdmin: boolean;
  chipTypes: Doc<"pokerChipTypes">[];
  members: Doc<"pokerGroupMembers">[];
  getUserName: (userId: Id<"users">) => string;
  editedChipCounts: { [userId: string]: { [chipTypeId: string]: string } };
  dirtyMembers: Set<string>;
  handleEditChip: (userId: string, chipTypeId: string, value: string) => void;
  handleSaveMemberChips: (userId: Id<"users">) => void;
}

export default function GroupOverview({
  isAdmin,
  chipTypes,
  members,
  getUserName,
  editedChipCounts,
  dirtyMembers,
  handleEditChip,
  handleSaveMemberChips,
}: GroupOverviewProps) {
  return (
    <section>
      <h2 className="text-xl font-semibold mb-4">Group Members</h2>
      <ul className="list-disc pl-5 mb-6">
        {members.map((member) => (
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
      {chipTypes.length && members.length ? (
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
                {isAdmin && (
                  <th className="px-4 py-2 border border-gray-300 text-left">Actions</th>
                )}
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
  );
}
