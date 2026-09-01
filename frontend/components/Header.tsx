"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "./AuthProvider";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface HeaderProps {
  onEventCreated?: () => void;
}

export function Header({ onEventCreated }: HeaderProps) {
  const [open, setOpen] = useState(false);

  const { user, profile, signOut } = useAuth();

  const router = useRouter();

  const isAdmin = profile?.role === "admin";

  const handleLogout = async () => {
    try {
      await signOut();

      // Make sure user always goes to login
      router.replace("/login");
    } catch (error) {
      console.error("[AUTH] Logout error:", error);

      // Even if logout has an error,
      // send the user back to login.
      router.replace("/login");
    }
  };

  return (
    <header className="border-b border-border bg-card shadow-sm sticky top-0 z-10">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">

        {/* LEFT SIDE */}
        <div className="flex items-center gap-6">

          <Link href="/">
            <h1 className="text-2xl font-bold tracking-tight text-foreground cursor-pointer hover:opacity-80">
              <span className="text-primary">
                Event
              </span>
              Hub
            </h1>
          </Link>

          <nav className="hidden md:flex gap-4">
            <Link href="/">
              <Button
                variant="ghost"
                className="text-muted-foreground hover:text-foreground"
              >
                Events
              </Button>
            </Link>
          </nav>
        </div>

        {/* RIGHT SIDE */}
        <div className="flex items-center gap-4">

          {user ? (
            <>
              {/* ADMIN LABEL */}
              {isAdmin && (
                <div className="hidden sm:flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-amber-700">
                  ADMIN
                </div>
              )}

              {/* ADMIN DASHBOARD */}
              {isAdmin && (
                <Link href="/admin">
                  <Button
                    variant="ghost"
                    className="text-amber-700 hover:text-amber-800"
                  >
                    Admin Dashboard
                  </Button>
                </Link>
              )}

              {/* POST EVENT */}
              <Link href="/events/create">
                <Button className="bg-red-600 hover:bg-red-700 text-white">
                  Post Event
                </Button>
              </Link>

              {/* PROFILE */}
              <Link href="/profile">
                <Button variant="ghost">
                  Profile
                </Button>
              </Link>

              {/* LOGOUT */}
              <Button
                variant="outline"
                onClick={handleLogout}
              >
                Logout
              </Button>
            </>
          ) : (
            <>
              {/* LOGIN */}
              <Link href="/login">
                <Button variant="outline">
                  Login
                </Button>
              </Link>

              {/* REGISTER */}
              <Link href="/register">
                <Button>
                  Register
                </Button>
              </Link>
            </>
          )}

        </div>
      </div>
    </header>
  );
}