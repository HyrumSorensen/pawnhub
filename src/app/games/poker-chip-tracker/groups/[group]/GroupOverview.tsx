"use client";

import { Id, Doc } from "@/convex/_generated/dataModel";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"; // Make sure you have this
import { useQuery, useConvex } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Line } from "react-chartjs-2";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User } from "lucide-react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface GroupOverviewProps {
  isAdmin: boolean;
  chipTypes: Doc<"pokerChipTypes">[];
  members: Doc<"pokerGroupMembers">[];
  getUserName: (userId: Id<"users">) => string;
  getUserImage: (userId: Id<"users">) => string;
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
  getUserImage,
  editedChipCounts,
  dirtyMembers,
  handleEditChip,
  handleSaveMemberChips,
}: GroupOverviewProps) {
  const [selectedUserId, setSelectedUserId] = useState<Id<"users"> | null>(
    null
  );
  const [showModal, setShowModal] = useState(false);
  const [memberTransactions, setMemberTransactions] =
    useState<MemberTransactionsMap>({});
  const colorPalette = [
    "#4e79a7",
    "#f28e2c",
    "#e15759",
    "#76b7b2",
    "#59a14f",
    "#edc948",
    "#b07aa1",
    "#ff9da7",
    "#9c755f",
    "#bab0ac",
    "#8dd3c7",
    "#ffffb3",
    "#bebada",
    "#fb8072",
    "#80b1d3",
    "#fdb462",
    "#b3de69",
    "#fccde5",
    "#d9d9d9",
    "#bc80bd",
    "#ccebc5",
    "#ffed6f",
    "#1f77b4",
    "#ff7f0e",
    "#2ca02c",
    "#d62728",
    "#9467bd",
    "#8c564b",
    "#e377c2",
    "#7f7f7f",
    "#bcbd22",
    "#17becf",
  ];

  const selectedUserTransactions = useQuery(
    api.pokerChipTracker.listChipTransactions,
    selectedUserId && members[0]?.groupId
      ? { userId: selectedUserId, groupId: members[0].groupId }
      : "skip"
  );

  const convex = useConvex();
  type MemberTransactionsMap = Record<string, Doc<"chipTransactions">[]>;

  useEffect(() => {
    const fetchTransactions = async () => {
      const result: MemberTransactionsMap = {};
      for (const member of members) {
        const res = await convex.query(
          api.pokerChipTracker.listChipTransactions,
          {
            groupId: member.groupId,
            userId: member.userId,
          }
        );
        result[member.userId] = res;
      }
      setMemberTransactions(result);
    };

    if (
      members.length &&
      chipTypes.length &&
      Object.keys(memberTransactions).length === 0
    ) {
      fetchTransactions();
    }
  }, [members, chipTypes, memberTransactions, convex]);

  return (
    <section>
      <h2 className="text-xl font-semibold mt-6 mb-2">
        All Member Chip Counts
      </h2>
      {chipTypes.length && members.length ? (
        <div className="overflow-x-auto">
          <table className="table-auto w-full border border-gray-300 text-sm">
            <thead>
              <tr className="bg-gray-100">
                <th className="px-4 py-2 border border-gray-300 text-left">
                  User
                </th>
                {chipTypes.map((chip) => (
                  <th
                    key={chip._id}
                    className="px-4 py-2 border border-gray-300 text-left"
                  >
                    {chip.name}
                  </th>
                ))}
                <th className="px-4 py-2 border border-gray-300 text-left">
                  Net
                </th>
                {isAdmin && (
                  <th className="px-4 py-2 border border-gray-300 text-left">
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
            {[...members]
              .sort((a, b) => {
                const getNet = (m: Doc<"pokerGroupMembers">) =>
                  chipTypes.reduce((sum, chip) => {
                    const actual = m.chipCounts?.[chip._id] ?? 0;
                    const distributed = m.distributedChipCounts?.[chip._id] ?? 0;
                    return sum + (actual - distributed) * chip.value;
                  }, 0);

                return getNet(b) - getNet(a);
              })
              .map((member) => (
                <tr key={member._id}>
                  <td
                    className="px-4 py-2 border border-gray-300 text-left cursor-pointer text-blue-600 hover:underline"
                    onClick={() => {
                      setSelectedUserId(member.userId);
                      setShowModal(true);
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={getUserImage(member.userId)} />
                        <AvatarFallback>
                          <User className="h-4 w-4" />
                        </AvatarFallback>
                      </Avatar>
                      <span>{getUserName(member.userId)}</span>
                    </div>
                  </td>

                  {chipTypes.map((chip) => {
                    const current = member.chipCounts?.[chip._id] ?? 0;
                    if (!isAdmin) {
                      return (
                        <td
                          key={chip._id}
                          className="px-4 py-2 border border-gray-300 text-center"
                        >
                          {current}
                        </td>
                      );
                    }
                    return (
                      <td
                        key={chip._id}
                        className="px-2 py-2 border border-gray-300 text-center"
                      >
                        <input
                          type="number"
                          className="w-16 px-1 py-0.5 border rounded text-center"
                          value={
                            editedChipCounts[member.userId]?.[chip._id] ??
                            current.toString()
                          }
                          onChange={(e) =>
                            handleEditChip(
                              member.userId,
                              chip._id,
                              e.target.value
                            )
                          }
                        />
                      </td>
                    );
                  })}
                  <td className="px-2 py-2 border border-gray-300 text-center font-medium">
                    {(() => {
                      const netTotal = chipTypes.reduce((sum, chip) => {
                        const actual = member.chipCounts?.[chip._id] ?? 0;
                        const distributed =
                          member.distributedChipCounts?.[chip._id] ?? 0;
                        return sum + (actual - distributed) * chip.value;
                      }, 0);
                      return (
                        <span
                          className={
                            netTotal >= 0 ? "text-green-600" : "text-red-600"
                          }
                        >
                          {netTotal > 0 ? "+" : ""}
                          {netTotal}
                        </span>
                      );
                    })()}
                  </td>

                  {isAdmin && (
                    <td className="px-4 py-2 border border-gray-300 text-center">
                      {dirtyMembers.has(member.userId) && (
                        <Button size="sm" onClick={() => handleSaveMemberChips(member.userId)}>
                          Save
                        </Button>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>

          {Object.keys(memberTransactions).length && chipTypes.length
            ? (() => {
                const chipValueMap = Object.fromEntries(
                  chipTypes.map((chip) => [chip._id, chip.value])
                );

                // Step 1: Collect all unique dates across all users
                const allDatesSet = new Set<string>();

                const perUserCumulative: {
                  label: string;
                  data: number[];
                }[] = [];

                members.forEach((member) => {
                  const transactions = memberTransactions[member.userId] ?? [];
                  const dailyTotals: Record<string, number> = {};

                  transactions
                    .sort((a, b) => a.timestamp - b.timestamp)
                    .forEach((tx) => {
                      const date = new Date(tx.timestamp).toLocaleDateString();
                      const value = chipValueMap[tx.chipTypeId] ?? 1;
                      dailyTotals[date] =
                        (dailyTotals[date] ?? 0) + tx.amount * value;
                      allDatesSet.add(date);
                    });

                  const sortedDates = Array.from(allDatesSet).sort(
                    (a, b) => new Date(a).getTime() - new Date(b).getTime()
                  );

                  let runningTotal = 0;
                  const cumulative = sortedDates.map((date) => {
                    runningTotal += dailyTotals[date] ?? 0;
                    return runningTotal;
                  });

                  perUserCumulative.push({
                    label: getUserName(member.userId),
                    data: cumulative,
                  });
                });

                const sortedDates = Array.from(allDatesSet).sort(
                  (a, b) => new Date(a).getTime() - new Date(b).getTime()
                );

                function getColorForUser(userId: string): string {
                  let hash = 0;
                  for (let i = 0; i < userId.length; i++) {
                    hash = userId.charCodeAt(i) + ((hash << 5) - hash);
                    hash = hash & hash; // Convert to 32bit integer
                  }
                  const index = Math.abs(hash) % colorPalette.length;
                  return colorPalette[index];
                }

                return (
                  <div className="mt-12">
                    <h3 className="text-lg font-medium mb-4">
                      Group Chip Value History
                    </h3>
                    <Line
                      data={{
                        labels: sortedDates,
                        datasets: perUserCumulative.map((userData) => ({
                          ...userData,
                          borderColor: getColorForUser(userData.label), // label = username
                          pointBackgroundColor: getColorForUser(userData.label),
                          pointBorderColor: getColorForUser(userData.label),
                          backgroundColor: "transparent",
                          tension: 0,
                        })),
                      }}
                      options={{
                        responsive: true,
                        plugins: {
                          legend: { display: true },
                          title: { display: false },
                        },
                        scales: {
                          y: {
                            beginAtZero: true,
                            ticks: {
                              callback: (value) => `$${value}`,
                            },
                          },
                        },
                      }}
                    />
                  </div>
                );
              })()
            : null}

          <Dialog open={showModal} onOpenChange={setShowModal}>
            <DialogContent className="max-w-3xl">
              <DialogHeader>
                <DialogTitle>User Poker History</DialogTitle>
              </DialogHeader>
              {selectedUserTransactions && chipTypes.length ? (
                (() => {
                  const chipValueMap = Object.fromEntries(
                    chipTypes.map((chip) => [chip._id, chip.value])
                  );

                  const dailyTotals: Record<string, number> = {};
                  selectedUserTransactions
                    .sort((a, b) => a.timestamp - b.timestamp)
                    .forEach((tx) => {
                      const date = new Date(tx.timestamp).toLocaleDateString();
                      const value = chipValueMap[tx.chipTypeId] ?? 1;
                      dailyTotals[date] =
                        (dailyTotals[date] ?? 0) + tx.amount * value;
                    });

                  const sortedDates = Object.keys(dailyTotals).sort(
                    (a, b) => new Date(a).getTime() - new Date(b).getTime()
                  );

                  let runningTotal = 0;
                  const cumulative = sortedDates.map((date) => {
                    runningTotal += dailyTotals[date];
                    return runningTotal;
                  });

                  return (
                    <Line
                      data={{
                        labels: sortedDates,
                        datasets: [
                          {
                            label: "Net Value Over Time",
                            data: cumulative,
                            borderColor: "rgb(75, 192, 192)",
                            backgroundColor: "rgba(75, 192, 192, 0.2)",
                            tension: 0,
                          },
                        ],
                      }}
                      options={{
                        responsive: true,
                        plugins: {
                          legend: { display: false },
                          title: { display: false },
                        },
                        scales: {
                          y: {
                            beginAtZero: true,
                            ticks: {
                              callback: (value) => `$${value}`,
                            },
                          },
                        },
                      }}
                    />
                  );
                })()
              ) : (
                <p className="text-sm text-muted-foreground">
                  Loading or no transactions found.
                </p>
              )}
            </DialogContent>
          </Dialog>
        </div>
      ) : (
        <p>No data available yet.</p>
      )}
    </section>
  );
}
