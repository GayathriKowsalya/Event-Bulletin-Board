import { supabase } from "@/components/AuthProvider";

export const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export interface Event {
  id: string;
  title: string;
  description: string;
  category: string;
  event_date: string;
  event_end_date: string;
  location: string;
  latitude?: number | null;
  longitude?: number | null;
  capacity: number;
  status: 'pending' | 'published' | 'rejected' | 'expired' | 'cancelled';
  image_url?: string | null;
  approved_by?: string | null;
  approved_at?: string | null;
  rejection_reason?: string | null;
  distance_km?: number;
  created_at: string;
  updated_at: string;
  created_by?: string | null;
  registration_count?: number;
}

export interface CreateEventInput {
  title: string;
  description: string;
  category: string;
  event_date: string;
  event_end_date: string;
  location: string;
  latitude?: number | null;
  longitude?: number | null;
  capacity: number;
  image_url?: string | null;
}

export interface EventRsvp {
  id: string;
  event_id: string;
  user_id: string;
  created_at: string;
  profile?: { id: string; full_name: string; avatar_url?: string };
}

export async function getAuthHeaders(): Promise<HeadersInit> {
  // First check if there is a demo admin token in localStorage
  if (typeof window !== 'undefined') {
    const demoAdminToken = localStorage.getItem('demo_admin_token');
    if (demoAdminToken) {
      return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${demoAdminToken}`
      };
    }
  }

  const { data: { session } } = await supabase.auth.getSession();
  if (session?.access_token) {
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`
    };
  }
  return {
    'Content-Type': 'application/json'
  };
}

export async function getEvents(category?: string, sortBy?: string, filter?: string): Promise<Event[]> {
  const url = new URL(`${API_URL}/api/events`);
  if (category && category !== 'All') {
    url.searchParams.append('category', category);
  }
  if (sortBy) url.searchParams.append('sortBy', sortBy);
  if (filter) url.searchParams.append('filter', filter);
  
  const headers = await getAuthHeaders();
  const res = await fetch(url.toString(), { cache: 'no-store', headers });
  if (!res.ok) throw new Error('Failed to fetch events');
  const data = await res.json();
  return data.events;
}

export async function searchEvents(query: string, sortBy?: string): Promise<Event[]> {
  const url = new URL(`${API_URL}/api/events/search`);
  url.searchParams.append('q', query);
  if (sortBy) url.searchParams.append('sortBy', sortBy);
  
  const headers = await getAuthHeaders();
  const res = await fetch(url.toString(), { cache: 'no-store', headers });
  if (!res.ok) throw new Error('Failed to search events');
  const data = await res.json();
  return data.events;
}

export async function createEvent(input: CreateEventInput): Promise<Event> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_URL}/api/events`, {
    method: 'POST',
    headers,
    body: JSON.stringify(input),
  });
  
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to create event');
  }
  
  const data = await res.json();
  return data.event;
}

export async function checkRegistrationStatus(eventId: string): Promise<{ registered: boolean, registration?: EventRsvp }> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_URL}/api/events/${eventId}/registration`, {
    headers,
    cache: 'no-store'
  });
  
  if (!res.ok) return { registered: false };
  const data = await res.json();
  return { registered: data.registered, registration: data.registration };
}

export async function registerForEvent(eventId: string): Promise<EventRsvp> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_URL}/api/events/${eventId}/register`, {
    method: 'POST',
    headers,
  });
  
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to register for event');
  }
  
  const data = await res.json();
  return data.registration;
}

export async function rsvpForEvent(eventId: string): Promise<{ registration?: EventRsvp, attending: boolean, rsvp_count: number }> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_URL}/api/events/${eventId}/rsvp`, {
    method: 'POST',
    headers,
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to RSVP for event');
  }

  return await res.json();
}

export async function unregisterForEvent(eventId: string): Promise<{ attending: boolean, rsvp_count: number }> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_URL}/api/events/${eventId}/rsvp`, {
    method: 'DELETE',
    headers,
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to unregister');
  }
  return await res.json();
}


export async function getEventById(id: string): Promise<Event> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_URL}/api/events/${id}`, { cache: 'no-store', headers });
  if (!res.ok) {
    if (res.status === 404) throw new Error('Event not found');
    throw new Error('Failed to fetch event');
  }
  const data = await res.json();
  return data.event;
}

export async function getAdminDashboard(): Promise<any> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_URL}/api/admin/dashboard`, {
    headers,
    cache: 'no-store'
  });
  if (!res.ok) throw new Error('Failed to fetch admin dashboard stats');
  const data = await res.json();
  return data.stats;
}

export async function getAdminEvents(): Promise<(Event & { registration_count: number })[]> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_URL}/api/admin/events`, {
    headers,
    cache: 'no-store'
  });
  if (!res.ok) throw new Error('Failed to fetch admin events');
  const data = await res.json();
  return data.events;
}

export async function getAdminUsers(): Promise<any[]> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_URL}/api/admin/users`, {
    headers,
    cache: 'no-store'
  });
  if (!res.ok) throw new Error('Failed to fetch admin users');
  const data = await res.json();
  return data.users;
}

export async function getAdminRegistrations(): Promise<any[]> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_URL}/api/admin/registrations`, {
    headers,
    cache: 'no-store'
  });
  if (!res.ok) throw new Error('Failed to fetch admin registrations');
  const data = await res.json();
  return data.registrations;
}

