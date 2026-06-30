/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import { Issue, Comment, UpdateLog, IssueCategory, IssueStatus, IssuePriority, AIAnalysis, PredictiveInsights, UserProfile, WorkOrder } from './src/types';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

// Initialize Gemini Client safely
let ai: GoogleGenAI | null = null;
const apiKey = process.env.GEMINI_API_KEY;

if (apiKey) {
  try {
    ai = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
    console.log('Gemini API client initialized successfully.');
  } catch (error) {
    console.error('Failed to initialize Gemini API Client:', error);
  }
} else {
  console.warn('GEMINI_API_KEY environment variable is missing. Running in mock-AI fallback mode.');
}

// In-memory Database for Demonstration & Cloud-like persistence during container lifetime
let issues: Issue[] = [
  {
    id: 'issue-1',
    title: 'Crater-sized Pothole on 4th Avenue Main Crossing',
    category: 'pothole',
    description: 'A deep pothole has opened up right near the pedestrian crosswalk on 4th Avenue. It is forcing vehicles to swerve into the opposite lane to avoid damage. High risk for night drivers and cyclists.',
    address: '240 Main St, Downtown',
    latitude: 42,
    longitude: 35,
    status: 'in_progress',
    priority: 'high',
    reporterName: 'Carlos Mendoza',
    reporterEmail: 'carlos.m@example.com',
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
    upvotes: 28,
    votedEmails: ['sourish25maity@gmail.com', 'user1@example.com', 'user2@example.com'],
    verifiedCount: 14,
    verifiedEmails: ['user3@example.com', 'user4@example.com'],
    duplicatedCount: 0,
    tags: ['Traffic Hazard', 'Pedestrian Safety', 'Road Damage'],
    updates: [
      {
        id: 'log-1-1',
        status: 'reported',
        description: 'Issue flagged by Carlos Mendoza. Initial priority recommendation set to High.',
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        author: 'Carlos Mendoza'
      },
      {
        id: 'log-1-2',
        status: 'under_review',
        description: 'Municipal Road Maintenance division has reviewed the report. Work order issued.',
        createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
        author: 'City Inspector (AI Verified)'
      },
      {
        id: 'log-1-3',
        status: 'in_progress',
        description: 'Maintenance crew scheduled for patching. Safety barriers have been placed.',
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        author: 'Roads Dept Dispatch'
      }
    ],
    comments: [
      {
        id: 'c-1-1',
        author: 'Sarah Jenkins',
        email: 'sarah.j@example.com',
        content: 'Almost popped my tire on this yesterday! Glad to see it is scheduled for repair.',
        createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
        upvotes: 5
      },
      {
        id: 'c-1-2',
        author: 'Mayor’s Office Liaison',
        email: 'liaison@citygov.org',
        content: 'Our road repair crew is responding to pothole filings in the Downtown sector this week. Patching is set to finish by Tuesday.',
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        isMunicipalOfficial: true,
        upvotes: 11
      }
    ],
    aiAnalysis: {
      category: 'pothole',
      confidence: 0.98,
      priority: 'high',
      explanation: 'Report details a large pothole in a high-traffic lane near a pedestrian crossing. Visual elements and text both indicate significant hazard of damage or pedestrian accidents.',
      tags: ['Traffic Hazard', 'Pedestrian Safety', 'Road Damage'],
      suggestedAction: 'Deploy visual safety barriers immediately; schedule rapid asphalt patch crew.',
      estimatedResolutionDays: 4
    }
  },
  {
    id: 'issue-2',
    title: 'Severe Water Leakage from Broken Main Pipe',
    category: 'water_leak',
    description: 'Water is gushing out from under the pavement on Oakridge Blvd, flooding the sidewalk and creating a large pool on the roadway. Thousands of gallons of clean drinking water are being wasted.',
    address: '812 Oakridge Blvd, Oakridge',
    latitude: 65,
    longitude: 78,
    status: 'under_review',
    priority: 'critical',
    reporterName: 'Aisha Rahman',
    reporterEmail: 'aisha.r@example.com',
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
    upvotes: 45,
    votedEmails: ['user5@example.com', 'user6@example.com'],
    verifiedCount: 22,
    verifiedEmails: ['user7@example.com'],
    duplicatedCount: 1,
    tags: ['Water Wastage', 'Flooding Hazard', 'Infrastructure Failure'],
    updates: [
      {
        id: 'log-2-1',
        status: 'reported',
        description: 'Water line rupture reported near Oakridge park. Water gushing at high pressure.',
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        author: 'Aisha Rahman'
      },
      {
        id: 'log-2-2',
        status: 'under_review',
        description: 'Water & Utilities engineers dispatched to locate and turn off the pressure valves.',
        createdAt: new Date(Date.now() - 18 * 60 * 60 * 1000).toISOString(),
        author: 'Water Utility Board'
      }
    ],
    comments: [
      {
        id: 'c-2-1',
        author: 'Daniel Craig',
        email: 'daniel@example.com',
        content: 'I verified this, the sidewalk is completely impassable. High volume of water.',
        createdAt: new Date(Date.now() - 20 * 60 * 60 * 1000).toISOString(),
        upvotes: 8
      }
    ],
    aiAnalysis: {
      category: 'water_leak',
      confidence: 0.99,
      priority: 'critical',
      explanation: 'Clean water is escaping at high velocity from a main road pipe. Threat of pavement erosion, flooding of local properties, and major waste of public resource.',
      tags: ['Water Wastage', 'Flooding Hazard', 'Infrastructure Failure'],
      suggestedAction: 'Shut off primary sector gate valves; execute trench-and-repair for damaged municipal conduit.',
      estimatedResolutionDays: 2
    }
  },
  {
    id: 'issue-3',
    title: 'Three Damaged Streetlights Leaving Street Pitch Black',
    category: 'broken_streetlight',
    description: 'Three consecutive streetlights on Elm Street are completely dead. At night, the street is absolutely pitch black, making people feel unsafe walking home from the transit station.',
    address: '104 Elm St, Pinecrest',
    latitude: 25,
    longitude: 80,
    status: 'scheduled',
    priority: 'medium',
    reporterName: 'John Doe',
    reporterEmail: 'john@example.com',
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(), // 10 days ago
    upvotes: 18,
    votedEmails: ['user10@example.com'],
    verifiedCount: 9,
    verifiedEmails: [],
    duplicatedCount: 0,
    tags: ['Public Safety', 'Dark Zone', 'Electrical issue'],
    updates: [
      {
        id: 'log-3-1',
        status: 'reported',
        description: 'Dark sector reported. Multiple lamps disabled.',
        createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
        author: 'John Doe'
      },
      {
        id: 'log-3-2',
        status: 'under_review',
        description: 'Utility division confirmed circuit failure. Street light bulbs and ballasts ordered.',
        createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
        author: 'Public Works Grid'
      },
      {
        id: 'log-3-3',
        status: 'scheduled',
        description: 'Repair truck scheduled for electrical replacement on Elm Street.',
        createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
        author: 'Grid Maintenance'
      }
    ],
    comments: [
      {
        id: 'c-3-1',
        author: 'Elena Rostova',
        email: 'elena@example.com',
        content: 'I live nearby and it feels very eerie walking here after 8 PM. Please fix this soon.',
        createdAt: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000).toISOString(),
        upvotes: 4
      }
    ],
    aiAnalysis: {
      category: 'broken_streetlight',
      confidence: 0.95,
      priority: 'medium',
      explanation: 'Multiple consecutive dead streetlights on residential corridor near a transit stop. Heightened safety and security risk for pedestrians, though not a blocking physical hazard.',
      tags: ['Public Safety', 'Dark Zone', 'Electrical issue'],
      suggestedAction: 'Conduct local junction box test; swap inactive high-pressure sodium bulbs with modern energy-efficient LEDs.',
      estimatedResolutionDays: 14
    }
  },
  {
    id: 'issue-4',
    title: 'Illegal Waste Dumping and Overflowing Bin',
    category: 'waste_management',
    description: 'Someone has dumped a massive stack of construction debris, old furniture, and plastic trash bags next to the community recycling center. It is spilling onto the street and drawing rats.',
    address: '42 Pinecrest Lane, Pinecrest',
    latitude: 18,
    longitude: 20,
    status: 'resolved',
    priority: 'medium',
    reporterName: 'Marcus Cole',
    reporterEmail: 'marcus.c@example.com',
    createdAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(), // 12 days ago
    upvotes: 31,
    votedEmails: ['user11@example.com'],
    verifiedCount: 15,
    verifiedEmails: [],
    duplicatedCount: 0,
    tags: ['Sanitation', 'Pest Control', 'Illegal Dumping'],
    updates: [
      {
        id: 'log-4-1',
        status: 'reported',
        description: 'Illegal pile of construction and household rubbish reported.',
        createdAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
        author: 'Marcus Cole'
      },
      {
        id: 'log-4-2',
        status: 'under_review',
        description: 'Waste management division assigned to execute immediate pickup and cleanup.',
        createdAt: new Date(Date.now() - 11 * 24 * 60 * 60 * 1000).toISOString(),
        author: 'Sanitation Dept Admin'
      },
      {
        id: 'log-4-3',
        status: 'in_progress',
        description: 'Sanitation heavy loader dispatched to site. Loading debris.',
        createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
        author: 'Field Ops Crew 3'
      },
      {
        id: 'log-4-4',
        status: 'resolved',
        description: 'Trash has been cleared. The area was washed and sanitised. Educational flyer posted to remind neighbors of recycling guidelines.',
        createdAt: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000).toISOString(),
        author: 'Sanitation Dept Inspector'
      }
    ],
    comments: [
      {
        id: 'c-4-1',
        author: 'Ariel Vance',
        email: 'ariel.v@example.com',
        content: 'Rats were literally crawling there this morning. Thank you sanitation team for the fast cleanup!',
        createdAt: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000).toISOString(),
        upvotes: 6
      }
    ],
    aiAnalysis: {
      category: 'waste_management',
      confidence: 0.96,
      priority: 'medium',
      explanation: 'Bulk dumping on public curb. Sanitation and aesthetic concern with moderate escalation score due to vermin activity.',
      tags: ['Sanitation', 'Pest Control', 'Illegal Dumping'],
      suggestedAction: 'Dispatch heavy trash loader; inspect area for cameras to trace license plates of offending dumpers.',
      estimatedResolutionDays: 3
    }
  },
  {
    id: 'issue-5',
    title: 'Damaged Pedestrian Sidewalk and Broken Handrail',
    category: 'public_infrastructure',
    description: 'The wooden handrail along the Elm Street walking bridge is completely rotted and has collapsed. Additionally, two pavement blocks are heavily displaced from tree roots, presenting a severe tripping hazard.',
    address: 'Elm Bridge Walkway, Riverside',
    latitude: 85,
    longitude: 25,
    status: 'reported',
    priority: 'high',
    reporterName: 'Li Wei',
    reporterEmail: 'li.wei@example.com',
    createdAt: new Date(Date.now() - 2 * 12 * 60 * 60 * 1000).toISOString(), // 1 day ago
    upvotes: 12,
    votedEmails: [],
    verifiedCount: 5,
    verifiedEmails: [],
    duplicatedCount: 0,
    tags: ['Pedestrian Tripping', 'Structural Decay', 'Bridge Maintenance'],
    updates: [
      {
        id: 'log-5-1',
        status: 'reported',
        description: 'Structural wood decay and footpath displacement reported on footbridge.',
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        author: 'Li Wei'
      }
    ],
    comments: [],
    aiAnalysis: {
      category: 'public_infrastructure',
      confidence: 0.94,
      priority: 'high',
      explanation: 'Collapse of pedestrian safety fall protection (handrail) on a raised footpath bridge, alongside concrete level offsets. Tripping hazard over a drop represents high liability.',
      tags: ['Pedestrian Tripping', 'Structural Decay', 'Bridge Maintenance'],
      suggestedAction: 'Erect hazard warning tape; dispatch carpenter for temporary handrail fix and masonry crew for slab leveling.',
      estimatedResolutionDays: 7
    }
  }
];

