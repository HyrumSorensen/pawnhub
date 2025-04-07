"use client";

import { useParams } from "next/navigation";

export default function PokerChipTracker() {
  const { group } = useParams();

  return <div>Poker Chip Tracker {group}</div>;
}