export async function uploadEventBanner(file: File): Promise<string> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) {
    throw new Error('You must be logged in to upload an image.');
  }

  // Validate file size (max 5MB)
  if (file.size > 5 * 1024 * 1024) {
    throw new Error('File size exceeds the 5MB limit.');
  }

  // Validate file type
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    throw new Error('Only JPG, PNG, and WEBP formats are supported.');
  }

  const fileExt = file.name.split('.').pop();
  const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
  const filePath = `${fileName}`;

  const { data, error } = await supabase.storage
    .from('event-banners')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false
    });

  if (error) {
    throw new Error(`Upload failed: ${error.message}`);
  }

  const { data: publicData } = supabase.storage
    .from('event-banners')
    .getPublicUrl(filePath);

  return publicData.publicUrl;
}

export async function getEventQuestions(eventId: string): Promise<any[]> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_URL}/api/events/${eventId}/questions`, {
    headers,
    cache: 'no-store'
  });
  if (!res.ok) throw new Error('Failed to fetch questions');
  const data = await res.json();
  return data.questions;
}

export async function postEventQuestion(eventId: string, question: string): Promise<any> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_URL}/api/events/${eventId}/questions`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ question }),
  });
  
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to post question');
  }
  
  const data = await res.json();
  return data.question;
}

export async function postEventAnswer(eventId: string, questionId: string, answer: string): Promise<any> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_URL}/api/events/${eventId}/questions/${questionId}/answers`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ answer }),
  });
  
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to post answer');
  }
  
  const data = await res.json();
  return data.answer;
}

export async function deleteEventQuestion(eventId: string, id: string): Promise<void> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_URL}/api/events/${eventId}/questions/${id}`, {
    method: 'DELETE',
    headers,
  });
  
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to delete question');
  }
}

export async function deleteEventAnswer(eventId: string, questionId: string, id: string): Promise<void> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_URL}/api/events/${eventId}/questions/${questionId}/answers/${id}`, {
    method: 'DELETE',
    headers,
  });
  
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to delete answer');
  }
}


export async function getEventRegistrations(eventId: string): Promise<(EventRsvp & { profile: any })[]> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_URL}/api/admin/events/${eventId}/registrations`, {
    headers,
    cache: 'no-store'
  });
  if (!res.ok) throw new Error('Failed to fetch registrations');
  const data = await res.json();
  return data.registrations;
}

export async function getPendingEvents(): Promise<any[]> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_URL}/api/admin/events/pending`, {
    headers,
    cache: 'no-store'
  });
  if (!res.ok) throw new Error('Failed to fetch pending events');
  const data = await res.json();
  return data.events;
}

export async function approveEvent(id: string): Promise<Event> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_URL}/api/admin/events/${id}/approve`, {
    method: 'POST',
    headers,
  });
  
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to approve event');
  }
  
  const data = await res.json();
  return data.event;
}

export async function rejectEvent(id: string, reason: string): Promise<Event> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_URL}/api/admin/events/${id}/reject`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ reason }),
  });
  
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to reject event');
  }
  
  const data = await res.json();
  return data.event;
}

export async function getUserMyEvents(): Promise<Event[]> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_URL}/api/events/my-events`, {
    headers,
    cache: 'no-store'
  });
  if (!res.ok) throw new Error('Failed to fetch user events');
  const data = await res.json();
  return data.events;
}

export async function updateEvent(id: string, input: Partial<CreateEventInput>): Promise<Event> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_URL}/api/events/${id}`, {
    method: 'PUT',
    headers,
    body: JSON.stringify(input),
  });
  
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to update event');
  }
  
  const data = await res.json();
  return data.event;
}

export async function deleteEvent(id: string): Promise<void> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_URL}/api/events/${id}`, {
    method: 'DELETE',
    headers,
  });
  
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to delete event');
  }
}

export async function adminLogin(username: string, password: string): Promise<{ success: boolean, message: string, user: { role: string }, token: string }> {
  const res = await fetch(`${API_URL}/api/auth/admin-login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ username, password }),
  });
  
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Invalid admin credentials.');
  }
  
  return res.json();
}

// --- Profile APIs ---

export async function getProfile(): Promise<any> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_URL}/api/profile`, { headers, cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to fetch profile');
  const data = await res.json();
  return data.profile;
}

export async function updateProfile(input: { name?: string, location?: string, avatar?: string }): Promise<any> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_URL}/api/profile`, {
    method: 'PUT',
    headers,
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to update profile');
  }
  const data = await res.json();
  return data.profile;
}

export async function getProfileEvents(): Promise<Event[]> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_URL}/api/profile/events`, { headers, cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to fetch user events');
  const data = await res.json();
  return data.events;
}

export async function getProfileRSVPs(): Promise<Event[]> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_URL}/api/profile/rsvps`, { headers, cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to fetch user RSVPs');
  const data = await res.json();
  return data.events;
}
