"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface RejectEventDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onReject: (reason: string) => Promise<void>;
  isRejecting: boolean;
}

export function RejectEventDialog({ open, onOpenChange, onReject, isRejecting }: RejectEventDialogProps) {
  const [reason, setReason] = useState("");

  const handleReject = async () => {
    if (!reason.trim()) return;
    await onReject(reason);
    setReason("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] bg-[#18181b] border-[#27272a] text-white">
        <DialogHeader>
          <DialogTitle className="text-red-500">Reject Event</DialogTitle>
          <DialogDescription className="text-gray-400">
            Why are you rejecting this event? This will be shown to the user.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <Textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Rejection reason..."
            className="bg-[#09090b] border-[#27272a] text-white min-h-[100px]"
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} className="border-[#27272a] text-white hover:bg-[#27272a]" disabled={isRejecting}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleReject} disabled={!reason.trim() || isRejecting} className="bg-red-600 hover:bg-red-700">
            {isRejecting ? "Rejecting..." : "Reject Event"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
