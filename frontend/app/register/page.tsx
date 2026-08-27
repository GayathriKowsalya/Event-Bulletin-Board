"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/components/AuthProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const [successMessage, setSuccessMessage] = useState("");

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log(`[AUTH] Signup attempt: ${email}`);
    setLoading(true);
    setError("");
    setSuccessMessage("");

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      console.log(`[AUTH] Signup failure: ${error.message}`);
      setError(error.message);
      setLoading(false);
    } else if (data.user && !data.session) {
      console.log(`[AUTH] Signup success (confirmation required): user ID ${data.user.id}`);
      // Email confirmation is required
      setSuccessMessage("Registration successful. Please check your email to verify your account before logging in.");
      setLoading(false);
    } else {
      console.log(`[AUTH] Signup success (auto-login): user ID ${data.user?.id}`);
      router.push("/");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4 font-sans">
      <div className="w-full max-w-md space-y-8 rounded-xl bg-card border border-border p-8 shadow-md">
        <div>
          <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-foreground">
            Create an account
          </h2>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleRegister}>
          {error && (
            <div className="rounded-md bg-red-50 p-4 text-sm text-red-700">
              {error}
            </div>
          )}
          {successMessage && (
            <div className="rounded-md bg-green-50 p-4 text-sm text-green-700">
              {successMessage}
            </div>
          )}
          <div className="space-y-4 rounded-md shadow-sm">
            <div>
              <Label htmlFor="email-address">Email address</Label>
              <Input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 bg-background text-foreground border-border placeholder:text-muted-foreground focus-visible:ring-primary"
                placeholder="Email address"
              />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 bg-background text-foreground border-border placeholder:text-muted-foreground focus-visible:ring-primary"
                placeholder="Password"
              />
            </div>
          </div>

          <div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Creating account..." : "Sign up"}
            </Button>
          </div>
          
          <div className="text-center text-sm mt-4">
            <span className="text-muted-foreground">Already have an account? </span>
            <Link href="/login" className="font-semibold text-primary hover:text-primary/80">
              Sign in here
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
