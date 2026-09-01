"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/components/AuthProvider";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const router = useRouter();

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      setError("Please enter your email and password.");
      return;
    }

    console.log("[AUTH] Login attempt:", email);

    setLoading(true);
    setError("");

    try {
      const { data, error: loginError } =
        await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

      if (loginError) {
        console.error("[AUTH] Login failure:", loginError);

        if (loginError.message === "Email not confirmed") {
          setError("Please verify your email before logging in.");
        } else if (
          loginError.message === "Invalid login credentials"
        ) {
          setError("Invalid email or password.");
        } else {
          setError(loginError.message);
        }

        return;
      }

      console.log("[AUTH] Login success:", data.user?.id);

      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError) {
        console.error("[AUTH] Session error:", sessionError);
        setError(sessionError.message);
        return;
      }

      if (!session?.access_token) {
        setError("Login succeeded, but no session was created.");
        return;
      }

      console.log("[AUTH] Session created successfully.");

      router.push("/");
    } catch (err: any) {
      console.error("[AUTH] Network/login error:", err);

      setError(
        err?.message ||
          "Unable to connect to the authentication server."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4 font-sans">
      <div className="w-full max-w-md space-y-8 rounded-xl bg-card border border-border p-8 shadow-md">

        <div>
          <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-foreground">
            Welcome Back
          </h2>
        </div>

        <div className="mt-8 space-y-6">

          {error && (
            <div className="rounded-md bg-red-50 p-4 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="space-y-4 rounded-md shadow-sm">

            {/* Email */}
            <div>
              <Label htmlFor="email-address">
                Email address
              </Label>

              <Input
                id="email-address"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 bg-background text-foreground border-border placeholder:text-muted-foreground focus-visible:ring-primary"
                placeholder="Email address"
              />
            </div>

            {/* Password */}
            <div>
              <Label htmlFor="password">
                Password
              </Label>

              <div className="relative mt-1">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-background text-foreground border-border placeholder:text-muted-foreground focus-visible:ring-primary pr-10"
                  placeholder="Password"
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowPassword((prev) => !prev)
                  }
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label={
                    showPassword
                      ? "Hide password"
                      : "Show password"
                  }
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

          </div>

          <div>
            <button
              type="button"
              onClick={handleLogin}
              disabled={loading}
              className="w-full rounded-md bg-primary px-4 py-2 text-primary-foreground font-semibold cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </div>

          <div className="text-center text-sm mt-4">
            <span className="text-muted-foreground">
              Don't have an account?{" "}
            </span>

            <Link
              href="/register"
              className="font-semibold text-primary hover:text-primary/80"
            >
              Register here
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
}