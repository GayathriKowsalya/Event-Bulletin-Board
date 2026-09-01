"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  createEvent,
  uploadEventBanner,
  CreateEventInput,
} from "@/lib/api";
import { categories } from "@/lib/mockData";

interface CreateEventFormProps {
  onSuccess: (eventId: string) => void;
  onCancel: () => void;
  initialData?: CreateEventInput;
}

interface Coordinates {
  latitude: number;
  longitude: number;
}

/**
 * Automatically converts a location name into latitude/longitude.
 *
 * Examples:
 * RS Puram, Coimbatore
 * Gandhipuram, Coimbatore
 * Peelamedu, Coimbatore
 * Karpagam College, Coimbatore
 */
async function getCoordinates(location: string): Promise<Coordinates> {
  const searchLocation = `${location}, Coimbatore, Tamil Nadu, India`;

  const url =
    `https://nominatim.openstreetmap.org/search` +
    `?format=jsonv2` +
    `&limit=1` +
    `&q=${encodeURIComponent(searchLocation)}`;

  const controller = new AbortController();

  const timeout = setTimeout(() => {
    controller.abort();
  }, 10000);

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error("Unable to find the event location.");
    }

    const results = await response.json();

    if (!Array.isArray(results) || results.length === 0) {
      throw new Error(
        `Could not find "${location}". Please enter a more specific location.`
      );
    }

    const latitude = Number(results[0].lat);
    const longitude = Number(results[0].lon);

    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      throw new Error("Invalid coordinates returned for this location.");
    }

    return {
      latitude,
      longitude,
    };
  } finally {
    clearTimeout(timeout);
  }
}