// Profile storage - tracks gamification, points, level, streak
let userProfiles: { [email: string]: UserProfile } = {
  'sourish25maity@gmail.com': {
    email: 'sourish25maity@gmail.com',
    name: 'Sourish Maity',
    xp: 650,
    level: 3,
    badges: ['eagle-eye', 'verified-citizen', 'streak-3'],
    reportsCount: 4,
    votesCount: 15,
    streak: 3
  },
  'elena_kovalev@citygrid.org': {
    email: 'elena_kovalev@citygrid.org',
    name: 'Elena Kovalev',
    xp: 1120,
    level: 4,
    badges: ['civic-pillar', 'eagle-eye', 'verified-citizen'],
    reportsCount: 8,
    votesCount: 24,
    streak: 5
  },
  'marcus_park@example.com': {
    email: 'marcus_park@example.com',
    name: 'Marcus Park',
    xp: 820,
    level: 3,
    badges: ['first-report', 'voter-badge'],
    reportsCount: 3,
    votesCount: 12,
    streak: 2
  },
  'clara_delgado@transit-net.com': {
    email: 'clara_delgado@transit-net.com',
    name: 'Clara Delgado',
    xp: 450,
    level: 2,
    badges: ['newbie', 'first-report'],
    reportsCount: 1,
    votesCount: 5,
    streak: 1
  }
};

