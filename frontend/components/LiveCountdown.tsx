"use client";

import { useState, useEffect } from "react";

interface LiveCountdownProps {
  startDate: string;
  endDate: string;
}

export function LiveCountdown({ startDate, endDate }: LiveCountdownProps) {
  const [timeLeft, setTimeLeft] = useState<{ d: number; h: number; m: number; s: number } | null>(null);
  const [status, setStatus] = useState<"UPCOMING" | "ONGOING" | "ENDED">("UPCOMING");
  
  useEffect(() => {
    const calculateTime = () => {
      const now = new Date().getTime();
      const start = new Date(startDate).getTime();
      const end = new Date(endDate).getTime();
      
      if (now > end) {
        setStatus("ENDED");
        setTimeLeft(null);
        return;
      }
      
      if (now >= start && now <= end) {
        setStatus("ONGOING");
        setTimeLeft(null);
        return;
      }
      
      setStatus("UPCOMING");
      const diff = start - now;
      setTimeLeft({
        d: Math.floor(diff / (1000 * 60 * 60 * 24)),
        h: Math.floor((diff / (1000 * 60 * 60)) % 24),
        m: Math.floor((diff / 1000 / 60) % 60),
        s: Math.floor((diff / 1000) % 60),
      });
    };

    calculateTime();
    const timer = setInterval(calculateTime, 1000);
    return () => clearInterval(timer);
  }, [startDate, endDate]);

  if (status === "ENDED") {
    return <div className="text-red-500 font-bold bg-red-500/10 px-3 py-1 rounded w-max text-sm">Event Ended</div>;
  }
  
  if (status === "ONGOING") {
    return <div className="text-orange-500 font-bold bg-orange-500/10 px-3 py-1 rounded flex items-center gap-2 w-max text-sm">
      <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></span>
      LIVE NOW
    </div>;
  }
  
  if (!timeLeft) return null; // Hydration protection
  
  return (
    <div className="flex flex-col gap-1">
      <div className="text-sm text-gray-400 font-medium">Starts in:</div>
      <div className="flex gap-2 text-white font-mono bg-[#18181b] border border-[#27272a] px-3 py-1.5 rounded w-max">
        {timeLeft.d > 0 && <span>{timeLeft.d}d</span>}
        <span>{String(timeLeft.h).padStart(2, '0')}h</span>
        <span>{String(timeLeft.m).padStart(2, '0')}m</span>
        <span>{String(timeLeft.s).padStart(2, '0')}s</span>
      </div>
    </div>
  );
}
