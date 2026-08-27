"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useAuth } from "./AuthProvider";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface HeaderProps {
  onEventCreated?: () => void;
}

export function Header({ onEventCreated }: HeaderProps) {
  const [open, setOpen] = useState(false);
  const { user, profile, signOut } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await signOut();
    router.refresh();
  };

  return (
    <header className="border-b border-border bg-card shadow-sm sticky top-0 z-10">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/">
            <h1 className="text-2xl font-bold tracking-tight text-foreground cursor-pointer hover:opacity-80">
              <span className="text-primary">Event</span>Hub
            </h1>
          </Link>
          <nav className="hidden md:flex gap-4">
            <Link href="/">
              <Button variant="ghost" className="text-muted-foreground hover:text-foreground">Events</Button>
            </Link>
          </nav>
        </div>
        
        <div className="flex items-center gap-4">
          {user ? (
            <>

              <Link href="/events/create">
                <Button className="bg-red-600 hover:bg-red-700 text-white">Post Event</Button>
              </Link>
              
              <Link href="/profile">
                <Button variant="ghost">Profile</Button>
              </Link>
              <Button variant="outline" onClick={handleLogout}>Logout</Button>
            </>
          ) : (
            <>
              <Link href="/login">
                <Button variant="outline">Login</Button>
              </Link>
              <Link href="/register">
                <Button>Register</Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
