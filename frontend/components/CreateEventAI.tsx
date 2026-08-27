"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles, Loader2, AlertTriangle } from "lucide-react";
import { CreateEventForm } from "./CreateEventForm";
import { CreateEventInput } from "@/lib/api";

interface CreateEventAIProps {
  onSuccess: (eventId: string) => void;
  onCancel: () => void;
}

export function CreateEventAI({ onSuccess, onCancel }: CreateEventAIProps) {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<"prompt" | "review">("prompt");
  const [extractedData, setExtractedData] = useState<CreateEventInput | null>(null);
  const [spamWarning, setSpamWarning] = useState<{ is_spam: boolean, risk_score: number, reasons: string[] } | null>(null);
  const [error, setError] = useState("");

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError("Please describe your event first.");
      return;
    }

    setLoading(true);
    setError("");
    try {
      // 1. Parse Event
      const parseRes = await fetch('/api/ai/events/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt })
      });
      
      if (!parseRes.ok) {
        throw new Error("Failed to parse event. Please try again.");
      }
      
      const parsed = await parseRes.json();
      
      // Default formatting
      const formattedData: CreateEventInput = {
        title: parsed.title || "",
        description: parsed.description || "",
        category: parsed.category || "Other",
        event_date: parsed.event_date ? `${parsed.event_date}T${parsed.start_time || "10:00"}` : "",
        event_end_date: parsed.event_date ? `${parsed.event_date}T${parsed.end_time || "12:00"}` : "",
        location: parsed.location || "",
        latitude: parsed.latitude || null,
        longitude: parsed.longitude || null,
        capacity: parsed.capacity || 100,
        image_url: null
      };

      setExtractedData(formattedData);

      // 2. Moderate Event
      const modRes = await fetch('/api/ai/events/moderate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, extractedData: parsed })
      });
      
      if (modRes.ok) {
        const moderation = await modRes.json();
        if (moderation.risk_score > 0.4) {
          setSpamWarning(moderation);
        }
      }

      setStep("review");
    } catch (err: any) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  if (step === "review" && extractedData) {
    return (
      <div className="space-y-4">
        <div className="bg-green-900/20 text-green-400 p-3 rounded border border-green-900/50 text-sm flex items-center gap-2">
          <Sparkles className="w-4 h-4" />
          Here's what AI understood. Please review and edit before publishing.
        </div>
        
        {spamWarning && (
          <div className="bg-orange-900/20 text-orange-400 p-3 rounded border border-orange-900/50 text-sm">
            <div className="flex items-center gap-2 font-bold mb-1">
              <AlertTriangle className="w-4 h-4" />
              This event may contain suspicious information.
            </div>
            <ul className="list-disc list-inside">
              {spamWarning.reasons.map((r, i) => <li key={i}>{r}</li>)}
            </ul>
            <p className="mt-2 text-xs">You can edit the details below to fix any issues.</p>
          </div>
        )}

        <CreateEventForm 
          onSuccess={onSuccess} 
          onCancel={onCancel} 
          initialData={extractedData} 
        />
      </div>
    );
  }

  return (
    <div className="space-y-4 text-white">
      {error && (
        <div className="p-3 bg-red-900/20 text-red-500 text-sm rounded-md border border-red-900">
          {error}
        </div>
      )}
      
      <div className="space-y-2">
        <p className="text-sm text-gray-400">
          Describe your event naturally, and AI will fill out the form for you.
        </p>
        <Textarea 
          placeholder="I am organizing a Python workshop at PSG College in Coimbatore on September 12 at 10 AM. It is for beginners and can host up to 100 people."
          className="bg-[#18181b] border-[#27272a] text-white min-h-[150px]"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
        />
      </div>

      <div className="flex justify-between items-center pt-4">
        <Button variant="ghost" className="text-gray-400 hover:text-white" onClick={() => {
           // Skip AI and go straight to manual form
           setExtractedData({
             title: "", description: "", category: "", event_date: "", event_end_date: "", location: "", capacity: 100, latitude: null, longitude: null, image_url: null
           });
           setStep("review");
        }}>
          Skip AI
        </Button>
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={onCancel} className="bg-transparent border-[#27272a] text-white hover:bg-[#27272a]">Cancel</Button>
          <Button onClick={handleGenerate} disabled={loading} className="bg-primary text-white hover:bg-primary/90 flex items-center gap-2">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            Generate Event
          </Button>
        </div>
      </div>
    </div>
  );
}
