"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { getProfile, updateProfile, getProfileEvents, getProfileRSVPs, Event } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MapPin, User as UserIcon, Calendar, CheckCircle2, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { EventCard } from "@/components/EventCard";
import { Header } from "@/components/Header";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { uploadEventBanner } from "@/lib/api";

export default function ProfilePage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  
  const [profile, setProfile] = useState<any>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [rsvps, setRsvps] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Edit state
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editLocation, setEditLocation] = useState("");
  const [saving, setSaving] = useState(false);
  
  // Avatar upload
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
      return;
    }

    if (user) {
      loadData();
    }
  }, [user, authLoading, router]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [pData, eData, rData] = await Promise.all([
        getProfile(),
        getProfileEvents(),
        getProfileRSVPs()
      ]);
      
      setProfile(pData);
      setEvents(eData);
      setRsvps(rData);
      
      setEditName(pData.name || pData.full_name || "");
      setEditLocation(pData.location || "");
      
    } catch (err: any) {
      toast.error(err.message || "Failed to load profile data");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const toastId = toast.loading("Saving...");
    try {
      const updated = await updateProfile({
        name: editName,
        location: editLocation
      });
      setProfile(updated);
      setIsEditing(false);
      toast.success("Saved successfully", { id: toastId });
    } catch (err: any) {
      toast.error(err.message || "Failed to save profile", { id: toastId });
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingAvatar(true);
    const toastId = toast.loading("Uploading avatar...");
    try {
      // Reusing the same storage bucket for simplicity
      const url = await uploadEventBanner(file);
      const updated = await updateProfile({ avatar: url });
      setProfile(updated);
      toast.success("Avatar updated", { id: toastId });
    } catch (err: any) {
      toast.error(err.message || "Failed to upload avatar", { id: toastId });
    } finally {
      setUploadingAvatar(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-black flex flex-col">
        <Header />
        <div className="flex-grow flex items-center justify-center">
          <div className="animate-pulse flex flex-col items-center">
            <div className="w-24 h-24 bg-red-900/20 rounded-full mb-4"></div>
            <div className="h-6 w-48 bg-gray-800 rounded mb-2"></div>
            <div className="h-4 w-32 bg-gray-800 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className="min-h-screen bg-black flex flex-col text-gray-100">
      <Header />
      
      <main className="container mx-auto px-4 py-8 flex-grow max-w-5xl">
        <div className="flex flex-col md:flex-row gap-8 items-start">
          
          {/* Sidebar / Profile Card */}
          <div className="w-full md:w-1/3">
            <Card className="bg-gray-900 border-gray-800">
              <CardContent className="pt-6 flex flex-col items-center text-center">
                <div className="relative group mb-4">
                  <Avatar className="w-24 h-24 border-4 border-gray-950">
                    <AvatarImage src={profile.avatar} alt={profile.name} className="object-cover" />
                    <AvatarFallback className="bg-red-950 text-red-500 text-2xl">
                      {profile.name?.charAt(0)?.toUpperCase() || profile.email?.charAt(0)?.toUpperCase() || <UserIcon />}
                    </AvatarFallback>
                  </Avatar>
                  <label className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-full opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
                    <ImageIcon className="w-6 h-6 text-white" />
                    <input type="file" className="hidden" accept="image/png, image/jpeg, image/webp" onChange={handleAvatarUpload} disabled={uploadingAvatar} />
                  </label>
                </div>
                
                <h2 className="text-xl font-bold">{profile.name || profile.full_name || 'Anonymous User'}</h2>
                <p className="text-gray-400 text-sm mb-4">{profile.email || user?.email}</p>
                
                {profile.location && (
                  <div className="flex items-center text-gray-400 text-sm mb-6">
                    <MapPin className="w-4 h-4 mr-1 text-red-500" />
                    {profile.location}
                  </div>
                )}
                
                <div className="w-full grid grid-cols-2 gap-4 border-t border-gray-800 pt-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-500">{events.length}</div>
                    <div className="text-xs text-gray-500 uppercase tracking-wider">Events Created</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-500">{rsvps.length}</div>
                    <div className="text-xs text-gray-500 uppercase tracking-wider">RSVPs</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Main Content Area */}
          <div className="w-full md:w-2/3">
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="bg-gray-900 border-gray-800 w-full justify-start rounded-xl p-1 mb-6">
                <TabsTrigger value="overview" className="rounded-lg data-[state=active]:bg-red-600 data-[state=active]:text-white">Overview</TabsTrigger>
                <TabsTrigger value="events" className="rounded-lg data-[state=active]:bg-red-600 data-[state=active]:text-white">My Events</TabsTrigger>
                <TabsTrigger value="rsvps" className="rounded-lg data-[state=active]:bg-red-600 data-[state=active]:text-white">My RSVPs</TabsTrigger>
              </TabsList>
              
              <TabsContent value="overview">
                <Card className="bg-gray-900 border-gray-800">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle>Personal Information</CardTitle>
                      <CardDescription className="text-gray-400">Update your profile details here.</CardDescription>
                    </div>
                    {!isEditing && (
                      <Button variant="outline" onClick={() => setIsEditing(true)} className="border-gray-700 hover:bg-gray-800">
                        Edit Profile
                      </Button>
                    )}
                  </CardHeader>
                  <CardContent>
                    {isEditing ? (
                      <form onSubmit={handleSaveProfile} className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="name">Display Name</Label>
                          <Input 
                            id="name" 
                            value={editName} 
                            onChange={(e) => setEditName(e.target.value)} 
                            className="bg-gray-950 border-gray-800 focus-visible:ring-red-500"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="email">Email</Label>
                          <Input 
                            id="email" 
                            value={profile.email || user?.email || ''} 
                            disabled 
                            className="bg-gray-950 border-gray-800 text-gray-500 cursor-not-allowed"
                            title="Email cannot be changed directly"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="location">Location</Label>
                          <Input 
                            id="location" 
                            value={editLocation} 
                            onChange={(e) => setEditLocation(e.target.value)} 
                            placeholder="e.g. Coimbatore, Tamil Nadu"
                            className="bg-gray-950 border-gray-800 focus-visible:ring-red-500"
                          />
                        </div>
                        <div className="flex gap-2 pt-4">
                          <Button type="submit" disabled={saving} className="bg-red-600 hover:bg-red-700 text-white">
                            {saving ? "Saving..." : "Save Changes"}
                          </Button>
                          <Button type="button" variant="ghost" onClick={() => setIsEditing(false)} disabled={saving}>
                            Cancel
                          </Button>
                        </div>
                      </form>
                    ) : (
                      <div className="space-y-6">
                        <div>
                          <h3 className="text-sm font-medium text-gray-500 mb-1">Display Name</h3>
                          <p>{profile.name || profile.full_name || 'Not set'}</p>
                        </div>
                        <div>
                          <h3 className="text-sm font-medium text-gray-500 mb-1">Email</h3>
                          <p>{profile.email || user?.email || 'Not set'}</p>
                        </div>
                        <div>
                          <h3 className="text-sm font-medium text-gray-500 mb-1">Location</h3>
                          <p>{profile.location || 'Not set'}</p>
                        </div>
                        <div>
                          <h3 className="text-sm font-medium text-gray-500 mb-1">Member Since</h3>
                          <p>{new Date(profile.created_at).toLocaleDateString()}</p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="events">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold">Events created by me</h2>
                  <Link href="/events/create">
                    <Button className="bg-red-600 hover:bg-red-700 text-white">Create an Event</Button>
                  </Link>
                </div>
                
                {events.length === 0 ? (
                  <Card className="bg-gray-900 border-gray-800 border-dashed">
                    <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                      <Calendar className="w-12 h-12 text-gray-600 mb-4" />
                      <p className="text-gray-400 mb-4">You haven't created any events yet.</p>
                      <Link href="/events/create">
                        <Button variant="outline" className="border-red-900 text-red-500 hover:bg-red-950">Create an Event</Button>
                      </Link>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 gap-6">
                    {events.map((event) => (
                      <EventCard key={event.id} event={event} />
                    ))}
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="rsvps">
                <div className="mb-6">
                  <h2 className="text-xl font-bold">Events I'm Going To</h2>
                </div>
                
                {rsvps.length === 0 ? (
                  <Card className="bg-gray-900 border-gray-800 border-dashed">
                    <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                      <CheckCircle2 className="w-12 h-12 text-gray-600 mb-4" />
                      <p className="text-gray-400 mb-4">You haven't registered for any events yet.</p>
                      <Link href="/">
                        <Button variant="outline" className="border-red-900 text-red-500 hover:bg-red-950">Explore Events</Button>
                      </Link>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 gap-6">
                    {rsvps.map((event) => (
                      <EventCard key={event.id} event={event} />
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
          
        </div>
      </main>
    </div>
  );
}
