"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export function ShareEventButton({ id }: { id: string }) {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    const url = `${window.location.origin}/events/${id}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Check out this event!",
          url: url,
        });
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          copyToClipboard(url);
        }
      }
    } else {
      copyToClipboard(url);
    }
  };

  const copyToClipboard = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast("Event link copied!");
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy", err);
      toast.error("Failed to copy link");
    }
  };

  return (
    <Button variant="outline" size="sm" onClick={handleShare}>
      {copied ? "Copied!" : "Share"}
    </Button>
  );
}