const getProfile = (email: string, name?: string): UserProfile => {
  const normalizedEmail = email.toLowerCase().trim();
  if (!userProfiles[normalizedEmail]) {
    userProfiles[normalizedEmail] = {
      email: normalizedEmail,
      name: name || email.split('@')[0],
      xp: 100, // starting XP
      level: 1,
      badges: ['newbie'],
      reportsCount: 0,
      votesCount: 0,
      streak: 1
    };
  }
  return userProfiles[normalizedEmail];
};

const awardXP = (email: string, amount: number, actionType: 'report' | 'vote' | 'verify' | 'comment'): { profile: UserProfile, newBadges: string[] } => {
  const profile = getProfile(email);
  profile.xp += amount;
  
  // Recalculate level (level up every 300 XP)
  const oldLevel = profile.level;
  profile.level = Math.floor(profile.xp / 300) + 1;
  
  const newBadges: string[] = [];
  
  // Gamification badges triggers
  if (actionType === 'report') {
    profile.reportsCount += 1;
    if (profile.reportsCount === 1 && !profile.badges.includes('first-report')) {
      profile.badges.push('first-report');
      newBadges.push('first-report');
    }
    if (profile.reportsCount === 5 && !profile.badges.includes('civic-pillar')) {
      profile.badges.push('civic-pillar');
      newBadges.push('civic-pillar');
    }
  } else if (actionType === 'vote' || actionType === 'verify') {
    profile.votesCount += 1;
    if (profile.votesCount === 1 && !profile.badges.includes('voter-badge')) {
      profile.badges.push('voter-badge');
      newBadges.push('voter-badge');
    }
    if (profile.votesCount === 10 && !profile.badges.includes('verified-citizen')) {
      profile.badges.push('verified-citizen');
      newBadges.push('verified-citizen');
    }
  }

  if (profile.level > oldLevel && !profile.badges.includes(`level-${profile.level}`)) {
    profile.badges.push(`level-${profile.level}`);
    newBadges.push(`level-${profile.level}`);
  }

  return { profile, newBadges };
};

// --- API ROUTES ---

// 1. Get all issues
app.get('/api/issues', (req, res) => {
  res.json(issues);
});

