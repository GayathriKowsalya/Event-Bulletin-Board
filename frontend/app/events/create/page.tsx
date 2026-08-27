"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { CreateEventAI } from "@/components/CreateEventAI";
import { Header } from "@/components/Header";
import { Card, CardContent } from "@/components/ui/card";
import { Sparkles } from "lucide-react";

export default function CreateEventPage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  const handleSuccess = (eventId: string) => {
    router.push(`/events/${eventId}`);
  };

  const handleCancel = () => {
    router.back();
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-black flex flex-col">
        <Header />
        <div className="flex-grow flex items-center justify-center">
          <div className="animate-pulse flex flex-col items-center">
            <div className="w-12 h-12 border-t-2 border-red-500 rounded-full animate-spin"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black flex flex-col text-gray-100">
      <Header />
      
      <main className="container mx-auto px-4 py-12 flex-grow max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight mb-2">Create a New Event</h1>
          <p className="text-gray-400">Share your event with the local community.</p>
        </div>

        <Card className="bg-gray-900 border-gray-800 shadow-xl overflow-hidden">
          <CardContent className="p-0">
            <div className="p-6 sm:p-8">
              <CreateEventAI 
                onSuccess={handleSuccess} 
                onCancel={handleCancel} 
              />
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
