export interface Event {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  category: string;
  description: string;
  rsvpCount: number;
}

export const mockEvents: Event[] = [
  {
    id: '1',
    title: 'Downtown Summer Music Festival',
    date: '2026-09-15',
    time: '5:00 PM',
    location: 'Central Park',
    category: 'Music',
    description: 'Join us for an evening of live music, food trucks, and community fun. Local bands will be performing all night!',
    rsvpCount: 142,
  },
  {
    id: '2',
    title: 'Community Yard Sale',
    date: '2026-09-20',
    time: '8:00 AM',
    location: 'Pine Street Neighborhood',
    category: 'Yard Sale',
    description: 'Multi-family yard sale. Furniture, electronics, clothes, and toys. Don\'t miss out on these great bargains!',
    rsvpCount: 35,
  },
  {
    id: '3',
    title: 'Local Tech Meetup',
    date: '2026-09-25',
    time: '6:30 PM',
    location: 'Innovation Hub',
    category: 'Community',
    description: 'Monthly meetup for local developers and tech enthusiasts. We will be discussing new web technologies and networking.',
    rsvpCount: 89,
  },
  {
    id: '4',
    title: 'Sunday Morning Yoga',
    date: '2026-09-12',
    time: '9:00 AM',
    location: 'Riverside Community Center',
    category: 'Sports',
    description: 'Start your Sunday with a relaxing and energizing yoga session suitable for all levels. Please bring your own mat.',
    rsvpCount: 24,
  },
  {
    id: '5',
    title: 'Food Truck Fiesta',
    date: '2026-09-22',
    time: '11:00 AM',
    location: 'Downtown Square',
    category: 'Food',
    description: 'Sample dishes from over 20 local food trucks. Live entertainment and family-friendly activities available.',
    rsvpCount: 210,
  }
];

export const categories = [
  'All',
  'Technology',
  'Business',
  'Education',
  'Entertainment',
  'Sports',
  'Health',
  'Community',
  'Music',
  'Food',
  'Arts',
  'Yard Sale',
  'Other',
];