// Seeding endpoint to generate realistic local issues for a selected city
app.post('/api/issues/seed', async (req, res) => {
  const { lat, lng, city } = req.body;
  
  const latNum = Number(lat);
  const lngNum = Number(lng);

  if (isNaN(latNum) || isNaN(lngNum) || !isFinite(latNum) || !isFinite(lngNum) || !city) {
    return res.status(400).json({ error: 'lat and lng must be valid finite numbers, and city is required' });
  }

  const seededIssues: Issue[] = [];
  const templates = [
    {
      category: 'pothole' as IssueCategory,
      title: 'Pothole on Road crossing',
      desc: 'A dangerous, deep pothole has formed near the busy crosswalk. It forces vehicles to swerve abruptly to avoid damage. Active risk for cyclists.',
      priority: 'high' as IssuePriority,
      offsetLat: 0.0015,
      offsetLng: -0.0018,
      tags: ['Road Damage', 'Traffic Hazard', 'Pavement']
    },
    {
      category: 'water_leak' as IssueCategory,
      title: 'Severe Water Pipe Leak',
      desc: 'Water is bubbling up from beneath the sidewalk, flooding the walking path and creating large puddles. Significant potable water wastage.',
      priority: 'critical' as IssuePriority,
      offsetLat: -0.0022,
      offsetLng: 0.0025,
      tags: ['Water Wastage', 'Flooding Hazard', 'Infrastructure']
    },
    {
      category: 'broken_streetlight' as IssueCategory,
      title: 'Faulty Streetlamps leaving street dark',
      desc: 'Consecutive streetlights are completely out. The street is pitch black at night, making residents feel highly vulnerable walking from transit.',
      priority: 'medium' as IssuePriority,
      offsetLat: 0.0011,
      offsetLng: 0.0031,
      tags: ['Dark Zone', 'Electrical issue', 'Public Safety']
    },
    {
      category: 'waste_management' as IssueCategory,
      title: 'Illegal Commercial Waste Dumping',
      desc: 'Large pile of discarded construction rubble, wood boards, and plastic trash bags left on the roadside. Blockages and attracting rodents.',
      priority: 'medium' as IssuePriority,
      offsetLat: -0.0028,
      offsetLng: -0.0021,
      tags: ['Sanitation', 'Litter', 'Illegal Dumping']
    },
    {
      category: 'public_infrastructure' as IssueCategory,
      title: 'Displaced Footpath Blocks',
      desc: 'Sidewalk concrete tiles are heavily cracked and tilted by overgrown roots. Highly hazardous for elderly pedestrians and strollers.',
      priority: 'high' as IssuePriority,
      offsetLat: 0.0019,
      offsetLng: -0.0026,
      tags: ['Pedestrian Safety', 'Public Assets', 'Sidewalk']
    }
  ];

  for (let idx = 0; idx < templates.length; idx++) {
    const t = templates[idx];
    const targetLat = latNum + t.offsetLat;
    const targetLng = lngNum + t.offsetLng;

    let displayAddress = `Near center, ${city}`;

    // Real Nominatim reverse geocoding to find real street name inside the node server!
    try {
      const geoUrl = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${targetLat}&lon=${targetLng}&zoom=18`;
      const response = await fetch(geoUrl, {
        headers: {
          'User-Agent': 'Cleanity-CivicPortal/1.0 (sourish25maity@gmail.com)'
        }
      });
      const data = await response.json();
      if (data && data.display_name) {
        // Truncate display_name to be cleaner
        const parts = data.display_name.split(',');
        displayAddress = parts.slice(0, 3).join(',').trim();
      }
    } catch (e) {
      console.warn(`Failed to reverse geocode coordinate index ${idx} in city ${city}:`, e);
    }

    // Format specific title/description with geocoded info if possible
    const streetLabel = displayAddress.split(',')[0] || 'Main St';
    const finalTitle = t.category === 'pothole' ? `Deep Pothole near ${streetLabel}` :
                       t.category === 'water_leak' ? `Active Water Main Leakage on ${streetLabel}` :
                       t.category === 'broken_streetlight' ? `Broken Streetlamps leaving ${streetLabel} dark` :
                       t.category === 'waste_management' ? `Illegal Dump Site near ${streetLabel}` :
                       `Uneven Sidewalk Blocks on ${streetLabel}`;

    const newIssue: Issue = {
      id: `seeded-${city.toLowerCase().replace(/\s+/g, '-')}-${idx}-${Date.now()}`,
      title: finalTitle,
      category: t.category,
      description: t.desc,
      latitude: targetLat,
      longitude: targetLng,
      address: displayAddress,
      status: idx === 1 ? 'under_review' : idx === 3 ? 'resolved' : 'reported',
      priority: t.priority,
      reporterName: 'Civic Bot',
      reporterEmail: 'bot@citygov.org',
      createdAt: new Date(Date.now() - idx * 2 * 24 * 60 * 60 * 1000).toISOString(),
      upvotes: Math.floor(Math.random() * 25) + 5,
      votedEmails: [],
      verifiedCount: Math.floor(Math.random() * 10) + 1,
      verifiedEmails: [],
      duplicatedCount: 0,
      tags: t.tags,
      updates: [
        {
          id: `log-seed-${idx}-1`,
          status: 'reported',
          description: `Issue flagged by automatic spatial monitor. Coordinates registered.`,
          createdAt: new Date(Date.now() - idx * 2 * 24 * 60 * 60 * 1000).toISOString(),
          author: 'Civic Bot'
        }
      ],
      comments: [
        {
          id: `c-seed-${idx}-1`,
          author: 'Alex Carter',
          email: 'alex@example.com',
          content: `I passed by this yesterday. This is definitely a major safety hazard for families walking here!`,
          createdAt: new Date(Date.now() - idx * 1.5 * 24 * 60 * 60 * 1000).toISOString(),
          upvotes: 2
        }
      ],
      aiAnalysis: {
        category: t.category,
        confidence: 0.95,
        priority: t.priority,
        explanation: `AI verified signature matches ${t.category} profile. Suggested immediate review.`,
        tags: t.tags,
        suggestedAction: `Dispatch municipal engineers to assess street elements at ${streetLabel}.`,
        estimatedResolutionDays: t.category === 'water_leak' ? 2 : t.category === 'pothole' ? 4 : 8
      }
    };

    seededIssues.push(newIssue);
  }

  // Replace default issues with seeded issues for the chosen city!
  issues = seededIssues;
  res.json(issues);
});

// 2. Get user profile
app.get('/api/profile', (req, res) => {
  const email = (req.query.email as string) || 'sourish25maity@gmail.com';
  const name = req.query.name as string;
  res.json(getProfile(email, name));
});

// 2.1 Get leader board profiles
app.get('/api/profiles/leaderboard', (req, res) => {
  const list = Object.values(userProfiles).sort((a, b) => b.xp - a.xp);
  res.json(list);
});

// 3. Analyze issue via Gemini (Smart prefill)
app.post('/api/gemini/analyze', async (req, res) => {
  const { description, imageBase64, imageMime } = req.body;

  if (!description && !imageBase64) {
    return res.status(400).json({ error: 'Please provide either a text description or an image to analyze.' });
  }

  if (!ai) {
    // Mock Fallback response when GEMINI_API_KEY is not configured
    console.log('Gemini client not initialized, returning realistic mock AI response.');
    
    // Simple rule-based mock categorization based on keyword matches
    const text = (description || '').toLowerCase();
    let category: IssueCategory = 'other';
    let suggestedTags = ['Local Issue', 'Citizen Report'];
    let priority: IssuePriority = 'medium';
    let resDays = 7;
    let explanation = 'Mock AI categorized this based on key terms found in your description.';

    if (text.includes('pothole') || text.includes('road') || text.includes('asphalt') || text.includes('street damage')) {
      category = 'pothole';
      suggestedTags = ['Road Damage', 'Traffic Hazard', 'Pavement'];
      priority = 'high';
      resDays = 5;
    } else if (text.includes('leak') || text.includes('water') || text.includes('pipe') || text.includes('drain')) {
      category = 'water_leak';
      suggestedTags = ['Water Wastage', 'Leakage', 'Infrastructure'];
      priority = 'critical';
      resDays = 2;
    } else if (text.includes('streetlight') || text.includes('lamp') || text.includes('light') || text.includes('dark')) {
      category = 'broken_streetlight';
      suggestedTags = ['Dark Zone', 'Electrical issue', 'Public Safety'];
      priority = 'medium';
      resDays = 10;
    } else if (text.includes('trash') || text.includes('garbage') || text.includes('dump') || text.includes('waste')) {
      category = 'waste_management';
      suggestedTags = ['Sanitation', 'Litter', 'Illegal Dumping'];
      priority = 'medium';
      resDays = 3;
    } else if (text.includes('bridge') || text.includes('sidewalk') || text.includes('handrail') || text.includes('bench') || text.includes('park')) {
      category = 'public_infrastructure';
      suggestedTags = ['Pedestrian Safety', 'Public Assets', 'Parks'];
      priority = 'high';
      resDays = 7;
    }

    const mockAnalysis: AIAnalysis = {
      category,
      confidence: 0.89,
      priority,
      explanation,
      tags: suggestedTags,
      suggestedAction: `Deploy local field inspectors to verify report details and issue appropriate work orders.`,
      estimatedResolutionDays: resDays
    };

    return res.json(mockAnalysis);
  }

  try {
    let contents: any[] = [];
    
    if (imageBase64 && imageMime) {
      contents.push({
        inlineData: {
          mimeType: imageMime,
          data: imageBase64
        }
      });
    }

    contents.push({
      text: `Analyze the following community issue report.
Description provided by citizen: "${description || 'No text description provided, please analyze the image.'}"

Determine the following fields:
1. "category": Select exactly one of these strings: "pothole", "water_leak", "broken_streetlight", "waste_management", "public_infrastructure", "other".
2. "confidence": A decimal between 0.0 and 1.0 representing how confident you are in this categorization.
3. "priority": Select exactly one: "low", "medium", "high", "critical" based on risk to safety, flooding, or security.
4. "explanation": A 2-sentence citizen-friendly summary of why this category and priority were selected.
5. "tags": An array of 3 relevant short keyword tags.
6. "suggestedAction": A 1-sentence technical instruction for the municipal crew.
7. "estimatedResolutionDays": An integer representing realistic days to fix this (e.g. 2 for leaks, 5 for potholes, 10 for streetlights).

Return ONLY a JSON object matching this schema:
{
  "category": "pothole" | "water_leak" | "broken_streetlight" | "waste_management" | "public_infrastructure" | "other",
  "confidence": number,
  "priority": "low" | "medium" | "high" | "critical",
  "explanation": "string",
  "tags": ["string", "string", "string"],
  "suggestedAction": "string",
  "estimatedResolutionDays": number
}`
    });

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: contents,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            category: { type: Type.STRING },
            confidence: { type: Type.NUMBER },
            priority: { type: Type.STRING },
            explanation: { type: Type.STRING },
            tags: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            suggestedAction: { type: Type.STRING },
            estimatedResolutionDays: { type: Type.INTEGER }
          },
          required: ['category', 'confidence', 'priority', 'explanation', 'tags', 'suggestedAction', 'estimatedResolutionDays']
        }
      }
    });

    const textResult = response.text;
    if (!textResult) {
      throw new Error('Empty response from Gemini AI');
    }
    
    const parsed = JSON.parse(textResult.trim());
    res.json(parsed);

  } catch (error: any) {
    console.error('Error in Gemini analysis:', error);
    res.status(500).json({ error: 'AI analysis failed: ' + error.message });
  }
});

// 4. Create a new issue (optionally running Gemini automatic categorization)
app.post('/api/issues', async (req, res) => {
  const { title, description, category, priority, latitude, longitude, address, reporterName, reporterEmail, imageUrl, imageMime, enrichWithAI } = req.body;

  if (!title || !description || latitude === undefined || longitude === undefined || latitude === null || longitude === null) {
    return res.status(400).json({ error: 'Missing required issue fields (title, description, lat, long).' });
  }

  const latNum = Number(latitude);
  const lngNum = Number(longitude);

  if (isNaN(latNum) || isNaN(lngNum) || !isFinite(latNum) || !isFinite(lngNum)) {
    return res.status(400).json({ error: 'latitude and longitude must be valid finite numbers.' });
  }

  const newId = `issue-${Date.now()}`;
  const currentDate = new Date().toISOString();

  let finalCategory: IssueCategory = category || 'other';
  let finalPriority: IssuePriority = priority || 'medium';
  let finalTags: string[] = ['Citizen Report'];
  let aiAnalysisResult: AIAnalysis | undefined = undefined;

  // If user requests smart AI prefill, we attempt to query Gemini
  if (enrichWithAI) {
    if (ai) {
      try {
        let contents: any[] = [];
        if (imageUrl && imageMime) {
          // extract base64 chunk
          const base64Data = imageUrl.split(',')[1] || imageUrl;
          contents.push({
            inlineData: {
              mimeType: imageMime,
              data: base64Data
            }
          });
        }
        contents.push({
          text: `Analyze this reported issue to categorize and prioritize.
Title: "${title}"
Description: "${description}"

Respond strictly in JSON:
{
  "category": "pothole" | "water_leak" | "broken_streetlight" | "waste_management" | "public_infrastructure" | "other",
  "confidence": number,
  "priority": "low" | "medium" | "high" | "critical",
  "explanation": "string",
  "tags": ["string", "string", "string"],
  "suggestedAction": "string",
  "estimatedResolutionDays": number
}`
        });

        const aiResponse = await ai.models.generateContent({
          model: 'gemini-3.5-flash',
          contents: contents,
          config: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                category: { type: Type.STRING },
                confidence: { type: Type.NUMBER },
                priority: { type: Type.STRING },
                explanation: { type: Type.STRING },
                tags: { type: Type.ARRAY, items: { type: Type.STRING } },
                suggestedAction: { type: Type.STRING },
                estimatedResolutionDays: { type: Type.INTEGER }
              },
              required: ['category', 'confidence', 'priority', 'explanation', 'tags', 'suggestedAction', 'estimatedResolutionDays']
            }
          }
        });

        const parsed: AIAnalysis = JSON.parse(aiResponse.text.trim());
        finalCategory = parsed.category;
        finalPriority = parsed.priority;
        finalTags = parsed.tags;
        aiAnalysisResult = parsed;
      } catch (e) {
        console.error('Failed inline AI enrichment, falling back to client-provided values:', e);
      }
    } else {
      // In-memory simple analyzer
      finalCategory = category || 'other';
      finalPriority = priority || 'medium';
      finalTags = [finalCategory.toUpperCase().replace('_', ' '), 'AI Flagged'];
    }
  } else {
    // Manual tags
    finalTags = [finalCategory.toUpperCase().replace('_', ' '), 'Manual Report'];
  }

  const newIssue: Issue = {
    id: newId,
    title,
    category: finalCategory,
    description,
    imageUrl,
    latitude: latNum,
    longitude: lngNum,
    address: address || 'Maplewood District',
    status: 'reported',
    priority: finalPriority,
    reporterName: reporterName || 'Anonymous Hero',
    reporterEmail: reporterEmail || 'anonymous@example.com',
    createdAt: currentDate,
    upvotes: 1,
    votedEmails: [reporterEmail || 'anonymous@example.com'],
    verifiedCount: 1,
    verifiedEmails: [reporterEmail || 'anonymous@example.com'],
    duplicatedCount: 0,
    tags: finalTags,
    updates: [
      {
        id: `log-${newId}-1`,
        status: 'reported',
        description: `Issue reported by ${reporterName || 'Anonymous Citizen'}. Initial state logged.`,
        createdAt: currentDate,
        author: reporterName || 'Anonymous Citizen'
      }
    ],
    comments: [],
    aiAnalysis: aiAnalysisResult
  };

  // Add the AI greeting comment if AI enriched
  if (aiAnalysisResult) {
    newIssue.comments.push({
      id: `ai-comment-${Date.now()}`,
      author: 'City Bot (Gemini AI Assistant)',
      email: 'gemini-bot@citygov.org',
      content: `🤖 **AI Automated Review**: I have analyzed this report.
- **Assessed Hazard Level**: ${aiAnalysisResult.priority.toUpperCase()}
- **Suggested Municipal Response**: ${aiAnalysisResult.suggestedAction}
- **Explanation**: ${aiAnalysisResult.explanation}
- **Target SLA Resolution**: ~${aiAnalysisResult.estimatedResolutionDays} days.`,
      createdAt: currentDate,
      isMunicipalOfficial: true,
      upvotes: 3
    });
  }

  issues.unshift(newIssue);

  // Award XP to the reporter
  const reporterEmailSafe = reporterEmail || 'anonymous@example.com';
  const { profile, newBadges } = awardXP(reporterEmailSafe, 50, 'report');

  res.status(201).json({ issue: newIssue, profile, newBadges });
});

// 5. Upvote an issue
app.post('/api/issues/:id/upvote', (req, res) => {
  const { id } = req.params;
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'User email is required to upvote.' });
  }

  const issue = issues.find(i => i.id === id);
  if (!issue) {
    return res.status(404).json({ error: 'Issue not found.' });
  }

  const normalizedEmail = email.toLowerCase().trim();
  if (issue.votedEmails.includes(normalizedEmail)) {
    // Undo vote (toggle behavior)
    issue.votedEmails = issue.votedEmails.filter(e => e !== normalizedEmail);
    issue.upvotes = Math.max(0, issue.upvotes - 1);
    return res.json({ issue, undo: true });
  }

  issue.votedEmails.push(normalizedEmail);
  issue.upvotes += 1;

  // Award XP
  const { profile, newBadges } = awardXP(normalizedEmail, 10, 'vote');

  res.json({ issue, profile, newBadges });
});

// 6. Community Verification (Mark as verified / active)
app.post('/api/issues/:id/verify', (req, res) => {
  const { id } = req.params;
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'User email is required to verify.' });
  }

  const issue = issues.find(i => i.id === id);
  if (!issue) {
    return res.status(404).json({ error: 'Issue not found.' });
  }

  const normalizedEmail = email.toLowerCase().trim();
  if (issue.verifiedEmails.includes(normalizedEmail)) {
    return res.status(400).json({ error: 'You have already verified this issue.' });
  }

  issue.verifiedEmails.push(normalizedEmail);
  issue.verifiedCount += 1;

  // Add automatic comment on 5th and 10th verification to elevate priority!
  if (issue.verifiedCount === 5 && issue.priority === 'low') {
    issue.priority = 'medium';
    issue.updates.push({
      id: `log-verify-${Date.now()}`,
      status: issue.status,
      description: 'System Notice: Priority automatically upgraded to MEDIUM based on 5 community verifications.',
      createdAt: new Date().toISOString(),
      author: 'City AI Bot'
    });
  }

  const { profile, newBadges } = awardXP(normalizedEmail, 15, 'verify');

  res.json({ issue, profile, newBadges });
});

// 7. Add Comment
app.post('/api/issues/:id/comment', (req, res) => {
  const { id } = req.params;
  const { author, email, content } = req.body;

  if (!author || !email || !content) {
    return res.status(400).json({ error: 'Missing comment fields (author, email, content).' });
  }

  const issue = issues.find(i => i.id === id);
  if (!issue) {
    return res.status(404).json({ error: 'Issue not found.' });
  }

  // Check if it's a municipal official
  const isGov = email.endsWith('.org') || email.endsWith('.gov') || email.includes('liaison');

  const newComment: Comment = {
    id: `c-${Date.now()}`,
    author,
    email: email.toLowerCase().trim(),
    content,
    createdAt: new Date().toISOString(),
    isMunicipalOfficial: isGov,
    upvotes: 0
  };

  issue.comments.push(newComment);

  // If municipal comment, add update log
  if (isGov) {
    issue.updates.push({
      id: `log-gov-${Date.now()}`,
      status: issue.status,
      description: `Official Municipal update posted by ${author}: "${content.substring(0, 60)}${content.length > 60 ? '...' : ''}"`,
      createdAt: new Date().toISOString(),
      author
    });
  }

  const { profile, newBadges } = awardXP(email, 15, 'comment');

  res.json({ issue, comment: newComment, profile, newBadges });
});

// 8. Update Issue Status (Simulated Municipal Action & Work Order Generation)
app.post('/api/issues/:id/status', (req, res) => {
  const { id } = req.params;
  const { status, description, author, workOrder } = req.body;

  if (!status || !description) {
    return res.status(400).json({ error: 'Status and description required.' });
  }

  const issue = issues.find(i => i.id === id);
  if (!issue) {
    return res.status(404).json({ error: 'Issue not found.' });
  }

  issue.status = status as IssueStatus;
  
  // Generate and attach work order if provided
  if (workOrder && (status === 'scheduled' || status === 'in_progress')) {
    const newWorkOrder: WorkOrder = {
      id: `wo-${Date.now()}`,
      assignedCrew: workOrder.assignedCrew || 'General Maintenance',
      scheduledDate: workOrder.scheduledDate || new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString().split('T')[0],
      materialsNeeded: workOrder.materialsNeeded || 'Asphalt Patch, Hand tools',
      instructions: workOrder.instructions || 'Execute immediate repairs and secure surroundings.',
      dispatchedAt: new Date().toISOString()
    };
    issue.workOrder = newWorkOrder;
  } else if (status === 'resolved' || status === 'reported') {
    // Clear work order once resolved or returned to reported
    delete issue.workOrder;
  }

  const newLog: UpdateLog = {
    id: `log-status-${Date.now()}`,
    status: status as IssueStatus,
    description,
    createdAt: new Date().toISOString(),
    author: author || 'City Dispatch'
  };

  issue.updates.push(newLog);

  res.json(issue);
});

// 8.1 Mark Issue as Duplicate of Another Active Report
app.post('/api/issues/:id/duplicate', (req, res) => {
  const { id } = req.params;
  const { duplicateOfId, email } = req.body;

  if (!duplicateOfId || !email) {
    return res.status(400).json({ error: 'duplicateOfId and user email are required.' });
  }

  const duplicateIssue = issues.find(i => i.id === id);
  const parentIssue = issues.find(i => i.id === duplicateOfId);

  if (!duplicateIssue) {
    return res.status(404).json({ error: 'Duplicate issue report not found.' });
  }
  if (!parentIssue) {
    return res.status(404).json({ error: 'Target parent issue report not found.' });
  }

  const normalizedEmail = email.toLowerCase().trim();

  // Update duplicate issue
  duplicateIssue.duplicateOfId = duplicateOfId;
  duplicateIssue.status = 'resolved'; // Set to resolved because it is effectively closed / merged
  
  // Add timeline comment detailing duplication merge
  duplicateIssue.updates.push({
    id: `log-dup-${Date.now()}`,
    status: 'resolved',
    description: `Report closed as duplicate of active case: "${parentIssue.title}" (Ref: ${parentIssue.id}). Supporting records merged.`,
    createdAt: new Date().toISOString(),
    author: 'Community Moderation'
  });

  // Increment duplicate count on parent and add update log
  parentIssue.duplicatedCount += 1;
  parentIssue.updates.push({
    id: `log-parent-dup-${Date.now()}`,
    status: parentIssue.status,
    description: `Community flagged another report (Ref: ${duplicateIssue.id}) as a duplicate of this case. Duplication count raised to ${parentIssue.duplicatedCount}.`,
    createdAt: new Date().toISOString(),
    author: 'Community Moderation'
  });

  // Award reputation XP to the citizen reporter who flagged it (15 XP)
  const { profile, newBadges } = awardXP(normalizedEmail, 15, 'verify');

  res.json({ duplicateIssue, parentIssue, profile, newBadges });
});

// 9. AI-Powered Predictive Insights & Hotspots Page
app.get('/api/gemini/insights', async (req, res) => {
  if (!ai) {
    // Return mock predictive insights
    console.log('Gemini client not initialized, returning mock predictive insights.');
    
    const mockInsights: PredictiveInsights = {
      hotspots: [
        {
          area: 'Downtown Sector',
          category: 'pothole',
          riskScore: 88,
          dominantIssueType: 'Heavy traffic asphalt disintegration',
          recommendedPrevention: 'Schedule pre-emptive thermal paving sealants along key commuter bus routes before the autumn rain season.',
          trend: 'increasing'
        },
        {
          area: 'Oakridge Residential',
          category: 'water_leak',
          riskScore: 75,
          dominantIssueType: 'Aging cast-iron pipe joint fractures',
          recommendedPrevention: 'Deploy smart acoustic hydro-sensors on major distribution nodes to trace micro-fissures before sudden ruptures.',
          trend: 'stable'
        },
        {
          area: 'Pinecrest Suburbs',
          category: 'broken_streetlight',
          riskScore: 62,
          dominantIssueType: 'Legacy lamp ballast wear-and-tear',
          recommendedPrevention: 'Accelerate the Smart LED Conversion Program on residential lateral segments to bypass high-frequency transformer failures.',
          trend: 'decreasing'
        },
        {
          area: 'Riverside Walkways',
          category: 'waste_management',
          riskScore: 70,
          dominantIssueType: 'Fly-tipping in undeveloped buffer lots',
          recommendedPrevention: 'Install motion-sensor LED solar beacons and clear "No Dumping" warning plates connected to administrative penalties.',
          trend: 'increasing'
        }
      ],
      priorityActions: [
        {
          title: 'Oakridge Water Pressure Relief',
          description: 'High volume pipe leak suggests localized distribution over-pressurization. Recommending diagnostic bypass bypass valves.',
          priority: 'critical',
          area: 'Oakridge Residential'
        },
        {
          title: 'Elm Bridge Sidewalk Slab Re-leveling',
          description: 'A collapse of safety handrails represents high municipal liability. Schedule structural wood-timber dispatch immediately.',
          priority: 'high',
          area: 'Riverside Walkways'
        }
      ],
      seasonalAlerts: [
        'Rainfall Alert: Accumulated organic debris in the storm drains along River Road threatens localized street flooding during incoming weather.',
        'Heat Expansion Alert: Concrete sidewalk buckling likelihood is heightened along unshaded walks in Downtown Main plaza.'
      ],
      aiSummary: 'This predictive report assesses historical citizen filings and local spatial correlations. By resolving critical pipe pressure issues and stabilizing pedestrian boundaries in Riverside, the city can mitigate 70% of potential injury and flooding liability cases this quarter.'
    };

    return res.json(mockInsights);
  }

  try {
    // Compile a quick dataset summary for Gemini
    const datasetSummary = issues.map(i => ({
      category: i.category,
      priority: i.priority,
      status: i.status,
      address: i.address,
      upvotes: i.upvotes,
      date: i.createdAt
    }));

    const prompt = `You are a Municipal Civil Engineer and AI Analytics Specialist.
Based on the following dataset of citizen-reported community issues, perform a predictive maintenance risk analysis.

CITIZEN FILINGS DATASET:
${JSON.stringify(datasetSummary, null, 2)}

Identify:
1. Spatial Risk Hotspots (Maximum 4 distinct neighborhoods or sectors based on density, type of issue, and trend). Provide a riskScore (0-100), dominantIssueType, trend, and recommendedPrevention.
2. Immediate Priority Actions (2-3 highly specific preventative structural operations with priority "high" or "critical").
3. Seasonal Alerts (2 short bullet points warning of weather/seasonal failures like thermal expansion, leaf debris clogging, or freeze-thaw asphalt degradation).
4. A concise Engineer's Executive AI Summary of the situation (3-4 sentences max, summarizing citizen feedback trends and how AI insights help prevent future failures).

Return strictly a JSON object matching this schema:
{
  "hotspots": [
    {
      "area": "string (e.g. Oakridge Suburbs)",
      "category": "pothole" | "water_leak" | "broken_streetlight" | "waste_management" | "public_infrastructure" | "other",
      "riskScore": number,
      "dominantIssueType": "string",
      "recommendedPrevention": "string",
      "trend": "increasing" | "stable" | "decreasing"
    }
  ],
  "priorityActions": [
    {
      "title": "string",
      "description": "string",
      "priority": "high" | "critical",
      "area": "string"
    }
  ],
  "seasonalAlerts": ["string", "string"],
  "aiSummary": "string"
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            hotspots: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  area: { type: Type.STRING },
                  category: { type: Type.STRING },
                  riskScore: { type: Type.NUMBER },
                  dominantIssueType: { type: Type.STRING },
                  recommendedPrevention: { type: Type.STRING },
                  trend: { type: Type.STRING }
                },
                required: ['area', 'category', 'riskScore', 'dominantIssueType', 'recommendedPrevention', 'trend']
              }
            },
            priorityActions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  description: { type: Type.STRING },
                  priority: { type: Type.STRING },
                  area: { type: Type.STRING }
                },
                required: ['title', 'description', 'priority', 'area']
              }
            },
            seasonalAlerts: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            aiSummary: { type: Type.STRING }
          },
          required: ['hotspots', 'priorityActions', 'seasonalAlerts', 'aiSummary']
        }
      }
    });

    const parsed: PredictiveInsights = JSON.parse(response.text.trim());
    res.json(parsed);

  } catch (error: any) {
    console.error('Error generating predictive insights:', error);
    res.status(500).json({ error: 'Failed to generate predictive maintenance report: ' + error.message });
  }
});

// --- VITE MIDDLEWARE AND SPA SERVING ---

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
}

startServer();
