"use client";

import { Users } from "lucide-react";

interface ExpectedCrowdProps {
  rsvpCount: number;
  capacity: number;
}

export function ExpectedCrowd({ rsvpCount, capacity }: ExpectedCrowdProps) {
  if (!capacity || capacity <= 0) return null;
  
  const ratio = rsvpCount / capacity;
  
  let label = "Low";
  let bars = 4;
  let colorClass = "text-green-500";
  let bgClass = "bg-green-500";
  
  if (ratio >= 0.8) {
    label = "High";
    bars = 16;
    colorClass = "text-red-500";
    bgClass = "bg-red-500";
  } else if (ratio >= 0.4) {
    label = "Medium";
    bars = 10;
    colorClass = "text-orange-500";
    bgClass = "bg-orange-500";
  }
  
  const totalBars = 20;
  
  return (
    <div className="bg-[#18181b] border border-[#27272a] p-4 rounded-lg">
      <div className="flex items-center gap-2 mb-3">
        <Users className="w-5 h-5 text-gray-400" />
        <h4 className="font-bold text-white">Expected Crowd</h4>
      </div>
      
      <div className="flex items-center gap-3 mb-2">
        <span className={`font-medium ${colorClass}`}>{label}</span>
        <div className="flex gap-[2px]">
          {Array.from({ length: totalBars }).map((_, i) => (
            <div 
              key={i} 
              className={`w-1.5 h-4 rounded-sm ${i < bars ? bgClass : "bg-[#27272a]"}`}
            />
          ))}
        </div>
      </div>
      
      <p className="text-xs text-gray-400 mt-2">
        Estimated based on current RSVPs and event activity.
      </p>
    </div>
  );
}
