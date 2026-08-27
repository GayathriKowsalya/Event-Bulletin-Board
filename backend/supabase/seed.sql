-- Insert initial seed data for development with Tamil Nadu local events

-- Coimbatore Events (Primary, within ~15km radius)
INSERT INTO public.events (title, description, category, event_date, event_end_date, location, latitude, longitude, status, image_url)
VALUES
  (
    'Coimbatore Tech Meetup',
    'Join local developers to talk about web technologies, share projects, and network. Beginners welcome.',
    'Technology',
    (now() + interval '5 days')::timestamptz,
    (now() + interval '5 days' + interval '3 hours')::timestamptz,
    'RS Puram',
    11.0076,
    76.9498,
    'published',
    null
  ),
  (
    'Startup Networking Mixer',
    'Meet founders and investors from the Coimbatore startup ecosystem.',
    'Business',
    (now() + interval '10 days')::timestamptz,
    (now() + interval '10 days' + interval '4 hours')::timestamptz,
    'Race Course',
    11.0016,
    76.9754,
    'published',
    null
  ),
  (
    'AI & Machine Learning Workshop',
    'Hands-on workshop on building LLM applications.',
    'Technology',
    (now() + interval '12 days')::timestamptz,
    (now() + interval '12 days' + interval '6 hours')::timestamptz,
    'Peelamedu',
    11.0263,
    77.0073,
    'published',
    null
  ),
  (
    'Coimbatore Food Festival',
    'Taste diverse cuisines from various neighborhood chefs and food stalls.',
    'Food',
    (now() + interval '14 days')::timestamptz,
    (now() + interval '14 days' + interval '8 hours')::timestamptz,
    'Codissia Grounds, Avinashi Road',
    11.0366,
    77.0374,
    'published',
    null
  ),
  (
    'ReactJS Bootcamp',
    'Learn ReactJS from scratch. Limited seats.',
    'Technology',
    (now() + interval '20 days')::timestamptz,
    (now() + interval '20 days' + interval '8 hours')::timestamptz,
    'Saravanampatti',
    11.0797,
    76.9997,
    'published',
    null
  ),
  (
    'Local Music Night',
    'Live performance by local independent artists. Entry is free.',
    'Music',
    (now() + interval '3 days')::timestamptz,
    (now() + interval '3 days' + interval '3 hours')::timestamptz,
    'Saibaba Colony',
    11.0270,
    76.9450,
    'published',
    null
  ),
  (
    'Marudhamalai Cycling Challenge',
    'Weekend cycling challenge. Bring your own bike.',
    'Sports',
    (now() + interval '6 days')::timestamptz,
    (now() + interval '6 days' + interval '4 hours')::timestamptz,
    'Vadavalli',
    11.0287,
    76.9030,
    'published',
    null
  ),
  (
    'Design Thinking Workshop',
    'Interactive session on product design and UX.',
    'Design',
    (now() + interval '18 days')::timestamptz,
    (now() + interval '18 days' + interval '5 hours')::timestamptz,
    'Gandhipuram',
    11.0183,
    76.9657,
    'published',
    null
  ),
  (
    'Weekend Cricket Tournament',
    'Friendly cricket match for all skill levels.',
    'Sports',
    (now() + interval '25 days')::timestamptz,
    (now() + interval '25 days' + interval '8 hours')::timestamptz,
    'Singanallur',
    10.9990,
    77.0270,
    'published',
    null
  ),
  (
    'Photography Walk',
    'Explore the streets of Ukkadam and capture local life.',
    'Arts',
    (now() + interval '8 days')::timestamptz,
    (now() + interval '8 days' + interval '3 hours')::timestamptz,
    'Ukkadam',
    10.9880,
    76.9600,
    'published',
    null
  ),
  (
    'College Hackathon 2026',
    '24-hour coding challenge for college students.',
    'Technology',
    (now() + interval '15 days')::timestamptz,
    (now() + interval '16 days' + interval '12 hours')::timestamptz,
    'Kuniyamuthur',
    10.9600,
    76.9530,
    'published',
    null
  ),
  (
    'Career Fair - IT/ITES',
    'Job fair featuring top companies in Coimbatore.',
    'Business',
    (now() + interval '30 days')::timestamptz,
    (now() + interval '30 days' + interval '8 hours')::timestamptz,
    'Kalapatti',
    11.0650,
    77.0290,
    'published',
    null
  ),
  (
    'Pending Event 1',
    'This event is waiting for admin approval.',
    'Community',
    (now() + interval '7 days')::timestamptz,
    (now() + interval '7 days' + interval '2 hours')::timestamptz,
    'Ganapathy',
    11.0400,
    76.9740,
    'pending',
    null
  ),
  (
    'Rejected Event 1',
    'This event was rejected.',
    'Business',
    (now() + interval '11 days')::timestamptz,
    (now() + interval '11 days' + interval '2 hours')::timestamptz,
    'RS Puram',
    11.0076,
    76.9498,
    'rejected',
    null
  ),
  (
    'Expired Tech Meetup',
    'This event has already ended.',
    'Technology',
    (now() - interval '5 days')::timestamptz,
    (now() - interval '5 days' + interval '3 hours')::timestamptz,
    'Race Course',
    11.0016,
    76.9754,
    'expired',
    null
  ),
  (
    'Ongoing Coding Session',
    'This event is happening right now.',
    'Technology',
    (now() - interval '1 hours')::timestamptz,
    (now() + interval '3 hours')::timestamptz,
    'Peelamedu',
    11.0263,
    77.0073,
    'published',
    null
  );

