import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  Trophy,
  Gamepad2,
  MessageSquare,
  Clock,
  ArrowRight,
} from "lucide-react";
import Image from "next/image"

import HeroImage from "../../public/assets/HeroImage.png"
import quoridorImage from "../../public/assets/quoridor.png"
import pokerTrackerImage from "../../public/assets/poker-tracker-image.png"

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="py-20 px-4 bg-gradient-to-b from-background to-muted">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col md:flex-row items-center gap-12">
            <div className="flex-1 space-y-6">
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
                Play board games online with friends,{" "}
                <span className="text-primary">anytime, anywhere</span>
              </h1>
              <p className="text-lg text-muted-foreground">
                Join thousands of players in our growing community of board game
                enthusiasts. Challenge friends, track your scores, and climb the
                leaderboards.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Button size="lg" asChild>
                  <Link href="/auth/register">Get Started</Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link href="/games">Browse Games</Link>
                </Button>
              </div>
            </div>
            <div className="flex-1 relative">
              <div className="w-full max-w-3xl aspect-video mx-auto relative">
                <Image
                  src={HeroImage}
                  alt="Players enjoying board games online"
                  fill
                  className="object-cover rounded-lg"
                />
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">
              Everything you love about board games, now online
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              We&apos;ve taken the best parts of tabletop gaming and brought
              them to your screen, with none of the setup time or lost pieces.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: <Users className="h-10 w-10 text-primary" />,
                title: "Multiplayer Experience",
                description:
                  "Play with friends or match with other players from around the world.",
              },
              {
                icon: <Trophy className="h-10 w-10 text-primary" />,
                title: "Competitive Leaderboards",
                description:
                  "Track your scores and compete for the top spot on global and friend leaderboards.",
              },
              {
                icon: <Gamepad2 className="h-10 w-10 text-primary" />,
                title: "Diverse Game Library",
                description:
                  "From strategy to party games, find something for every type of player.",
              },
              {
                icon: <MessageSquare className="h-10 w-10 text-primary" />,
                title: "In-Game Chat",
                description:
                  "Communicate with other players through text and voice chat.",
              },
              {
                icon: <Clock className="h-10 w-10 text-primary" />,
                title: "Save & Resume",
                description:
                  "Pause your games and continue exactly where you left off.",
              },
              {
                icon: <ArrowRight className="h-10 w-10 text-primary" />,
                title: "Regular Updates",
                description:
                  "New games and features added regularly to keep the experience fresh.",
              },
            ].map((feature, index) => (
              <Card
                key={index}
                className="border bg-card text-card-foreground shadow-sm hover:shadow transition-shadow"
              >
                <CardHeader className="flex flex-row items-center gap-4 pb-2">
                  {feature.icon}
                  <CardTitle>{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

{/* Popular Games Section */}
<section className="py-20 px-4 bg-muted/50">
  <div className="container mx-auto max-w-6xl">
    <div className="text-center mb-16">
      <h2 className="text-3xl font-bold mb-4">Popular Games</h2>
      <p className="text-muted-foreground max-w-2xl mx-auto">
        Explore the games weve crafted and challenge your friends to a match.
      </p>
    </div>

    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 gap-6">
      {[
        {
          name: "Quoridor",
          players: "2-4 players",
          category: "Strategy",
          href: "/games/quoridor",
          image: quoridorImage,
        },
        {
          name: "Pawnhub Poker Tracker",
          players: "2+ players",
          category: "Poker Tools",
          href: "/games/poker-chip-tracker",
          image: pokerTrackerImage,
        },
      ].map((game, index) => (
        <Card
          key={index}
          className="overflow-hidden group cursor-pointer hover:shadow-md transition-shadow"
        >
          <Link href={game.href}>
            <div className="relative w-full h-48">
              <Image
                src={game.image}
                alt={game.name}
                fill
                className="object-cover w-full h-full"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Button variant="secondary" size="sm">
                  Play Now
                </Button>
              </div>
            </div>
          </Link>
          <CardContent className="p-4">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-semibold">{game.name}</h3>
                <p className="text-sm text-muted-foreground">{game.players}</p>
              </div>
              <Badge variant="outline">{game.category}</Badge>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>

    <div className="text-center mt-12">
      <Button variant="outline" asChild>
        <Link href="/games">
          View All Games <ArrowRight className="ml-2 h-4 w-4" />
        </Link>
      </Button>
    </div>
  </div>
</section>




      {/* Leaderboards Preview Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Climb the Leaderboards</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Compete with players worldwide and see your name at the top of the
              rankings.
            </p>
          </div>

          <Card className="overflow-hidden border shadow-sm">
            <CardHeader className="bg-muted/30">
              <CardTitle>Chess Leaderboard</CardTitle>
              <CardDescription>Top players this month</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y">
                {[
                  {
                    rank: 1,
                    name: "GrandMaster99",
                    wins: 142,
                    losses: 23,
                    winRate: "86%",
                  },
                  {
                    rank: 2,
                    name: "ChessWizard",
                    wins: 136,
                    losses: 31,
                    winRate: "81%",
                  },
                  {
                    rank: 3,
                    name: "QueenMover",
                    wins: 129,
                    losses: 42,
                    winRate: "75%",
                  },
                  {
                    rank: 4,
                    name: "KnightRider",
                    wins: 118,
                    losses: 39,
                    winRate: "75%",
                  },
                  {
                    rank: 5,
                    name: "BishopMaster",
                    wins: 112,
                    losses: 44,
                    winRate: "72%",
                  },
                ].map((player, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 hover:bg-muted/20 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <span
                        className={`flex items-center justify-center w-8 h-8 rounded-full ${index === 0 ? "bg-yellow-500/20 text-yellow-700" : index === 1 ? "bg-gray-300/20 text-gray-700" : index === 2 ? "bg-amber-600/20 text-amber-700" : "bg-muted/30"} font-semibold`}
                      >
                        {player.rank}
                      </span>
                      <div>
                        <p className="font-medium">{player.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {player.wins}W / {player.losses}L
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="font-semibold">{player.winRate}</span>
                      <p className="text-sm text-muted-foreground">Win Rate</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
            {["Monopoly", "Catan", "Scrabble"].map((game, index) => (
              <Card key={index} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">{game} Leaderboard</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="divide-y">
                    {[1, 2, 3].map((rank) => (
                      <div
                        key={rank}
                        className="flex items-center justify-between p-3"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-muted-foreground font-medium">
                            {rank}
                          </span>
                          <span className="font-medium">
                            Player{rank * (index + 1)}
                          </span>
                        </div>
                        <span className="text-sm">
                          {Math.floor(95 - rank * 5)}% Win Rate
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="text-center mt-12">
            <Button variant="outline" asChild>
              <Link href="/leaderboards">
                View All Leaderboards <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-primary/5">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Ready to start playing?
          </h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Join our community of board game enthusiasts today and experience
            your favorite games in a whole new way.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild>
              <Link href="/auth/register">Create Account</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/games">Explore Games</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
