"use client";

import { Doc } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";

import { Line } from "react-chartjs-2";
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

interface MyStatsProps {
  user: Doc<"users">;
  chipTypes: Doc<"pokerChipTypes">[];
  chipCounts: Record<string, number>;
  distributedCounts: Record<string, number>;
  userTotal: number;
  transactions: Doc<"chipTransactions">[] | null;
  editableCounts: { [chipTypeId: string]: string };
  hasChanges: boolean;
  onChange: (chipId: string, value: string) => void;
  onSubmit: () => void;
}

export default function MyStats({
  user,
  chipTypes,
  chipCounts,
  distributedCounts,
  userTotal,
  transactions,
  editableCounts,
  hasChanges,
  onChange,
  onSubmit,
}: MyStatsProps) {
  // Calculate net total across all chip types
  const netTotal = chipTypes.reduce((sum, chip) => {
    const actual = Number(
      editableCounts[chip._id] ?? chipCounts[chip._id] ?? 0
    );
    const distributed = distributedCounts[chip._id] ?? 0;
    return sum + (actual - distributed) * chip.value;
  }, 0);

  return (
    <section>
      <h2 className="text-xl font-semibold mb-4">My Stats</h2>
      <p className="mb-2">
        <strong>Name:</strong> {user.name ?? "Unnamed User"}
      </p>
      <p className="mb-2">
        <strong>Total Chips:</strong> {userTotal ?? 0}
      </p>
      <p className="mb-4">
        <strong>Net Gain/Loss:</strong>{" "}
        <span className={netTotal >= 0 ? "text-green-600" : "text-red-600"}>
          {netTotal > 0 ? "+" : ""}
          {netTotal}
        </span>
      </p>

      {/* <h3 className="text-lg font-medium mb-2">Recent Transactions</h3>
      {transactions?.length ? (
        <ul className="list-disc pl-5">
          {transactions.map((tx) => (
            <li key={tx._id}>
              {tx.transactionType} — {tx.amount} (
              {new Date(tx.timestamp).toLocaleString()})
            </li>
          ))}
        </ul>
      ) : (
        <p>No transactions yet.</p>
      )} */}

            {/* Chip Count Table */}
            <div className="mt-8">
        <h3 className="text-lg font-medium mb-2">My Chip Inventory</h3>
        {chipTypes?.length ? (
          <div className="overflow-x-auto">
            <table className="table-auto w-full border border-gray-300 text-sm">
              <thead>
                <tr className="bg-gray-100">
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
                  <th className="px-4 py-2 border border-gray-300 text-left">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  {chipTypes.map((chip) => {
                    const actual = Number(
                      editableCounts[chip._id] ?? chipCounts[chip._id] ?? 0
                    );
                    const distributed = distributedCounts[chip._id] ?? 0;
                    const net = (actual - distributed) * chip.value;
                    console.log("NET:", net);

                    return (
                      <td
                        key={chip._id}
                        className="px-2 py-2 border border-gray-300 text-center"
                      >
                        <input
                          type="number"
                          className="w-16 px-1 py-0.5 border rounded text-center"
                          value={editableCounts[chip._id] ?? ""}
                          onChange={(e) => onChange(chip._id, e.target.value)}
                        />
                      </td>
                    );
                  })}
                  <td className="px-2 py-2 border border-gray-300 text-center font-medium">
                    {netTotal > 0 ? "+" : ""}
                    {netTotal}
                  </td>
                  <td className="px-2 py-2 border border-gray-300 text-center">
                    {hasChanges && (
                      <Button size="sm" onClick={onSubmit}>
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

      {transactions?.length ? (
  <div className="mt-12">
    <h3 className="text-lg font-medium mb-2">Net Chip Value Over Time</h3>

    {(() => {
      const chipValueMap = Object.fromEntries(
        chipTypes.map((chip) => [chip._id, chip.value])
      );

      const netValueHistory: Record<string, number> = {};

      // Running totals of each chip
      const chipCountMap: Record<string, number> = {};
      const distributedMap: Record<string, number> = {};

      // Sort transactions in order
      const sorted = [...transactions].sort(
        (a, b) => a.timestamp - b.timestamp
      );

      sorted.forEach((tx) => {
        const date = new Date(tx.timestamp).toLocaleDateString();

        const value = chipValueMap[tx.chipTypeId] ?? 1;
        const prev = chipCountMap[tx.chipTypeId] ?? 0;
        chipCountMap[tx.chipTypeId] = prev + tx.amount;

        // For simplicity assume distributed doesn't change (or use your own distributed logic here)
        Object.keys(distributedCounts).forEach((id) => {
          distributedMap[id] = distributedCounts[id];
        });

        // Compute net total at this point
        const netTotal = chipTypes.reduce((sum, chip) => {
          const actual = chipCountMap[chip._id] ?? 0;
          const distributed = distributedMap[chip._id] ?? 0;
          return sum + (actual - distributed) * chip.value;
        }, 0);

        netValueHistory[date] = netTotal;
      });

      const sortedDates = Object.keys(netValueHistory).sort(
        (a, b) => new Date(a).getTime() - new Date(b).getTime()
      );

      const netData = sortedDates.map((date) => netValueHistory[date]);

      return (
        <Line
          data={{
            labels: sortedDates,
            datasets: [
              {
                label: "Net Chip Value Over Time",
                data: netData,
                borderColor: "rgb(255, 99, 132)",
                backgroundColor: "rgba(255, 99, 132, 0.2)",
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
    })()}
  </div>
) : null}

{transactions?.length ? (
  <div className="mt-8">
    <h3 className="text-lg font-medium mb-2">Chip History</h3>

    {(() => {
      const chipValueMap = Object.fromEntries(
        chipTypes.map((chip) => [chip._id, chip.value])
      );

      // Group net value per date
      const dailyTotals: Record<string, number> = {};
      transactions
        .sort((a, b) => a.timestamp - b.timestamp)
        .forEach((tx) => {
          const date = new Date(tx.timestamp).toLocaleDateString();
          const value = chipValueMap[tx.chipTypeId] ?? 1;
          const net = tx.amount * value;
          dailyTotals[date] = (dailyTotals[date] ?? 0) + net;
        });

      const sortedDates = Object.keys(dailyTotals).sort(
        (a, b) => new Date(a).getTime() - new Date(b).getTime()
      );

      let runningTotal = 0;
      const cumulativeData = sortedDates.map((date) => {
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
                data: cumulativeData,
                borderColor: "rgb(75, 192, 192)",
                backgroundColor: "rgba(75, 192, 192, 0.2)",
                tension: 0, // straight lines
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
    })()}
  </div>
) : null}


    </section>
  );
}