-- Trichy Events (Secondary)
INSERT INTO public.events (title, description, category, event_date, event_end_date, location, latitude, longitude, status, image_url)
VALUES
  (
    'Trichy Developers Conference',
    'Annual developers conference in Trichy.',
    'Technology',
    (now() + interval '14 days')::timestamptz,
    (now() + interval '14 days' + interval '8 hours')::timestamptz,
    'Thillai Nagar, Trichy',
    10.8273,
    78.6853,
    'published',
    null
  ),
  (
    'Cauvery River Cleanup',
    'Community volunteering event to clean the river banks.',
    'Community',
    (now() + interval '5 days')::timestamptz,
    (now() + interval '5 days' + interval '4 hours')::timestamptz,
    'Srirangam, Trichy',
    10.8600,
    78.6940,
    'published',
    null
  ),
  (
    'Local Heritage Walk',
    'Explore the historical monuments of Trichy.',
    'Arts',
    (now() + interval '10 days')::timestamptz,
    (now() + interval '10 days' + interval '3 hours')::timestamptz,
    'Rockfort, Trichy',
    10.8271,
    78.6974,
    'published',
    null
  ),
  (
    'Trichy SME Business Expo',
    'B2B expo for small and medium enterprises.',
    'Business',
    (now() + interval '22 days')::timestamptz,
    (now() + interval '22 days' + interval '8 hours')::timestamptz,
    'Cantonment, Trichy',
    10.8010,
    78.6790,
    'published',
    null
  ),
  (
    'College Cultural Fest',
    'Inter-college cultural competition.',
    'Music',
    (now() + interval '18 days')::timestamptz,
    (now() + interval '18 days' + interval '6 hours')::timestamptz,
    'Kattur, Trichy',
    10.8080,
    78.7300,
    'published',
    null
  );

-- Chennai Events (Secondary)
INSERT INTO public.events (title, description, category, event_date, event_end_date, location, latitude, longitude, status, image_url)
VALUES
  (
    'Chennai Cloud Summit',
    'Explore the latest in cloud computing and serverless architectures.',
    'Technology',
    (now() + interval '20 days')::timestamptz,
    (now() + interval '20 days' + interval '8 hours')::timestamptz,
    'Taramani, Chennai',
    12.9780,
    80.2450,
    'published',
    null
  ),
  (
    'Marina Beach Marathon',
    'Annual marathon along the beautiful Marina beach.',
    'Sports',
    (now() + interval '12 days')::timestamptz,
    (now() + interval '12 days' + interval '4 hours')::timestamptz,
    'Marina Beach, Chennai',
    13.0500,
    80.2820,
    'published',
    null
  ),
  (
    'SaaS Founders Mixer',
    'Networking for SaaS founders and product managers.',
    'Business',
    (now() + interval '9 days')::timestamptz,
    (now() + interval '9 days' + interval '3 hours')::timestamptz,
    'Guindy, Chennai',
    13.0067,
    80.2206,
    'published',
    null
  ),
  (
    'Carnatic Music Concert',
    'Evening of classical music.',
    'Music',
    (now() + interval '16 days')::timestamptz,
    (now() + interval '16 days' + interval '3 hours')::timestamptz,
    'Mylapore, Chennai',
    13.0334,
    80.2673,
    'published',
    null
  ),
  (
    'Book Fair 2026',
    'South India''s largest book fair.',
    'Arts',
    (now() + interval '25 days')::timestamptz,
    (now() + interval '30 days' + interval '10 hours')::timestamptz,
    'Nandanam, Chennai',
    13.0290,
    80.2430,
    'published',
    null
  );

-- Bangalore Events (Secondary)
INSERT INTO public.events (title, description, category, event_date, event_end_date, location, latitude, longitude, status, image_url)
VALUES
  (
    'Web3 & Crypto Meetup',
    'Discussions on the future of decentralized tech.',
    'Technology',
    (now() + interval '11 days')::timestamptz,
    (now() + interval '11 days' + interval '4 hours')::timestamptz,
    'Koramangala, Bangalore',
    12.9352,
    77.6245,
    'published',
    null
  ),
  (
    'Startup Pitch Night',
    'Watch early stage startups pitch to angel investors.',
    'Business',
    (now() + interval '8 days')::timestamptz,
    (now() + interval '8 days' + interval '3 hours')::timestamptz,
    'HSR Layout, Bangalore',
    12.9121,
    77.6446,
    'published',
    null
  ),
  (
    'Open Source Hackathon',
    'Contribute to open source projects and win prizes.',
    'Technology',
    (now() + interval '21 days')::timestamptz,
    (now() + interval '22 days' + interval '12 hours')::timestamptz,
    'Whitefield, Bangalore',
    12.9698,
    77.7499,
    'published',
    null
  ),
  (
    'Brewery Tour & Tasting',
    'Explore local craft breweries.',
    'Food',
    (now() + interval '13 days')::timestamptz,
    (now() + interval '13 days' + interval '4 hours')::timestamptz,
    'Indiranagar, Bangalore',
    12.9784,
    77.6408,
    'published',
    null
  ),
  (
    'Comedy Open Mic',
    'Local standup comedy acts.',
    'Arts',
    (now() + interval '6 days')::timestamptz,
    (now() + interval '6 days' + interval '2 hours')::timestamptz,
    'Jayanagar, Bangalore',
    12.9299,
    77.5824,
    'published',
    null
  );
