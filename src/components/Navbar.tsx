"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { Authenticated, Unauthenticated, AuthLoading } from "convex/react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuthActions } from "@convex-dev/auth/react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";


export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { signOut } = useAuthActions();

  const userId = useQuery(api.users.getCurrentUserId);
  const user = useQuery(
    api.users.getUserById,
    userId ? { userId } : "skip"
  );


  return (
    <nav className="border-b bg-background">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="h-8 w-8 rounded-md bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold">G</span>
            </div>
            <span className="font-semibold text-lg">GameHub</span>
          </div>

          <div className="hidden md:flex items-center space-x-6">
            <Link
              href="/"
              className="text-sm font-medium text-foreground hover:text-primary transition-colors"
            >
              Home
            </Link>
            <Link
              href="/games"
              className="text-sm font-medium text-foreground hover:text-primary transition-colors"
            >
              Games
            </Link>
            <Link
              href="/leaderboards"
              className="text-sm font-medium text-foreground hover:text-primary transition-colors"
            >
              Leaderboards
            </Link>
          </div>

          <Unauthenticated>
            <div className="hidden md:flex items-center space-x-4">
              <Link
                href="/auth/login"
                className="text-sm font-medium text-foreground hover:text-primary transition-colors"
              >
                Sign in
              </Link>
              <Button asChild size="sm">
                <Link href="/auth/register">Sign up</Link>
              </Button>
            </div>
          </Unauthenticated>

          <AuthLoading>
            <div className="flex items-center space-x-2">
              <Skeleton className="w-24 h-8" />
              <Skeleton className="h-8 w-8 rounded-full" />
            </div>
          </AuthLoading>

          <Authenticated>
            <div className="flex items-center space-x-6">
              <Button variant="ghost" onClick={() => signOut()}>
                Sign out
              </Button>
              <Avatar>
                <AvatarImage src="" />
                <AvatarFallback>
                  <User className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>
              <span className="text-sm text-muted-foreground">
                {user?.name ?? ""}
              </span>
            </div>
          </Authenticated>


          <button
            className="md:hidden"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Toggle menu"
          >
            <Menu className="h-6 w-6" />
          </button>
        </div>

        {isMenuOpen && (
          <div className="md:hidden py-4 space-y-4">
            <div className="space-y-3">
              <Link
                href="/"
                className="block text-sm font-medium text-foreground hover:text-primary transition-colors"
              >
                Home
              </Link>
              <Link
                href="/games"
                className="block text-sm font-medium text-foreground hover:text-primary transition-colors"
              >
                Games
              </Link>
              <Link
                href="/leaderboards"
                className="block text-sm font-medium text-foreground hover:text-primary transition-colors"
              >
                Leaderboards
              </Link>
            </div>
            <div className="pt-3 border-t flex flex-col space-y-3">
              <Link
                href="/auth/login"
                className="text-sm font-medium text-foreground hover:text-primary transition-colors"
              >
                Sign in
              </Link>
              <Button asChild size="sm" className="w-full sm:w-auto">
                <Link href="/auth/register">Sign up</Link>
              </Button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
