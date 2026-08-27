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
  status: 'pending' | 'published' | 'rejected' | 'expired' | 'cancelled' | 'active';
  image_url?: string | null;
  created_by?: string;
  approved_by?: string | null;
  approved_at?: string | null;
  rejection_reason?: string | null;
  distance_km?: number;
  created_at: string;
  updated_at: string;
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
  image_url?: string | null;
  capacity: number;
}

export interface UpdateEventInput {
  title?: string;
  description?: string;
  category?: string;
  event_date?: string;
  event_end_date?: string;
  location?: string;
  latitude?: number | null;
  longitude?: number | null;
  image_url?: string | null;
  capacity?: number;
  status?: 'pending' | 'published' | 'rejected' | 'expired' | 'cancelled' | 'active';
  approved_by?: string | null;
  approved_at?: string | null;
  rejection_reason?: string | null;
}

export interface EventRegistration {
  id: string;
  event_id: string;
  user_id: string;
  registered_at: string;
  status: 'registered' | 'cancelled';
}
