"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Link from "next/link";
import { useIsMobile } from "../../hooks/useIsMobile"; // (we'll add this hook if not already)

export default function Games() {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <div className="flex flex-col p-6">
        <h1 className="text-3xl font-bold pb-6 text-center">Games</h1>
        <div className="flex flex-col gap-6 items-center">
          <MobileCard title="Quoridor" description="A game of Quoridor, a strategy game for 2 or 4 players." link="/games/quoridor" />
          <MobileCard title="Mancala" description="A game of Mancala, a marble strategy game for 2 players" link="/games/mancala" />
          <MobileCard title="Tic Tac Toe" description="A classic game of Tic Tac Toe for 2 players" link="/games/tic-tac-toe" />
          <MobileCard title="Poker Chip Tracker" description="Keep track of your group's poker chips." link="/games/poker-chip-tracker" />
        </div>
      </div>
    );
  }

  // Desktop version — exactly your original code
  return (
    <div className="flex flex-col p-12">
      <h1 className="text-4xl font-bold pb-4">Games</h1>
      <div className="flex gap-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Quoridor</CardTitle>
            <CardDescription>
              A game of Quoridor, a strategy game for 2 or 4 players.
            </CardDescription>
            <CardContent>
              <Button variant="outline" className="w-full" asChild>
                <Link href="/games/quoridor">Play</Link>
              </Button>
            </CardContent>
          </CardHeader>
        </Card>
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Mancala</CardTitle>
            <CardDescription>
              A game of Mancala, a marble strategy game for 2 players
            </CardDescription>
            <CardContent>
              <Button variant="outline" className="w-full" asChild>
                <Link href="/games/mancala">Play</Link>
              </Button>
            </CardContent>
          </CardHeader>
        </Card>
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Tic Tac Toe</CardTitle>
            <CardDescription>
              A classic game of Tic Tac Toe for 2 players
            </CardDescription>
            <CardContent>
              <Button variant="outline" className="w-full" asChild>
                <Link href="/games/tic-tac-toe">Play</Link>
              </Button>
            </CardContent>
          </CardHeader>
        </Card>
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Poker Chip Tracker</CardTitle>
            <CardDescription>
              Keep track of your group&apos;s poker chips.
            </CardDescription>
            <CardContent>
              <Button variant="outline" className="w-full" asChild>
                <Link href="/games/poker-chip-tracker">Play</Link>
              </Button>
            </CardContent>
          </CardHeader>
        </Card>
      </div>
    </div>
  );
}

// Mobile Card component
function MobileCard({ title, description, link }: { title: string; description: string; link: string }) {
  return (
    <Card className="w-full max-w-xs">
      <CardHeader className="text-center">
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <Button variant="outline" className="w-full" asChild>
          <Link href={link}>Play</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
