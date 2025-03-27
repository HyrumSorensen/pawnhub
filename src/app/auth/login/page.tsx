"use client";

import { useAuthActions } from "@convex-dev/auth/react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { LiaFlipboard } from "react-icons/lia";

export default function Register() {
  const { signIn } = useAuthActions();

  return (
    <div className="flex justify-center items-center min-h-screen bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center flex items-center justify-center">
            <LiaFlipboard className="inline-block mr-2 text-4xl" />
            Sign in to your account
          </CardTitle>
          <CardDescription className="text-center">
            Enter your details below to sign in to your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              const formData = new FormData(event.currentTarget);
              void signIn("password", formData);
            }}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="name@example.com"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="********"
                required
              />
              <div className="text-right">
                <Link
                  href="/auth/forgot-password"
                  className="text-sm text-primary hover:text-primary/90"
                >
                  Forgot Password?
                </Link>
              </div>
            </div>
            <Button type="submit" className="w-full">
              Sign in
            </Button>
            <Input type="hidden" name="flow" value="signIn" />
          </form>
        </CardContent>
        <CardFooter className="flex justify-center">
          <p className="text-sm text-muted-foreground">
            Don&apos;t have an account?{" "}
            <Link
              href="/auth/register"
              className="text-primary underline underline-offset-4 hover:text-primary/90"
            >
              Sign up
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