export function CreateEventForm({
  onSuccess,
  onCancel,
  initialData,
}: CreateEventFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [findingLocation, setFindingLocation] = useState(false);

  const [formData, setFormData] = useState<CreateEventInput>(
    initialData || {
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
    }
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setError("");

    const trimmedTitle = formData.title.trim();
    const trimmedDesc = formData.description.trim();
    const trimmedLoc = formData.location.trim();
    const category = formData.category;

    if (
      !trimmedTitle ||
      !trimmedDesc ||
      !category ||
      !formData.event_date ||
      !formData.event_end_date ||
      !trimmedLoc ||
      !formData.capacity
    ) {
      setError(
        "Please fill in all required fields with valid information."
      );
      return;
    }

    if (formData.capacity <= 0) {
      setError("Capacity must be positive.");
      return;
    }

    const eventDate = new Date(formData.event_date);
    const eventEndDate = new Date(formData.event_end_date);

    if (
      Number.isNaN(eventDate.getTime()) ||
      Number.isNaN(eventEndDate.getTime())
    ) {
      setError("Please enter valid event dates.");
      return;
    }

    if (eventDate.getTime() < Date.now()) {
      setError("Event start date cannot be in the past.");
      return;
    }

    if (eventEndDate.getTime() <= eventDate.getTime()) {
      setError("Event end date must be after the start date.");
      return;
    }

    setLoading(true);
    setFindingLocation(true);

    try {
      /*
       * Automatically find coordinates from the location name.
       *
       * This means the user does NOT need to enter:
       * Latitude
       * Longitude
       *
       * Example:
       * "RS Puram, Coimbatore"
       * -> latitude + longitude automatically
       */
      let coordinates: Coordinates;

      try {
        coordinates = await getCoordinates(trimmedLoc);
      } catch (locationError: any) {
        setError(
          locationError?.message ||
            "Could not find this location. Please enter a more specific location."
        );
        return;
      } finally {
        setFindingLocation(false);
      }

      console.log("[EVENT] Location:", trimmedLoc);
      console.log("[EVENT] Coordinates:", coordinates);

      let uploadedUrl = null;

      if (file) {
        uploadedUrl = await uploadEventBanner(file);
      }

      const newEvent = await createEvent({
        title: trimmedTitle,
        description: trimmedDesc,
        category,
        location: trimmedLoc,

        // Automatically generated coordinates
        latitude: coordinates.latitude,
        longitude: coordinates.longitude,

        event_date: eventDate.toISOString(),
        event_end_date: eventEndDate.toISOString(),
        capacity: Number(formData.capacity),
        image_url: uploadedUrl,
      });

      console.log("[EVENT] Created successfully:", newEvent);

      onSuccess(newEvent.id);
    } catch (err: any) {
      console.error("[EVENT] Creation error:", err);

      setError(
        err?.message ||
          "Failed to create event. Please try again."
      );
    } finally {
      setFindingLocation(false);
      setLoading(false);
    }
  };

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];

      setFile(selectedFile);
      setPreviewUrl(URL.createObjectURL(selectedFile));
    }
  };

  const validCategories = categories.filter(
    (c) => c !== "All"
  );

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 text-white"
    >
      {error && (
        <div className="p-3 bg-red-900/20 text-red-500 text-sm rounded-md border border-red-900">
          {error}
        </div>
      )}

      {/* TITLE */}
      <div className="space-y-2">
        <Label
          htmlFor="title"
          className="text-gray-300"
        >
          Event Title{" "}
          <span className="text-red-500">*</span>
        </Label>

        <Input
          id="title"
          value={formData.title}
          onChange={(e) =>
            setFormData({
              ...formData,
              title: e.target.value,
            })
          }
          placeholder="E.g. Sunday Cricket Meetup"
          className="bg-[#18181b] border-[#27272a] text-white"
        />
      </div>

      {/* CATEGORY + CAPACITY */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label
            htmlFor="category"
            className="text-gray-300"
          >
            Category{" "}
            <span className="text-red-500">*</span>
          </Label>

          <Select
            value={formData.category}
            onValueChange={(val) =>
              setFormData({
                ...formData,
                category: val || "",
              })
            }
          >
            <SelectTrigger className="bg-[#18181b] border-[#27272a] text-white">
              <SelectValue placeholder="Select a category" />
            </SelectTrigger>

            <SelectContent className="bg-[#18181b] border-[#27272a] text-white">
              {validCategories.map((cat) => (
                <SelectItem
                  key={cat}
                  value={cat}
                >
                  {cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label
            htmlFor="capacity"
            className="text-gray-300"
          >
            Capacity{" "}
            <span className="text-red-500">*</span>
          </Label>

          <Input
            id="capacity"
            type="number"
            min="1"
            value={formData.capacity}
            onChange={(e) =>
              setFormData({
                ...formData,
                capacity:
                  parseInt(e.target.value) || 0,
              })
            }
            className="bg-[#18181b] border-[#27272a] text-white"
          />
        </div>
      </div>

      {/* DATE + TIME */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label
            htmlFor="event_date"
            className="text-gray-300"
          >
            Start Time{" "}
            <span className="text-red-500">*</span>
          </Label>

          <Input
            id="event_date"
            type="datetime-local"
            value={formData.event_date}
            onChange={(e) =>
              setFormData({
                ...formData,
                event_date: e.target.value,
              })
            }
            className="bg-[#18181b] border-[#27272a] text-white"
          />
        </div>

        <div className="space-y-2">
          <Label
            htmlFor="event_end_date"
            className="text-gray-300"
          >
            End Time{" "}
            <span className="text-red-500">*</span>
          </Label>

          <Input
            id="event_end_date"
            type="datetime-local"
            value={formData.event_end_date}
            onChange={(e) =>
              setFormData({
                ...formData,
                event_end_date: e.target.value,
              })
            }
            className="bg-[#18181b] border-[#27272a] text-white"
          />
        </div>
      </div>

      {/* LOCATION */}
      <div className="space-y-2">
        <Label
          htmlFor="location"
          className="text-gray-300"
        >
          Location Name{" "}
          <span className="text-red-500">*</span>
        </Label>

        <Input
          id="location"
          value={formData.location}
          onChange={(e) =>
            setFormData({
              ...formData,
              location: e.target.value,
            })
          }
          placeholder="E.g. RS Puram, Coimbatore"
          className="bg-[#18181b] border-[#27272a] text-white"
        />

        <p className="text-xs text-gray-500">
          📍 Enter the venue or neighbourhood. The map
          coordinates will be detected automatically.
        </p>
      </div>

      {/* AUTOMATIC MAP LOCATION INFO */}
      <div className="rounded-md border border-[#27272a] bg-[#18181b] p-3">
        <div className="flex items-center gap-2">
          <span className="text-green-500">●</span>

          <span className="text-sm text-gray-300">
            Map location is automatic
          </span>
        </div>

        <p className="text-xs text-gray-500 mt-1">
          No latitude or longitude needs to be entered manually.
        </p>
      </div>

      {/* DESCRIPTION */}
      <div className="space-y-2">
        <Label
          htmlFor="description"
          className="text-gray-300"
        >
          Description{" "}
          <span className="text-red-500">*</span>
        </Label>

        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) =>
            setFormData({
              ...formData,
              description: e.target.value,
            })
          }
          placeholder="Describe your event..."
          rows={3}
          className="bg-[#18181b] border-[#27272a] text-white"
        />
      </div>

      {/* EVENT BANNER */}
      <div className="space-y-2">
        <Label
          htmlFor="image"
          className="text-gray-300"
        >
          Event Banner (Optional)
        </Label>

        <Input
          id="image"
          type="file"
          accept="image/jpeg, image/png, image/webp"
          onChange={handleFileChange}
          className="bg-[#18181b] border-[#27272a] text-white cursor-pointer file:text-white"
        />

        {previewUrl && (
          <div className="mt-2">
            <img
              src={previewUrl}
              alt="Preview"
              className="w-full h-32 object-cover rounded-md border border-[#27272a]"
            />
          </div>
        )}
      </div>

      {/* BUTTONS */}
      <div className="flex justify-end gap-2 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={loading}
          className="bg-transparent border-[#27272a] text-white hover:bg-[#27272a]"
        >
          Cancel
        </Button>

        <Button
          type="submit"
          disabled={loading}
          className="bg-[#e50914] text-white hover:bg-[#b80710]"
        >
          {findingLocation
            ? "Finding location..."
            : loading
            ? "Posting..."
            : "Post Event"}
        </Button>
      </div>
    </form>
  );
}