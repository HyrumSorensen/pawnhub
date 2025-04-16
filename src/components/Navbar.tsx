"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { Authenticated, Unauthenticated, AuthLoading } from "convex/react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, Settings, LogOut } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuthActions } from "@convex-dev/auth/react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { signOut } = useAuthActions();

  const userId = useQuery(api.users.getCurrentUserId);
  const user = useQuery(api.users.getUserById, userId ? { userId } : "skip");

  return (
    <nav className="border-b bg-background">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">


        <div className="flex items-center space-x-2 group">
  <div className="h-8 w-8 rounded-md bg-primary flex items-center justify-center transition-transform duration-300 group-hover:rotate-6 group-hover:scale-110">
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 256 256"
      className="h-5 w-5 text-primary-foreground"
      fill="currentColor"
    >
      <path d="M176 184H80a8 8 0 0 0-8 8v16h112v-16a8 8 0 0 0-8-8ZM96 96a32 32 0 1 1 64 0c0 11.8-6.4 22.1-16 27.7V136h8a8 8 0 0 1 0 16H104a8 8 0 0 1 0-16h8v-12.3c-9.6-5.6-16-15.9-16-27.7Z"/>
    </svg>
  </div>
  <span className="font-semibold text-lg">
    <span className="text-primary">Pawn</span>
    <span className="text-orange-500">Hub</span>
  </span>
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
              <Skeleton className="h-8 w-8 rounded-full" />
            </div>
          </AuthLoading>

          <Authenticated>
            <div className="flex items-center space-x-6">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="relative h-8 w-8 rounded-full"
                  >
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={user?.avatarUrl} />
                      <AvatarFallback>
                        <User className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {user?.name ?? ""}
                      </p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {user?.email ?? ""}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/profile" className="cursor-pointer">
                      <User className="mr-2 h-4 w-4" />
                      <span>Profile</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/settings" className="cursor-pointer">
                      <Settings className="mr-2 h-4 w-4" />
                      <span>Settings</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-red-600 cursor-pointer"
                    onClick={() => signOut()}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
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
