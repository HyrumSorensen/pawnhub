import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Link from "next/link";

export default function Games() {
  return (
    <div className="flex flex-col p-12">
      <h1 className="text-4xl font-bold pb-4">Games</h1>
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
    </div>
  );
}
