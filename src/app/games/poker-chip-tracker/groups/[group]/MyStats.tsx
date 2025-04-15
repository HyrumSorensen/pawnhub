"use client";

import { Id, Doc } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";

import {
  Line
} from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

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
    const actual = Number(editableCounts[chip._id] ?? chipCounts[chip._id] ?? 0);
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

      <h3 className="text-lg font-medium mb-2">Recent Transactions</h3>
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
      )}

      {transactions?.length ? (
        <div className="mt-8">
          <h3 className="text-lg font-medium mb-2">Chip History</h3>
          <Line
            data={{
              labels: transactions
                .sort((a, b) => a.timestamp - b.timestamp)
                .map((tx) => new Date(tx.timestamp).toLocaleDateString()),
              datasets: [
                {
                  label: "Chips Over Time",
                  data: (() => {
                    let total = 0;
                    return transactions
                      .sort((a, b) => a.timestamp - b.timestamp)
                      .map((tx) => {
                        total += tx.amount;
                        return total;
                      });
                  })(),
                  borderColor: "rgb(75, 192, 192)",
                  backgroundColor: "rgba(75, 192, 192, 0.2)",
                  tension: 0.3,
                },
              ],
            }}
            options={{
              responsive: true,
              plugins: {
                legend: {
                  display: false,
                },
                title: {
                  display: false,
                },
              },
              scales: {
                y: {
                  beginAtZero: true,
                },
              },
            }}
          />
        </div>
      ) : null}

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
                  <th className="px-4 py-2 border border-gray-300 text-left">Net</th>
                  <th className="px-4 py-2 border border-gray-300 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  {chipTypes.map((chip) => {
                    const actual = Number(editableCounts[chip._id] ?? chipCounts[chip._id] ?? 0);
                    const distributed = distributedCounts[chip._id] ?? 0;
                    const net = (actual - distributed) * chip.value;


                    return (
                      <td key={chip._id} className="px-2 py-2 border border-gray-300 text-center">
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
    </section>
  );
}
