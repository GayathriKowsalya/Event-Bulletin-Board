"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Event, updateEvent, uploadEventBanner } from "@/lib/api";

const CATEGORIES = [
  "Music",
  "Food",
  "Sports",
  "Community",
  "Education",
  "Arts",
  "Yard Sale",
  "Other"
];

interface EditEventFormProps {
  event: Event;
  onSuccess: (updatedEvent: Event) => void;
  onCancel: () => void;
}

export function EditEventForm({ event, onSuccess, onCancel }: EditEventFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(event.image_url || null);

  const eventDateObj = new Date(event.event_date);
  const dateStr = eventDateObj.toISOString().split('T')[0];
  const timeStr = eventDateObj.toTimeString().split(' ')[0].substring(0, 5);

  const eventEndDateObj = event.event_end_date ? new Date(event.event_end_date) : new Date(eventDateObj.getTime() + 3 * 60 * 60 * 1000);
  const endDateStr = eventEndDateObj.toISOString().split('T')[0];
  const endTimeStr = eventEndDateObj.toTimeString().split(' ')[0].substring(0, 5);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const category = formData.get("category") as string;
    const date = formData.get("date") as string;
    const time = formData.get("time") as string;
    const endDate = formData.get("end_date") as string;
    const endTime = formData.get("end_time") as string;
    const location = formData.get("location") as string;
    const capacity = parseInt(formData.get("capacity") as string) || 0;
    
    const latitudeRaw = formData.get("latitude") as string;
    const longitudeRaw = formData.get("longitude") as string;
    
    const latitude = latitudeRaw ? parseFloat(latitudeRaw) : null;
    const longitude = longitudeRaw ? parseFloat(longitudeRaw) : null;

    if (!title.trim() || !description.trim() || !category.trim() || !date || !time || !endDate || !endTime || !location.trim() || capacity <= 0) {
      setError("All required fields must be filled and capacity must be positive.");
      setLoading(false);
      return;
    }

    const eventDate = new Date(`${date}T${time}`);
    const eventEndDate = new Date(`${endDate}T${endTime}`);
    
    if (eventDate.getTime() < Date.now()) {
      setError("Event start cannot be in the past.");
      setLoading(false);
      return;
    }
    
    if (eventEndDate.getTime() <= eventDate.getTime()) {
      setError("Event end time must be after start time.");
      setLoading(false);
      return;
    }

    try {
      let uploadedUrl = event.image_url;
      if (file) {
        uploadedUrl = await uploadEventBanner(file);
      }

      const updatedEvent = await updateEvent(event.id, {
        title: title.trim(),
        description: description.trim(),
        category,
        event_date: eventDate.toISOString(),
        event_end_date: eventEndDate.toISOString(),
        location: location.trim(),
        latitude,
        longitude,
        capacity,
        image_url: uploadedUrl
      });
      onSuccess(updatedEvent);
    } catch (err: any) {
      setError(err.message || "Failed to update event");
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setPreviewUrl(URL.createObjectURL(selectedFile));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 text-white">
      {error && <div className="p-3 text-sm text-red-500 bg-red-900/20 border border-red-900 rounded-md">{error}</div>}
      
      <div className="space-y-2">
        <Label htmlFor="title" className="text-gray-300">Event Title <span className="text-red-500">*</span></Label>
        <Input id="title" name="title" required defaultValue={event.title} className="bg-[#18181b] border-[#27272a] text-white" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="category" className="text-gray-300">Category <span className="text-red-500">*</span></Label>
          <Select name="category" required defaultValue={event.category}>
            <SelectTrigger className="bg-[#18181b] border-[#27272a] text-white">
              <SelectValue placeholder="Select a category" />
            </SelectTrigger>
            <SelectContent className="bg-[#18181b] border-[#27272a] text-white">
              {CATEGORIES.map(c => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="capacity" className="text-gray-300">Capacity <span className="text-red-500">*</span></Label>
          <Input id="capacity" name="capacity" type="number" min="1" required defaultValue={event.capacity} className="bg-[#18181b] border-[#27272a] text-white" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="date" className="text-gray-300">Start Date <span className="text-red-500">*</span></Label>
          <Input id="date" name="date" type="date" required defaultValue={dateStr} className="bg-[#18181b] border-[#27272a] text-white" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="time" className="text-gray-300">Start Time <span className="text-red-500">*</span></Label>
          <Input id="time" name="time" type="time" required defaultValue={timeStr} className="bg-[#18181b] border-[#27272a] text-white" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="end_date" className="text-gray-300">End Date <span className="text-red-500">*</span></Label>
          <Input id="end_date" name="end_date" type="date" required defaultValue={endDateStr} className="bg-[#18181b] border-[#27272a] text-white" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="end_time" className="text-gray-300">End Time <span className="text-red-500">*</span></Label>
          <Input id="end_time" name="end_time" type="time" required defaultValue={endTimeStr} className="bg-[#18181b] border-[#27272a] text-white" />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="location" className="text-gray-300">Location Name <span className="text-red-500">*</span></Label>
        <Input id="location" name="location" required defaultValue={event.location} className="bg-[#18181b] border-[#27272a] text-white" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="latitude" className="text-gray-300">Latitude (Optional)</Label>
          <Input id="latitude" name="latitude" type="number" step="any" defaultValue={event.latitude || ""} className="bg-[#18181b] border-[#27272a] text-white" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="longitude" className="text-gray-300">Longitude (Optional)</Label>
          <Input id="longitude" name="longitude" type="number" step="any" defaultValue={event.longitude || ""} className="bg-[#18181b] border-[#27272a] text-white" />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description" className="text-gray-300">Description <span className="text-red-500">*</span></Label>
        <Textarea id="description" name="description" required defaultValue={event.description} className="bg-[#18181b] border-[#27272a] text-white" rows={3} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="image" className="text-gray-300">Event Banner (Optional)</Label>
        <Input 
          id="image" 
          type="file" 
          accept="image/jpeg, image/png, image/webp"
          onChange={handleFileChange}
          className="bg-[#18181b] border-[#27272a] text-white cursor-pointer file:text-white"
        />
        {previewUrl && (
          <div className="mt-2">
            <img src={previewUrl} alt="Preview" className="w-full h-32 object-cover rounded-md border border-[#27272a]" />
          </div>
        )}
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel} disabled={loading} className="bg-transparent border-[#27272a] text-white hover:bg-[#27272a]">
          Cancel
        </Button>
        <Button type="submit" disabled={loading} className="bg-[#e50914] text-white hover:bg-[#b80710]">
          {loading ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </form>
  );
}
