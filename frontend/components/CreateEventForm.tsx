"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createEvent, uploadEventBanner, CreateEventInput } from "@/lib/api";
import { categories } from "@/lib/mockData";

interface CreateEventFormProps {
  onSuccess: (eventId: string) => void;
  onCancel: () => void;
  initialData?: CreateEventInput;
}

export function CreateEventForm({ onSuccess, onCancel, initialData }: CreateEventFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<CreateEventInput>(initialData || {
    title: "",
    description: "",
    category: "",
    event_date: "",
    event_end_date: "",
    location: "",
    latitude: null,
    longitude: null,
    capacity: 100,
    image_url: null,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    const trimmedTitle = formData.title.trim();
    const trimmedDesc = formData.description.trim();
    const trimmedLoc = formData.location.trim();
    const category = formData.category;
    
    if (!trimmedTitle || !trimmedDesc || !category || !formData.event_date || !formData.event_end_date || !trimmedLoc || !formData.capacity) {
      setError("Please fill in all required fields with valid information");
      return;
    }
    
    if (formData.capacity <= 0) {
      setError("Capacity must be positive");
      return;
    }
    
    const eventDate = new Date(formData.event_date);
    const eventEndDate = new Date(formData.event_end_date);
    
    if (eventDate.getTime() < Date.now()) {
      setError("Event start date cannot be in the past");
      return;
    }
    
    if (eventEndDate.getTime() <= eventDate.getTime()) {
      setError("Event end date must be after the start date");
      return;
    }
    
    setLoading(true);
    try {
      let uploadedUrl = null;
      if (file) {
        uploadedUrl = await uploadEventBanner(file);
      }

      const newEvent = await createEvent({ 
        title: trimmedTitle,
        description: trimmedDesc,
        category,
        location: trimmedLoc,
        latitude: formData.latitude,
        longitude: formData.longitude,
        event_date: eventDate.toISOString(),
        event_end_date: eventEndDate.toISOString(),
        capacity: Number(formData.capacity),
        image_url: uploadedUrl
      });
      onSuccess(newEvent.id);
    } catch (err: any) {
      setError(err.message || "Failed to create event");
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

  const validCategories = categories.filter(c => c !== 'All');

  return (
    <form onSubmit={handleSubmit} className="space-y-4 text-white">
      {error && (
        <div className="p-3 bg-red-900/20 text-red-500 text-sm rounded-md border border-red-900">
          {error}
        </div>
      )}
      
      <div className="space-y-2">
        <Label htmlFor="title" className="text-gray-300">Event Title <span className="text-red-500">*</span></Label>
        <Input 
          id="title" 
          value={formData.title} 
          onChange={(e) => setFormData({...formData, title: e.target.value})} 
          placeholder="E.g. Sunday Cricket Meetup"
          className="bg-[#18181b] border-[#27272a] text-white"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="category" className="text-gray-300">Category <span className="text-red-500">*</span></Label>
          <Select 
            value={formData.category} 
            onValueChange={(val) => setFormData({...formData, category: val || ""})}
          >
            <SelectTrigger className="bg-[#18181b] border-[#27272a] text-white">
              <SelectValue placeholder="Select a category" />
            </SelectTrigger>
            <SelectContent className="bg-[#18181b] border-[#27272a] text-white">
              {validCategories.map(cat => (
                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="capacity" className="text-gray-300">Capacity <span className="text-red-500">*</span></Label>
          <Input 
            id="capacity" 
            type="number"
            min="1"
            value={formData.capacity} 
            onChange={(e) => setFormData({...formData, capacity: parseInt(e.target.value) || 0})}
            className="bg-[#18181b] border-[#27272a] text-white"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="event_date" className="text-gray-300">Start Time <span className="text-red-500">*</span></Label>
          <Input 
            id="event_date" 
            type="datetime-local" 
            value={formData.event_date} 
            onChange={(e) => setFormData({...formData, event_date: e.target.value})}
            className="bg-[#18181b] border-[#27272a] text-white"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="event_end_date" className="text-gray-300">End Time <span className="text-red-500">*</span></Label>
          <Input 
            id="event_end_date" 
            type="datetime-local" 
            value={formData.event_end_date} 
            onChange={(e) => setFormData({...formData, event_end_date: e.target.value})}
            className="bg-[#18181b] border-[#27272a] text-white"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="location" className="text-gray-300">Location Name <span className="text-red-500">*</span></Label>
        <Input 
          id="location" 
          value={formData.location} 
          onChange={(e) => setFormData({...formData, location: e.target.value})} 
          placeholder="E.g. Anna Nagar Ground"
          className="bg-[#18181b] border-[#27272a] text-white"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="latitude" className="text-gray-300">Latitude (Optional for map)</Label>
          <Input 
            id="latitude" 
            type="number"
            step="any"
            value={formData.latitude || ""} 
            onChange={(e) => setFormData({...formData, latitude: parseFloat(e.target.value) || null})}
            placeholder="E.g. 10.7905"
            className="bg-[#18181b] border-[#27272a] text-white"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="longitude" className="text-gray-300">Longitude (Optional for map)</Label>
          <Input 
            id="longitude" 
            type="number"
            step="any"
            value={formData.longitude || ""} 
            onChange={(e) => setFormData({...formData, longitude: parseFloat(e.target.value) || null})}
            placeholder="E.g. 78.7047"
            className="bg-[#18181b] border-[#27272a] text-white"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description" className="text-gray-300">Description <span className="text-red-500">*</span></Label>
        <Textarea 
          id="description" 
          value={formData.description} 
          onChange={(e) => setFormData({...formData, description: e.target.value})} 
          placeholder="Describe your event..." 
          rows={3}
          className="bg-[#18181b] border-[#27272a] text-white"
        />
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
        <Button type="button" variant="outline" onClick={onCancel} className="bg-transparent border-[#27272a] text-white hover:bg-[#27272a]">Cancel</Button>
        <Button type="submit" disabled={loading} className="bg-[#e50914] text-white hover:bg-[#b80710]">
          {loading ? "Posting..." : "Post Event"}
        </Button>
      </div>
    </form>
  );
}
