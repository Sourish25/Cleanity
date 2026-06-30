/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  MapPin,
  AlertTriangle,
  CheckCircle,
  Clock,
  Sparkles,
  Filter,
  Search,
  PlusCircle,
  User,
  ThumbsUp,
  RefreshCw,
  Info,
  Shield,
  Briefcase,
  Calendar,
  X,
  MessageSquare,
  ChevronRight,
  Send,
  Check,
  Building,
  Compass,
  ArrowRight,
  LogOut,
  Sliders,
  Sparkle,
  TrendingUp,
  Download,
  Trophy,
  Award,
  BarChart2,
  Printer,
  FileText,
  Map,
  List
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';

// Subcomponents
import { InteractiveMap } from './components/InteractiveMap';
import { FileHazardForm } from './components/FileHazardForm';
import { HazardCard } from './components/HazardCard';
import { GridBackgroundAnimation } from './components/GridBackgroundAnimation';

// Types
import { Issue, Comment, UpdateLog, IssueCategory, IssueStatus, IssuePriority, UserProfile, WorkOrder } from './types';

const getSlaEtaText = (priority: string, status: string, createdAt: string | number) => {
  if (status === 'resolved') return 'Resolved and closed';
  const createdDate = new Date(createdAt);
  let totalHours = 240; // low (10 days)
  if (priority === 'critical') totalHours = 24;
  else if (priority === 'high') totalHours = 48;
  else if (priority === 'medium') totalHours = 120; // 5 days

  const etaDate = new Date(createdDate.getTime() + totalHours * 60 * 60 * 1000);
  const now = new Date();
  const diffTime = etaDate.getTime() - now.getTime();
  
  if (diffTime <= 0) {
    return 'Resolution past official SLA window (Escalated Dispatch)';
  }
  
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  if (diffDays === 1) {
    return 'Official SLA Target: Within 24 hours';
  }
  return `Official SLA Target: ${diffDays} days remaining`;
};

export default function App() {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
  
  // App Configs & Session States
  const [userEmail, setUserEmail] = useState<string>('sourish25maity@gmail.com');
  const [userName, setUserName] = useState<string>('Sourish Maity');
  const [isOfficialMode, setIsOfficialMode] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeView, setActiveView] = useState<'grid' | 'file' | 'insights' | 'leaderboard'>('grid');

  // Search, Coordinates, Filtering and Sorting
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'priority' | 'upvotes' | 'verified'>('newest');
  const [selectedCoords, setSelectedCoords] = useState<{ lat: number; lng: number; address?: string } | null>(null);

  // Status transitions state for Official dispatcher mode
  const [officialStatus, setOfficialStatus] = useState<IssueStatus>('under_review');
  const [officialLog, setOfficialLog] = useState<string>('');
  const [isStatusSubmitting, setIsStatusSubmitting] = useState<boolean>(false);

  // Citizen comment state
  const [commentText, setCommentText] = useState<string>('');
  const [isCommentSubmitting, setIsCommentSubmitting] = useState<boolean>(false);

  // Onboarding & Custom City Seeding states
  const [isOnboarded, setIsOnboarded] = useState<boolean>(false);
  const [onboardStep, setOnboardStep] = useState<'city' | 'role'>('city');
  const [cityInput, setCityInput] = useState<string>('');
  const [cityName, setCityName] = useState<string>('New York');
  const [cityCenter, setCityCenter] = useState<{ lat: number; lng: number }>({ lat: 40.7128, lng: -74.0060 });
  const [geocodingStatus, setGeocodingStatus] = useState<'idle' | 'searching' | 'success' | 'error'>('idle');
  const [geocodingError, setGeocodingError] = useState<string>('');
  const [seedingProgress, setSeedingProgress] = useState<string>('');
  const [roleInput, setRoleInput] = useState<'citizen' | 'official'>('citizen');
  const [officialPasscode, setOfficialPasscode] = useState<string>('');
  const [passcodeError, setPasscodeError] = useState<string>('');

  // Leaderboard state
  const [leaderboard, setLeaderboard] = useState<UserProfile[]>([]);
  const [loadingLeaderboard, setLoadingLeaderboard] = useState<boolean>(false);

  // Duplicate Flagging state
  const [selectedDuplicateOfId, setSelectedDuplicateOfId] = useState<string>('');
  const [isDuplicateSubmitting, setIsDuplicateSubmitting] = useState<boolean>(false);

  // Citizen action receipt state
  const [showReceipt, setShowReceipt] = useState<boolean>(false);

  // Mobile Tab view switcher state ('list' = feed/reports/etc, 'map' = geographic map)
  const [mobileTab, setMobileTab] = useState<'list' | 'map'>('list');

  // Official Work Order Generation states
  const [assignedCrew, setAssignedCrew] = useState<string>('');
  const [scheduledDate, setScheduledDate] = useState<string>('');
  const [materialsNeeded, setMaterialsNeeded] = useState<string>('');
  const [workInstructions, setWorkInstructions] = useState<string>('');

  // Fetch initial list and profile
  const fetchData = async () => {
    try {
      setLoading(true);
      const [issuesRes, profileRes] = await Promise.all([
        fetch('/api/issues'),
        fetch(`/api/profile?email=${encodeURIComponent(userEmail)}&name=${encodeURIComponent(userName)}`)
      ]);
      
      const issuesData = await issuesRes.json();
      const profileData = await profileRes.json();
      
      setIssues(issuesData);
      setProfile(profileData);
    } catch (err) {
      console.error('Failed to fetch hazard reports:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchLeaderboard = async () => {
    try {
      setLoadingLeaderboard(true);
      const res = await fetch('/api/profiles/leaderboard');
      const data = await res.json();
      setLeaderboard(data);
    } catch (err) {
      console.error('Failed to fetch leaderboard:', err);
    } finally {
      setLoadingLeaderboard(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [userEmail]);

  useEffect(() => {
    if (activeView === 'leaderboard') {
      fetchLeaderboard();
    }
  }, [activeView]);

  // Handle reporting submit
  const handleReportSubmit = async (formData: {
    title: string;
    description: string;
    category: IssueCategory;
    priority: IssuePriority;
    latitude: number;
    longitude: number;
    address: string;
    image: string;
    imageMime: string;
    enrichWithAI: boolean;
  }) => {
    try {
      const res = await fetch('/api/issues', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          reporterName: userName,
          reporterEmail: userEmail,
          imageUrl: formData.image,
        }),
      });

      const data = await res.json();
      if (data.issue) {
        setIssues((prev) => [data.issue, ...prev]);
        if (data.profile) setProfile(data.profile);
        
        // Auto select newly created issue
        setSelectedIssue(data.issue);
        setSelectedCoords(null);
        setActiveView('grid');
      }
    } catch (err) {
      console.error('Hazard record submission failed:', err);
    }
  };

  // Upvote Action
  const handleUpvote = async (issueId: string) => {
    try {
      const res = await fetch(`/api/issues/${issueId}/upvote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: userEmail }),
      });
      const data = await res.json();
      if (data.issue) {
        setIssues((prev) => prev.map((i) => (i.id === issueId ? data.issue : i)));
        if (selectedIssue?.id === issueId) {
          setSelectedIssue(data.issue);
        }
        if (data.profile) setProfile(data.profile);
      }
    } catch (err) {
      console.error('Upvote request failed:', err);
    }
  };

  // Verify Action
  const handleVerify = async (issueId: string) => {
    try {
      const res = await fetch(`/api/issues/${issueId}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: userEmail }),
      });
      const data = await res.json();
      if (data.issue) {
        setIssues((prev) => prev.map((i) => (i.id === issueId ? data.issue : i)));
        if (selectedIssue?.id === issueId) {
          setSelectedIssue(data.issue);
        }
        if (data.profile) setProfile(data.profile);
      }
    } catch (err) {
      console.error('Ground-truth verification request failed:', err);
    }
  };

  // Post Comment Action
  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedIssue || !commentText.trim()) return;

    setIsCommentSubmitting(true);
    try {
      const res = await fetch(`/api/issues/${selectedIssue.id}/comment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          author: userName,
          email: userEmail,
          content: commentText,
        }),
      });
      const data = await res.json();
      if (data.issue) {
        setIssues((prev) => prev.map((i) => (i.id === selectedIssue.id ? data.issue : i)));
        setSelectedIssue(data.issue);
        setCommentText('');
      }
    } catch (err) {
      console.error('Failed to post citizen comment:', err);
    } finally {
      setIsCommentSubmitting(false);
    }
  };

  // Official dispatcher status change transition
  const handleOfficialStatusChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedIssue || !officialLog.trim()) return;

    setIsStatusSubmitting(true);
    try {
      const isWorkOrderActive = officialStatus === 'scheduled' || officialStatus === 'in_progress';
      const payload = {
        status: officialStatus,
        description: officialLog,
        author: `${userName} (City Dispatcher)`,
        workOrder: isWorkOrderActive ? {
          assignedCrew,
          scheduledDate,
          materialsNeeded,
          instructions: workInstructions
        } : undefined
      };

      const res = await fetch(`/api/issues/${selectedIssue.id}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const updated = await res.json();
      if (updated && updated.id) {
        setIssues((prev) => prev.map((i) => (i.id === selectedIssue.id ? updated : i)));
        setSelectedIssue(updated);
        setOfficialLog('');
        // Clear work order states
        setAssignedCrew('');
        setScheduledDate('');
        setMaterialsNeeded('');
        setWorkInstructions('');
      }
    } catch (err) {
      console.error('Official status transition failed:', err);
    } finally {
      setIsStatusSubmitting(false);
    }
  };

  // Mark an issue as duplicate of another
  const handleMarkAsDuplicate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedIssue || !selectedDuplicateOfId) return;

    setIsDuplicateSubmitting(true);
    try {
      const res = await fetch(`/api/issues/${selectedIssue.id}/duplicate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          duplicateOfId: selectedDuplicateOfId,
          email: userEmail,
        }),
      });
      const data = await res.json();
      if (data.duplicateIssue) {
        setIssues((prev) =>
          prev.map((i) => {
            if (i.id === selectedIssue.id) return data.duplicateIssue;
            if (i.id === selectedDuplicateOfId) return data.parentIssue;
            return i;
          })
        );
        setSelectedIssue(data.duplicateIssue);
        setSelectedDuplicateOfId('');
        if (data.profile) setProfile(data.profile);
      }
    } catch (err) {
      console.error('Failed to submit duplicate report:', err);
    } finally {
      setIsDuplicateSubmitting(false);
    }
  };

  // Map Tap anchor coords
  const handleSelectCoordsOnMap = (lat: number, lng: number, suggestedAddress: string) => {
    setSelectedCoords({ lat, lng, address: suggestedAddress });
    // Switch view to Filing Form to auto-load these coordinates and suggested address
    setActiveView('file');
    // Mobile viewport transition to display the forms/detail pane
    setMobileTab('list');
  };

  // Geocode and Seed Workflow for Newly Selected City
  const handleOnboardCitySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cityInput.trim()) return;

    setGeocodingStatus('searching');
    setGeocodingError('');
    setSeedingProgress('Connecting to global geocoding grid...');

    try {
      // 1. Fetch Nominatim OpenStreetMap search API
      const geoUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(cityInput)}&limit=1`;
      const res = await fetch(geoUrl, {
        headers: {
          'User-Agent': 'Cleanity/1.0 (sourish25maity@gmail.com)'
        }
      });
      const data = await res.json();

      if (data && data.length > 0) {
        const resolvedLat = Number(data[0].lat);
        const resolvedLng = Number(data[0].lon);

        if (isNaN(resolvedLat) || isNaN(resolvedLng) || !isFinite(resolvedLat) || !isFinite(resolvedLng)) {
          throw new Error('Geocoded coordinates are invalid. Please check the city name and try again.');
        }

        const resolvedName = data[0].display_name.split(',')[0] || cityInput;

        setCityCenter({ lat: resolvedLat, lng: resolvedLng });
        setCityName(resolvedName);
        
        setSeedingProgress('Locating neighborhood intersections...');
        
        // 2. Trigger back-end issue seeding around these resolved coordinates
        const seedRes = await fetch('/api/issues/seed', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            lat: resolvedLat,
            lng: resolvedLng,
            city: resolvedName,
          }),
        });

        const seededData = await seedRes.json();
        if (seededData && !seededData.error) {
          setIssues(seededData);
          setGeocodingStatus('success');
          
          // Micro-timeout before transitioning step to ensure visual feedback completes
          setTimeout(() => {
            setOnboardStep('role');
          }, 800);
        } else {
          throw new Error('Spatial seeding failed in the municipal database.');
        }

      } else {
        throw new Error('City center or coordinates could not be found. Please check spelling.');
      }

    } catch (err: any) {
      console.error('Onboard spatial configuration failed:', err);
      setGeocodingStatus('error');
      setGeocodingError(err.message || 'Verification failed. Please try a major city.');
    }
  };

  // Role Confirmation
  const handleOnboardRoleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPasscodeError('');

    if (roleInput === 'official') {
      if (!officialPasscode.trim()) {
        setPasscodeError('Please enter municipal access passcode (e.g. staff123)');
        return;
      }
      // Demo authentication allows any passcode but establishes role securely
      setIsOfficialMode(true);
      setUserName('Officer Sourish (Dispatch)');
    } else {
      setIsOfficialMode(false);
      setUserName('Sourish Maity');
    }

    setIsOnboarded(true);
    setSelectedIssue(null);
  };

  // Filter and Sort list
  const filteredIssues = issues
    .filter((issue) => {
      const query = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !query ||
        issue.title.toLowerCase().includes(query) ||
        issue.description.toLowerCase().includes(query) ||
        issue.address.toLowerCase().includes(query) ||
        issue.tags.some((t) => t.toLowerCase().includes(query));

      const matchesCategory = categoryFilter === 'all' || issue.category === categoryFilter;

      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      if (sortBy === 'newest') {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      if (sortBy === 'priority') {
        const priorityWeight = { critical: 4, high: 3, medium: 2, low: 1 };
        const weightB = priorityWeight[b.priority] || 0;
        const weightA = priorityWeight[a.priority] || 0;
        return weightB - weightA;
      }
      if (sortBy === 'upvotes') {
        return b.upvotes - a.upvotes;
      }
      if (sortBy === 'verified') {
        return b.verifiedCount - a.verifiedCount;
      }
      return 0;
    });

  const getStatusBadge = (status: IssueStatus) => {
    switch (status) {
      case 'reported':
        return { label: 'Active Report', bg: 'bg-zinc-100 text-zinc-800 border-zinc-200' };
      case 'under_review':
        return { label: 'Under Review', bg: 'bg-amber-50 text-amber-800 border-amber-200' };
      case 'scheduled':
        return { label: 'Scheduled Repair', bg: 'bg-blue-50 text-blue-800 border-blue-200' };
      case 'in_progress':
        return { label: 'In Progress', bg: 'bg-orange-50 text-orange-800 border-orange-200' };
      case 'resolved':
        return { label: 'Resolved / Closed', bg: 'bg-emerald-50 text-emerald-800 border-emerald-200' };
    }
  };

  const formatCommentContent = (content: string) => {
    if (!content) return null;
    const parts = content.split('**');
    return (
      <span className="whitespace-pre-wrap">
        {parts.map((part, index) => {
          if (index % 2 === 1) {
            return (
              <strong key={index} className="font-bold text-zinc-900">
                {part}
              </strong>
            );
          }
          return part;
        })}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-zinc-50/50 text-zinc-800 font-sans antialiased selection:bg-amber-200 selection:text-zinc-900">
      
      <AnimatePresence mode="wait">
        {!isOnboarded ? (
          
          /* ========================================================================= */
          /* ONBOARDING/LANDING PAGE: Cinematic, High-End Minimalist Aesthetics (No cheap gradients) */
          /* ========================================================================= */
          <motion.div
            key="onboarding"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5 }}
            className="fixed inset-0 z-50 bg-zinc-950 flex flex-col justify-center items-center px-6 overflow-y-auto py-12"
          >
            {/* Ambient spatial grid background animation */}
            <GridBackgroundAnimation />

            {/* Premium Liquid Glass Glow Spheres (Solid colors with heavy blurs, no linear/radial CSS gradients) */}
            <div className="absolute top-1/4 left-1/4 w-80 h-80 rounded-full bg-amber-500/10 blur-[130px] pointer-events-none" />
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-zinc-500/5 blur-[160px] pointer-events-none" />

            <div className="relative z-10 w-full max-w-xl flex flex-col gap-8">
              
              {/* Header Branding - Cleanity Masterpiece */}
              <div className="flex flex-col items-center text-center gap-4">
                <div className="h-14 w-14 rounded-2xl bg-white/[0.04] border border-white/15 flex items-center justify-center text-white shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] backdrop-blur-md">
                  <Shield className="h-7 w-7 text-amber-400 stroke-[2]" />
                </div>
                <div className="flex flex-col gap-2">
                  <h1 className="text-3xl md:text-4xl font-display font-black tracking-widest text-white uppercase">
                    Cleanity
                  </h1>
                  <p className="text-xs text-zinc-400 font-sans max-w-sm mx-auto leading-relaxed">
                    A professional-grade municipal coordination system. Monitor local active hazards, process geolocated OSM coordinates, and track dispatcher actions.
                  </p>
                </div>
              </div>

              {/* Steps Layout Preserving Panel - Pure Liquid Glassmorphism */}
              <div className="bg-white/[0.02] backdrop-blur-2xl border border-white/10 rounded-3xl p-6 md:p-8 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.8)] relative overflow-hidden min-h-[340px] flex flex-col justify-center">
                
                {onboardStep === 'city' ? (
                  /* STEP 1: Search and geocode city center */
                  <motion.div
                    key="step-city"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                    className="flex flex-col gap-5 w-full"
                  >
                    <div>
                      <h3 className="text-xs font-mono font-bold text-amber-400 uppercase tracking-widest flex items-center gap-1.5">
                        <Compass className="h-4 w-4 text-amber-500" />
                        01 / SET MONITORING BOUNDARY
                      </h3>
                      <p className="text-xs text-zinc-400 font-sans mt-1">
                        Select any city or town globally. We will geocode exact coordinates and seed localized public reports automatically.
                      </p>
                    </div>

                    <form onSubmit={handleOnboardCitySubmit} className="flex flex-col gap-3.5">
                      <div className="relative">
                        <MapPin className="absolute left-4 top-4.5 h-4 w-4 text-zinc-500" />
                        <input
                          type="text"
                          required
                          placeholder="e.g. San Francisco, London, Paris, Tokyo"
                          value={cityInput}
                          onChange={(e) => setCityInput(e.target.value)}
                          disabled={geocodingStatus === 'searching'}
                          className="w-full bg-white/[0.02] border border-white/10 hover:border-white/25 focus:border-amber-400 rounded-2xl py-4 pl-11 pr-4 text-xs font-medium text-white placeholder-zinc-500 font-sans focus:outline-none transition-all shadow-inner"
                        />
                      </div>

                      {geocodingStatus === 'searching' && (
                        <div className="flex items-center gap-2 px-1 text-xs text-amber-500 font-mono">
                          <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                          <span>{seedingProgress}</span>
                        </div>
                      )}

                      {geocodingStatus === 'success' && (
                        <div className="flex items-center gap-2 px-1 text-xs text-emerald-500 font-mono">
                          <Check className="h-3.5 w-3.5" />
                          <span>Spatial seed established for {cityName}!</span>
                        </div>
                      )}

                      {geocodingStatus === 'error' && (
                        <div className="flex items-center gap-2 px-1 text-xs text-red-500 font-mono">
                          <AlertTriangle className="h-3.5 w-3.5" />
                          <span>{geocodingError}</span>
                        </div>
                      )}

                      <button
                        type="submit"
                        disabled={geocodingStatus === 'searching' || !cityInput.trim()}
                        className={`w-full py-4 rounded-2xl text-xs font-bold uppercase tracking-wider transition-all duration-300 flex items-center justify-center gap-2 ${
                          geocodingStatus === 'searching' || !cityInput.trim()
                            ? 'bg-white/5 text-zinc-500 border border-white/5 cursor-not-allowed'
                            : 'bg-white hover:bg-zinc-100 text-zinc-950 font-extrabold shadow-lg active:scale-[0.98]'
                        }`}
                      >
                        <span>Establish Boundary</span>
                        <ArrowRight className="h-4 w-4" />
                      </button>
                    </form>
                  </motion.div>
                ) : (
                  /* STEP 2: Configure identity role and mode */
                  <motion.div
                    key="step-role"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                    className="flex flex-col gap-5 w-full"
                  >
                    <div className="flex items-center justify-between gap-4 flex-wrap border-b border-white/10 pb-3.5">
                      <div>
                        <h3 className="text-xs font-mono font-bold text-amber-400 uppercase tracking-widest flex items-center gap-1.5">
                          <Sliders className="h-4 w-4 text-amber-500" />
                          02 / ASSIGN PORTAL ACCESS
                        </h3>
                        <p className="text-[11px] text-zinc-400 font-sans mt-1">
                          Configure your credentials to enter Cleanity.
                        </p>
                      </div>
                      <span className="text-[10px] font-mono font-bold bg-amber-500/10 border border-amber-500/25 text-amber-400 px-2.5 py-1 rounded-lg">
                        Zone: {cityName}
                      </span>
                    </div>

                    <form onSubmit={handleOnboardRoleSubmit} className="flex flex-col gap-4">
                      
                      {/* Grid card selector */}
                      <div className="grid grid-cols-2 gap-4">
                        <div
                          onClick={() => setRoleInput('citizen')}
                          className={`border rounded-2xl p-4 cursor-pointer transition-all flex flex-col gap-2 relative ${
                            roleInput === 'citizen'
                              ? 'border-amber-400 bg-white/[0.04]'
                              : 'border-white/10 hover:border-white/20 bg-transparent'
                          }`}
                        >
                          <User className={`h-4.5 w-4.5 ${roleInput === 'citizen' ? 'text-amber-400' : 'text-zinc-500'}`} />
                          <div>
                            <span className="text-xs font-bold text-white block">Citizen Reporter</span>
                            <span className="text-[10px] text-zinc-500 mt-0.5 block leading-tight">File hazards, verify listings, help your community</span>
                          </div>
                        </div>

                        <div
                          onClick={() => setRoleInput('official')}
                          className={`border rounded-2xl p-4 cursor-pointer transition-all flex flex-col gap-2 relative ${
                            roleInput === 'official'
                              ? 'border-amber-400 bg-white/[0.04]'
                              : 'border-white/10 hover:border-white/20 bg-transparent'
                          }`}
                        >
                          <Building className={`h-4.5 w-4.5 ${roleInput === 'official' ? 'text-amber-400' : 'text-zinc-500'}`} />
                          <div>
                            <span className="text-xs font-bold text-white block">Municipal Staff</span>
                            <span className="text-[10px] text-zinc-500 mt-0.5 block leading-tight">Dispatch workers, log details, modify status</span>
                          </div>
                        </div>
                      </div>

                      {roleInput === 'official' && (
                        <motion.div
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="flex flex-col gap-1.5"
                        >
                          <label className="text-[9px] font-mono uppercase tracking-wider text-zinc-400 font-bold">Staff Dispatcher Passcode *</label>
                          <input
                            type="password"
                            required
                            placeholder="Type any passcode to authenticate"
                            value={officialPasscode}
                            onChange={(e) => setOfficialPasscode(e.target.value)}
                            className="w-full bg-white/[0.02] border border-white/10 hover:border-white/20 focus:border-amber-400 rounded-2xl py-3.5 px-4 text-xs text-white placeholder-zinc-500 font-sans focus:outline-none transition-all"
                          />
                          {passcodeError && (
                            <span className="text-[10px] font-mono text-red-500">{passcodeError}</span>
                          )}
                        </motion.div>
                      )}

                      <div className="flex gap-3 mt-2">
                        <button
                          type="button"
                          onClick={() => {
                            setGeocodingStatus('idle');
                            setOnboardStep('city');
                          }}
                          className="flex-1 py-3.5 border border-white/10 hover:border-white/20 text-zinc-400 hover:text-white rounded-xl text-xs font-bold uppercase transition-all"
                        >
                          Back
                        </button>

                        <button
                          type="submit"
                          className="flex-1 py-3.5 bg-white hover:bg-zinc-100 text-zinc-950 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 shadow-lg active:scale-95"
                        >
                          <span>Enter Portal</span>
                          <Sparkle className="h-4 w-4 text-amber-500" />
                        </button>
                      </div>

                    </form>
                  </motion.div>
                )}

              </div>

            </div>
          </motion.div>
        ) : (
          
          /* ========================================================================= */
          /* MAIN WEB DASHBOARD APPLICATION PORTAL */
          /* ========================================================================= */
          <motion.div
            key="dashboard"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="min-h-screen"
          >
            {/* Sticky Header */}
            <header className="sticky top-0 z-40 border-b border-zinc-200/50 bg-white/70 backdrop-blur-lg py-3.5 px-4 sm:px-6 shadow-xs">
              <div className="max-w-7xl mx-auto flex flex-row items-center justify-between gap-3">
                
                {/* Brand Identity */}
                <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
                  <div className="h-8.5 w-8.5 sm:h-9.5 sm:w-9.5 rounded-xl bg-zinc-950 flex items-center justify-center text-white shadow-sm shrink-0 border border-white/10">
                    <Shield className="h-4.5 w-4.5 sm:h-5 sm:w-5 text-amber-400 stroke-[2]" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm sm:text-base font-display font-extrabold tracking-tight text-zinc-950 uppercase">Cleanity</span>
                      <span className="h-1 w-1 rounded-full bg-zinc-300 hidden sm:inline" />
                      <span className="text-[10px] sm:text-[11px] font-mono font-bold text-zinc-400 uppercase tracking-wider hidden sm:inline">{cityName}</span>
                    </div>
                    <div className="flex items-center gap-1 text-[9px] sm:text-[10px] text-zinc-500 sm:hidden">
                      <span className="font-bold text-zinc-400 uppercase tracking-wider">{cityName}</span>
                    </div>
                  </div>
                </div>

                {/* User & Settings Panel */}
                <div className="flex items-center gap-1.5 sm:gap-3 justify-end shrink-0">
                  
                  {/* Authenticated Citizen Profile details */}
                  {profile && (
                    <div className="flex items-center gap-1.5 bg-zinc-150/50 border border-zinc-200/80 p-1 sm:px-3 sm:py-1.5 rounded-xl text-xs" title={`${profile.name} (Level ${profile.level})`}>
                      <div className="w-6.5 h-6.5 sm:w-7 sm:h-7 rounded-lg bg-zinc-800 flex items-center justify-center text-amber-400 font-bold text-xs shrink-0">
                        {userName[0]}
                      </div>
                      <div className="hidden md:block text-[11px] text-zinc-600">
                        <span className="font-semibold text-zinc-800 block leading-tight">
                          {isOfficialMode ? 'Official Dispatcher' : profile.name}
                        </span>
                        <span className="text-[9px] text-zinc-400 font-mono block leading-none mt-0.5">
                          {isOfficialMode ? 'Municipal Admin' : `Contributor Lvl ${profile.level}`}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Reset Location back-to onboarding */}
                  <button
                    onClick={() => {
                      setIsOnboarded(false);
                      setOnboardStep('city');
                      setGeocodingStatus('idle');
                    }}
                    className="flex items-center gap-1.5 border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700 p-2 sm:px-3 sm:py-1.5 rounded-xl text-xs font-bold transition-all shadow-xs"
                    title="Change neighborhood city"
                  >
                    <Compass className="h-4 w-4 text-amber-500 shrink-0" />
                    <span className="hidden sm:inline">Change City</span>
                  </button>

                  {/* Admin toggle override */}
                  <button
                    onClick={() => {
                      if (isOfficialMode) {
                        setIsOfficialMode(false);
                        setUserName('Sourish Maity');
                      } else {
                        setIsOfficialMode(true);
                        setUserName('Officer Sourish (Dispatch)');
                      }
                    }}
                    className={`flex items-center gap-1.5 border p-2 sm:px-3 sm:py-1.5 rounded-xl text-xs font-bold transition-all duration-300 shadow-xs ${
                      isOfficialMode
                        ? 'bg-amber-500 text-zinc-950 border-amber-500 font-bold'
                        : 'bg-white text-zinc-700 border-zinc-200 hover:bg-zinc-50'
                    }`}
                    title={isOfficialMode ? 'Switch to Citizen Mode' : 'Switch to Staff Dispatch'}
                  >
                    <Briefcase className="h-4 w-4 shrink-0" />
                    <span className="hidden sm:inline">{isOfficialMode ? 'Staff Dispatch' : 'Citizen Mode'}</span>
                  </button>

                </div>
              </div>
            </header>

            {/* Main Container */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-8">
              
              {loading ? (
                <div className="flex flex-col items-center justify-center py-32 gap-3">
                  <RefreshCw className="h-7 w-7 text-amber-600 animate-spin" />
                  <p className="text-xs font-mono text-zinc-500 uppercase tracking-wider">Loading local database entries...</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start relative">
                  
                  {/* LEFT COLUMN: Map & Neighborhood Stats */}
                  <div className={`lg:col-span-5 ${mobileTab === 'map' ? 'flex' : 'hidden lg:flex'} flex-col gap-6`}>
                    
                    {/* Interactive Map Component */}
                    <InteractiveMap
                      issues={issues}
                      selectedIssue={selectedIssue}
                      onSelectIssue={(issue) => {
                        setSelectedIssue(issue);
                        setActiveView('grid');
                      }}
                      selectedCoords={selectedCoords}
                      onSelectCoords={handleSelectCoordsOnMap}
                      cityCenter={cityCenter}
                    />

                    {/* Grid Statistics */}
                     {/* Grid Statistics */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-white/60 backdrop-blur-md border border-zinc-200/50 rounded-2xl p-4.5 shadow-[0_8px_32px_0_rgba(0,0,0,0.03)]">
                        <span className="text-[9px] font-mono font-bold text-zinc-400 uppercase tracking-wider block">Active Hazards</span>
                        <div className="flex items-baseline gap-2 mt-1">
                          <span className="text-2xl font-display font-extrabold text-zinc-900">
                            {issues.filter((i) => i.status !== 'resolved').length}
                          </span>
                          <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                        </div>
                      </div>

                      <div className="bg-white/60 backdrop-blur-md border border-zinc-200/50 rounded-2xl p-4.5 shadow-[0_8px_32px_0_rgba(0,0,0,0.03)]">
                        <span className="text-[9px] font-mono font-bold text-zinc-400 uppercase tracking-wider block">Resolved Issues</span>
                        <div className="flex items-baseline gap-2 mt-1">
                          <span className="text-2xl font-display font-extrabold text-emerald-600">
                            {issues.filter((i) => i.status === 'resolved').length}
                          </span>
                          <span className="w-2 h-2 rounded-full bg-emerald-500" />
                        </div>
                      </div>
                    </div>

                    {/* Informational Guidelines Card */}
                    <div className="bg-white/60 backdrop-blur-md border border-zinc-200/50 rounded-2xl p-4.5 flex gap-3 shadow-[0_8px_32px_0_rgba(0,0,0,0.03)]">
                      <Info className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                      <div className="text-xs text-zinc-600 leading-relaxed font-sans">
                        <h5 className="font-bold text-zinc-900 mb-0.5">Community Guidelines</h5>
                        <p>
                          Ensure your safety. Do not step into high-traffic roadways or touch exposed utility conduits. Click any location on the map to pin coords, then complete the hazard report.
                        </p>
                      </div>
                    </div>

                  </div>

                  {/* RIGHT COLUMN: Interactive Feed & Details */}
                  <div className={`lg:col-span-7 ${mobileTab === 'list' ? 'flex' : 'hidden lg:flex'} flex-col gap-6`}>
                    
                    {/* Tabs Menu */}
                    <div className="flex items-center justify-between border-b border-zinc-200 pb-2">
                      <div className="flex flex-wrap items-center gap-1">
                        <button
                          onClick={() => {
                            setActiveView('grid');
                            setSelectedIssue(null);
                          }}
                          className={`px-3 py-2 text-xs font-bold tracking-wide uppercase border-b-2 transition-all ${
                            activeView === 'grid' && !selectedIssue
                              ? 'border-zinc-900 text-zinc-900 font-extrabold'
                              : 'border-transparent text-zinc-400 hover:text-zinc-600'
                          }`}
                        >
                          Feed
                        </button>
                        <button
                          onClick={() => {
                            setActiveView('file');
                            setSelectedIssue(null);
                          }}
                          className={`px-3 py-2 text-xs font-bold tracking-wide uppercase border-b-2 transition-all flex items-center gap-1 ${
                            activeView === 'file'
                              ? 'border-zinc-900 text-zinc-900 font-extrabold'
                              : 'border-transparent text-zinc-400 hover:text-zinc-600'
                          }`}
                        >
                          <PlusCircle className="h-3 w-3" />
                          Report
                        </button>
                        <button
                          onClick={() => {
                            setActiveView('insights');
                            setSelectedIssue(null);
                          }}
                          className={`px-3 py-2 text-xs font-bold tracking-wide uppercase border-b-2 transition-all flex items-center gap-1 ${
                            activeView === 'insights'
                              ? 'border-zinc-900 text-zinc-900 font-extrabold'
                              : 'border-transparent text-zinc-400 hover:text-zinc-600'
                          }`}
                        >
                          <BarChart2 className="h-3 w-3" />
                          Insights
                        </button>
                        <button
                          onClick={() => {
                            setActiveView('leaderboard');
                            setSelectedIssue(null);
                          }}
                          className={`px-3 py-2 text-xs font-bold tracking-wide uppercase border-b-2 transition-all flex items-center gap-1 ${
                            activeView === 'leaderboard'
                              ? 'border-zinc-900 text-zinc-900 font-extrabold'
                              : 'border-transparent text-zinc-400 hover:text-zinc-600'
                          }`}
                        >
                          <Trophy className="h-3 w-3" />
                          Local Heroes
                        </button>
                      </div>

                      {selectedIssue && (
                        <button
                          onClick={() => setSelectedIssue(null)}
                          className="text-[10px] font-mono font-bold text-zinc-600 bg-zinc-100 hover:bg-zinc-200 border border-zinc-200 px-2.5 py-1 rounded transition-all"
                        >
                          ← Back to Feed
                        </button>
                      )}
                    </div>

                    {/* Content Panel */}
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={`${activeView}-${selectedIssue?.id || 'none'}`}
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        transition={{ duration: 0.15 }}
                      >
                        
                        {/* SCENARIO 1: Detailed Incident View */}
                        {selectedIssue ? (
                          <div className="bg-white/60 backdrop-blur-md border border-zinc-200/50 rounded-2xl p-6 flex flex-col gap-6 shadow-[0_8px_32px_0_rgba(0,0,0,0.03)]">
                            
                            {/* Top Header Card Info */}
                            <div className="flex flex-col gap-1.5 border-b border-zinc-100 pb-4">
                              <div className="flex items-center justify-between gap-2 flex-wrap">
                                <span className="text-[10px] font-mono text-zinc-400 font-semibold uppercase">
                                  Incident Ref: {selectedIssue.id}
                                </span>
                                <span className={`text-[10px] font-mono font-bold px-2 py-0.5 border rounded-md uppercase tracking-wide ${
                                  selectedIssue.priority === 'critical' ? 'bg-red-50 text-red-700 border-red-200' :
                                  selectedIssue.priority === 'high' ? 'bg-orange-50 text-orange-700 border-orange-200' :
                                  'bg-zinc-50 text-zinc-700 border-zinc-200'
                                }`}>
                                  {selectedIssue.priority} priority
                                </span>
                              </div>
                              <h2 className="text-lg font-display font-bold text-zinc-900 tracking-tight mt-1">
                                {selectedIssue.title}
                              </h2>

                              {/* Municipal SLA Commitment Notice (Human Crafted, Design-Research Backed) */}
                              <div className="flex items-center gap-2.5 bg-zinc-50 border border-zinc-200 rounded-xl p-3 mt-2 text-[11px] font-mono text-zinc-600">
                                <Clock className={`h-4 w-4 shrink-0 ${
                                  selectedIssue.status === 'resolved' ? 'text-emerald-500' :
                                  selectedIssue.priority === 'critical' ? 'text-red-500 animate-pulse' :
                                  'text-amber-500'
                                }`} />
                                <div className="flex-1 min-w-0">
                                  <span className="font-bold text-zinc-800 uppercase block text-[9px] tracking-wider leading-none">
                                    Municipal Response Commitment
                                  </span>
                                  <span className="mt-1 block font-sans text-xs text-zinc-600 font-medium leading-none">
                                    {getSlaEtaText(selectedIssue.priority, selectedIssue.status, selectedIssue.createdAt)}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Duplicate / Merged Incident Banner */}
                            {selectedIssue.duplicateOfId && (
                              <div className="bg-amber-50/50 border border-amber-200 rounded-xl p-4 flex items-start gap-2.5 animate-fade-in shadow-3xs">
                                <Info className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                                <div className="text-xs">
                                  <span className="font-bold text-amber-900 block">Merged Duplicate Report</span>
                                  <span className="text-zinc-600 font-sans block mt-0.5">
                                    This issue has been community-flagged and merged as a duplicate of report{' '}
                                    <button
                                      onClick={() => {
                                        const parent = issues.find((i) => i.id === selectedIssue.duplicateOfId);
                                        if (parent) setSelectedIssue(parent);
                                      }}
                                      className="underline font-bold text-amber-800 hover:text-amber-950 font-mono"
                                    >
                                      {selectedIssue.duplicateOfId}
                                    </button>
                                    . Community monitoring upvotes and verifications are redirected to the master ticket.
                                  </span>
                                </div>
                              </div>
                            )}

                            {/* Photo Evidence */}
                            {selectedIssue.imageUrl && (
                              <div className="relative w-full h-64 rounded-xl overflow-hidden border border-zinc-200 bg-zinc-100 shadow-inner">
                                <img
                                  src={selectedIssue.imageUrl}
                                  alt={selectedIssue.title}
                                  className="w-full h-full object-cover"
                                  referrerPolicy="no-referrer"
                                />
                                <div className="absolute bottom-3 left-3 bg-white/90 border border-zinc-200 px-2.5 py-1 rounded-lg text-[10px] font-mono text-zinc-700 shadow-xs">
                                  Citizen Evidence Upload
                                </div>
                              </div>
                            )}

                            {/* Description & Metadata */}
                            <div className="flex flex-col gap-3">
                              <p className="text-xs text-zinc-600 leading-relaxed font-sans">
                                {selectedIssue.description}
                              </p>

                              <div className="grid grid-cols-2 gap-4 mt-2 border-t border-b border-zinc-100 py-3.5">
                                <div>
                                  <span className="text-[9px] font-mono uppercase text-zinc-400 font-bold">Physical Address</span>
                                  <div className="text-xs text-zinc-800 font-semibold flex items-center gap-1.5 mt-0.5">
                                    <MapPin className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
                                    <span>{selectedIssue.address}</span>
                                  </div>
                                </div>
                                <div>
                                  <span className="text-[9px] font-mono uppercase text-zinc-400 font-bold">Resolution SLA Target</span>
                                  <div className="text-xs text-zinc-800 font-semibold flex items-center gap-1.5 mt-0.5">
                                    <Calendar className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
                                    <span>
                                      {selectedIssue.aiAnalysis
                                        ? `${selectedIssue.aiAnalysis.estimatedResolutionDays} Days`
                                        : 'Under review'}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Printable Dispatch Work Order Card */}
                            {selectedIssue.workOrder && (
                              <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-5 mt-1 flex flex-col gap-4 animate-fade-in relative overflow-hidden">
                                {/* Top visual border banner to signify formal document */}
                                <div className="absolute top-0 inset-x-0 h-1 bg-zinc-800" />
                                
                                <div className="flex items-center justify-between gap-2 border-b border-zinc-200 pb-2.5 flex-wrap">
                                  <div className="flex items-center gap-2">
                                    <Shield className="h-4 w-4 text-zinc-700 shrink-0" />
                                    <span className="text-xs font-bold text-zinc-900 uppercase tracking-wider font-sans">
                                      Municipal Work Order Dispatch
                                    </span>
                                  </div>
                                  <span className="text-[10px] font-mono font-bold bg-zinc-200 text-zinc-700 px-2 py-0.5 rounded border border-zinc-300 uppercase tracking-wide shrink-0">
                                    Order: {selectedIssue.workOrder.id}
                                  </span>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-sans">
                                  <div>
                                    <span className="text-[9px] font-mono text-zinc-400 font-bold uppercase block">Assigned Service Crew</span>
                                    <span className="font-bold text-zinc-800 mt-0.5 block">{selectedIssue.workOrder.assignedCrew}</span>
                                  </div>
                                  <div>
                                    <span className="text-[9px] font-mono text-zinc-400 font-bold uppercase block">Scheduled Target Date</span>
                                    <span className="font-bold text-zinc-800 mt-0.5 block">{selectedIssue.workOrder.scheduledDate}</span>
                                  </div>
                                  <div className="sm:col-span-2">
                                    <span className="text-[9px] font-mono text-zinc-400 font-bold uppercase block">Allocated Materials & Gear</span>
                                    <span className="font-medium text-zinc-700 mt-0.5 block">{selectedIssue.workOrder.materialsNeeded}</span>
                                  </div>
                                  <div className="sm:col-span-2">
                                    <span className="text-[9px] font-mono text-zinc-400 font-bold uppercase block">Special Field Instructions</span>
                                    <p className="text-zinc-600 mt-1 leading-relaxed bg-white border border-zinc-150 p-2.5 rounded-lg font-sans">
                                      {selectedIssue.workOrder.instructions}
                                    </p>
                                  </div>
                                </div>

                                <div className="flex items-center justify-between mt-1 text-[9px] text-zinc-400 font-mono border-t border-zinc-150 pt-2.5 flex-wrap gap-2">
                                  <span>DISPATCHED AT: {new Date(selectedIssue.workOrder.dispatchedAt).toLocaleString()}</span>
                                  <button
                                    onClick={() => window.print()}
                                    className="text-zinc-600 hover:text-zinc-900 hover:underline flex items-center gap-1 font-bold uppercase"
                                  >
                                    Print Work Order
                                  </button>
                                </div>
                              </div>
                            )}

                            {/* Citizen quick interaction row */}
                            <div className="flex items-center gap-3">
                              <button
                                onClick={() => handleUpvote(selectedIssue.id)}
                                className={`flex-1 py-3 border rounded-xl text-xs font-bold tracking-wider uppercase transition-all duration-300 flex items-center justify-center gap-2 ${
                                  selectedIssue.votedEmails.includes(userEmail.toLowerCase().trim())
                                    ? 'bg-zinc-900 text-white border-zinc-900 shadow-xs'
                                    : 'bg-white text-zinc-700 border-zinc-200 hover:bg-zinc-50 hover:border-zinc-350'
                                }`}
                              >
                                <ThumbsUp className="h-4 w-4 shrink-0" />
                                <span>UPVOTE ({selectedIssue.upvotes})</span>
                              </button>

                              <button
                                onClick={() => handleVerify(selectedIssue.id)}
                                className={`flex-1 py-3 border rounded-xl text-xs font-bold tracking-wider uppercase transition-all duration-300 flex items-center justify-center gap-2 ${
                                  selectedIssue.verifiedEmails.includes(userEmail.toLowerCase().trim())
                                    ? 'bg-emerald-600 text-white border-emerald-600 font-bold shadow-xs'
                                    : 'bg-white text-zinc-700 border-zinc-200 hover:bg-zinc-50 hover:border-zinc-350 hover:text-emerald-700'
                                }`}
                              >
                                <CheckCircle className="h-4 w-4 shrink-0" />
                                <span>Verify Ground Truth ({selectedIssue.verifiedCount})</span>
                              </button>
                            </div>

                            {/* Citizen Action Receipt Generator Option */}
                            <div className="flex flex-col gap-3">
                              <button
                                onClick={() => setShowReceipt(!showReceipt)}
                                className="w-full py-2.5 border border-dashed border-zinc-300 hover:border-zinc-500 rounded-xl text-xs font-mono font-bold tracking-wider uppercase transition-all duration-300 flex items-center justify-center gap-2 text-zinc-500 hover:text-zinc-800 hover:bg-zinc-50 bg-transparent"
                              >
                                <FileText className="h-4 w-4 shrink-0 text-zinc-400" />
                                <span>{showReceipt ? 'Hide Citizen Filing Receipt' : 'Generate Certified Citizen Receipt'}</span>
                              </button>

                              {showReceipt && (
                                <div className="bg-white border-2 border-zinc-900 rounded-xl p-5 mt-1 flex flex-col gap-4 animate-fade-in relative overflow-hidden font-mono shadow-xs">
                                  {/* Decorative Stamp Circle */}
                                  <div className="absolute right-4 top-4 border-2 border-zinc-900 rounded-full w-14 h-14 flex items-center justify-center text-[8px] font-bold text-zinc-900 border-dashed opacity-25 uppercase rotate-12 select-none pointer-events-none">
                                    Certified
                                  </div>

                                  <div className="flex items-center justify-between gap-2 border-b-2 border-zinc-900 pb-3 flex-wrap">
                                    <div className="flex flex-col">
                                      <span className="text-xs font-bold text-zinc-900 uppercase tracking-widest font-sans">
                                        COMMUNITY CITIZEN RECEIPT
                                      </span>
                                      <span className="text-[9px] text-zinc-400 mt-0.5">
                                        CLEANITY INFRASTRUCTURE LEDGER
                                      </span>
                                    </div>
                                    <span className="text-[10px] font-bold bg-zinc-900 text-white px-2 py-0.5 rounded uppercase tracking-wide shrink-0">
                                      REC-{selectedIssue.id.toUpperCase()}
                                    </span>
                                  </div>

                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-[11px] text-zinc-700">
                                    <div>
                                      <span className="text-[8px] text-zinc-400 font-bold uppercase block">CASE REPORTER</span>
                                      <span className="font-bold text-zinc-900 mt-0.5 block">{userName}</span>
                                    </div>
                                    <div>
                                      <span className="text-[8px] text-zinc-400 font-bold uppercase block">SUBMISSION DATE</span>
                                      <span className="font-bold text-zinc-900 mt-0.5 block">{new Date(selectedIssue.createdAt).toLocaleString()}</span>
                                    </div>
                                    <div className="sm:col-span-2">
                                      <span className="text-[8px] text-zinc-400 font-bold uppercase block">INCIDENT DESCRIPTION</span>
                                      <span className="font-medium text-zinc-800 mt-0.5 block italic">"{selectedIssue.title}"</span>
                                    </div>
                                    <div>
                                      <span className="text-[8px] text-zinc-400 font-bold uppercase block">MUNICIPAL ZONE GPS</span>
                                      <span className="font-mono text-zinc-900 mt-0.5 block">
                                        {typeof selectedIssue.latitude === 'number' && !isNaN(selectedIssue.latitude) ? selectedIssue.latitude.toFixed(5) : '0.00000'}°N,{' '}
                                        {typeof selectedIssue.longitude === 'number' && !isNaN(selectedIssue.longitude) ? selectedIssue.longitude.toFixed(5) : '0.00000'}°E
                                      </span>
                                    </div>
                                    <div>
                                      <span className="text-[8px] text-zinc-400 font-bold uppercase block">STREET ADDRESS</span>
                                      <span className="font-medium text-zinc-800 mt-0.5 block truncate">{selectedIssue.address}</span>
                                    </div>
                                  </div>

                                  {/* Beautiful Procedural CSS Barcode */}
                                  <div className="border-t border-zinc-200 pt-3.5 flex flex-col items-center justify-center gap-1.5 bg-zinc-50 rounded-lg p-3">
                                    <div className="flex gap-[2px] items-stretch h-9 select-none opacity-85">
                                      {[1, 3, 1, 2, 4, 1, 3, 2, 1, 4, 2, 1, 3, 1, 2, 4, 1, 2, 3, 1, 4, 1, 3, 2].map((w, idx) => (
                                        <div
                                          key={idx}
                                          className="bg-zinc-900"
                                          style={{ width: `${w}px` }}
                                        />
                                      ))}
                                    </div>
                                    <span className="text-[8px] text-zinc-500 font-mono tracking-widest uppercase">
                                      *SLA-{selectedIssue.id.toUpperCase()}-{selectedIssue.category.toUpperCase()}*
                                    </span>
                                  </div>

                                  <div className="flex items-center justify-between mt-1 text-[9px] text-zinc-400 border-t-2 border-dashed border-zinc-200 pt-3 flex-wrap gap-2">
                                    <span>COMMUNITY CO-SIGNED VERIFIED ({selectedIssue.verifiedCount})</span>
                                    <button
                                      onClick={() => window.print()}
                                      className="text-zinc-900 hover:text-zinc-700 font-bold uppercase flex items-center gap-1.5"
                                    >
                                      <Printer className="h-3 w-3 shrink-0" />
                                      Print Certificate
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* Citizen Moderation Duplicate Flagging */}
                            {!selectedIssue.duplicateOfId && selectedIssue.status !== 'resolved' && (
                              <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-4.5 flex flex-col gap-3">
                                <div className="flex items-center gap-2">
                                  <Sliders className="h-4 w-4 text-zinc-500 shrink-0" />
                                  <span className="text-xs font-bold text-zinc-700 font-sans uppercase tracking-wide">
                                    Community Duplicate Moderation
                                  </span>
                                </div>
                                <p className="text-[11px] text-zinc-500 font-sans leading-relaxed">
                                  Is this defect duplicate with another active ticket? Merge it to link upvotes and verifications to the master ticket and earn 15 XP.
                                </p>

                                <form onSubmit={handleMarkAsDuplicate} className="flex gap-2.5 items-end flex-wrap sm:flex-nowrap">
                                  <div className="flex-1 w-full flex flex-col gap-1">
                                    <select
                                      value={selectedDuplicateOfId}
                                      onChange={(e) => setSelectedDuplicateOfId(e.target.value)}
                                      className="w-full bg-white border border-zinc-200 rounded-lg px-2.5 py-2 text-xs text-zinc-700 focus:outline-none focus:ring-1 focus:ring-amber-500 font-sans"
                                    >
                                      <option value="">-- Choose Master Ticket of Same Category --</option>
                                      {issues
                                        .filter(
                                          (i) =>
                                            i.id !== selectedIssue.id &&
                                            i.category === selectedIssue.category &&
                                            !i.duplicateOfId &&
                                            i.status !== 'resolved'
                                        )
                                        .map((i) => (
                                          <option key={i.id} value={i.id}>
                                            {i.title} ({i.address})
                                          </option>
                                        ))}
                                    </select>
                                  </div>
                                  <button
                                    type="submit"
                                    disabled={isDuplicateSubmitting || !selectedDuplicateOfId}
                                    className={`px-4 py-2 rounded-lg text-xs font-bold uppercase transition-all shrink-0 w-full sm:w-auto ${
                                      !selectedDuplicateOfId
                                        ? 'bg-zinc-200 text-zinc-400 border border-zinc-200 cursor-not-allowed'
                                        : 'bg-zinc-900 text-white hover:bg-zinc-800 border border-zinc-900 shadow-xs'
                                    }`}
                                  >
                                    {isDuplicateSubmitting ? 'Flagging...' : 'Merge Ticket'}
                                  </button>
                                </form>
                              </div>
                            )}

                            {/* Official Staff Dispatch Control Area */}
                            {isOfficialMode && (
                              <div className="bg-amber-50/50 border border-amber-200 rounded-xl p-4.5 mt-2 flex flex-col gap-4 animate-fade-in">
                                <div className="flex items-center gap-2">
                                  <Building className="h-4 w-4 text-amber-600" />
                                  <span className="text-xs font-bold text-amber-900 font-sans uppercase tracking-wide">
                                    Staff Dispatch Dashboard (Official)
                                  </span>
                                </div>

                                <form onSubmit={handleOfficialStatusChange} className="flex flex-col gap-3">
                                  <div className="grid grid-cols-2 gap-3">
                                    <div className="flex flex-col gap-1">
                                      <label className="text-[9px] font-mono uppercase text-zinc-500 font-bold">Transition Status</label>
                                      <select
                                        value={officialStatus}
                                        onChange={(e) => setOfficialStatus(e.target.value as IssueStatus)}
                                        className="bg-white border border-zinc-200 rounded-lg px-2.5 py-1.5 text-xs text-zinc-700 focus:outline-none focus:ring-1 focus:ring-amber-500 font-sans"
                                      >
                                        <option value="under_review">Under Review</option>
                                        <option value="scheduled">Scheduled Work</option>
                                        <option value="in_progress">In Progress</option>
                                        <option value="resolved">Resolved & Closed</option>
                                      </select>
                                    </div>
                                  </div>

                                  {/* Work Order Generator Fields */}
                                  {(officialStatus === 'scheduled' || officialStatus === 'in_progress') && (
                                    <div className="bg-white border border-zinc-200 rounded-lg p-3.5 flex flex-col gap-3 shadow-3xs animate-fade-in">
                                      <div className="flex items-center gap-1.5 border-b border-zinc-150 pb-1.5">
                                        <Shield className="h-3.5 w-3.5 text-zinc-600" />
                                        <span className="text-[10px] font-mono uppercase font-bold text-zinc-700">Work Order dispatch slip creator</span>
                                      </div>
                                      
                                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <div className="flex flex-col gap-1">
                                          <label className="text-[9px] font-mono uppercase text-zinc-400 font-semibold">Assigned Maintenance Crew</label>
                                          <select
                                            value={assignedCrew}
                                            onChange={(e) => setAssignedCrew(e.target.value)}
                                            required
                                            className="bg-zinc-50 border border-zinc-200 rounded-md px-2 py-1 text-xs text-zinc-700 focus:outline-none focus:ring-1 focus:ring-amber-500 font-sans"
                                          >
                                            <option value="">-- Choose Crew --</option>
                                            <option value="Crew Alpha: Asphalt Patching">Crew Alpha (Asphalt Patching)</option>
                                            <option value="Crew Beta: Water Mains & Hydrants">Crew Beta (Water Mains & Hydrants)</option>
                                            <option value="Crew Gamma: Electrical & Streetlight Division">Crew Gamma (Electrical & Streetlights)</option>
                                            <option value="Crew Delta: Sanitation & Heavy Waste Loaders">Crew Delta (Heavy Waste Loaders)</option>
                                          </select>
                                        </div>

                                        <div className="flex flex-col gap-1">
                                          <label className="text-[9px] font-mono uppercase text-zinc-400 font-semibold">Scheduled Date</label>
                                          <input
                                            type="date"
                                            value={scheduledDate}
                                            onChange={(e) => setScheduledDate(e.target.value)}
                                            required
                                            className="bg-zinc-50 border border-zinc-200 rounded-md px-2 py-1 text-xs text-zinc-700 focus:outline-none font-sans"
                                          />
                                        </div>

                                        <div className="col-span-1 sm:col-span-2 flex flex-col gap-1">
                                          <label className="text-[9px] font-mono uppercase text-zinc-400 font-semibold">Allocated Materials & Gear</label>
                                          <input
                                            type="text"
                                            value={materialsNeeded}
                                            onChange={(e) => setMaterialsNeeded(e.target.value)}
                                            required
                                            placeholder="e.g. 5 tons binder course, diesel tamper, traffic cones"
                                            className="bg-zinc-50 border border-zinc-200 rounded-md px-2.5 py-1 text-xs text-zinc-700 focus:outline-none font-sans"
                                          />
                                        </div>

                                        <div className="col-span-1 sm:col-span-2 flex flex-col gap-1">
                                          <label className="text-[9px] font-mono uppercase text-zinc-400 font-semibold">Special Crew Instructions</label>
                                          <textarea
                                            value={workInstructions}
                                            onChange={(e) => setWorkInstructions(e.target.value)}
                                            required
                                            rows={2}
                                            placeholder="Define safety instructions, detour directions, or special equipment specs..."
                                            className="bg-zinc-50 border border-zinc-200 rounded-md px-2.5 py-1 text-xs text-zinc-700 focus:outline-none font-sans"
                                          />
                                        </div>
                                      </div>
                                    </div>
                                  )}

                                  <div className="flex flex-col gap-1">
                                    <label className="text-[9px] font-mono uppercase text-zinc-500 font-bold">Official Log Entry</label>
                                    <input
                                      type="text"
                                      required
                                      placeholder="e.g. Dispatched roads division patch team; closing case..."
                                      value={officialLog}
                                      onChange={(e) => setOfficialLog(e.target.value)}
                                      className="bg-white border border-zinc-200 rounded-lg px-3 py-2 text-xs text-zinc-700 placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-amber-500 font-sans"
                                    />
                                  </div>

                                  <button
                                    type="submit"
                                    disabled={isStatusSubmitting || !officialLog.trim()}
                                    className="bg-amber-500 hover:bg-amber-600 text-zinc-950 transition-all py-2 rounded-lg font-bold text-xs uppercase tracking-wide flex items-center justify-center gap-1 shadow-xs font-semibold"
                                  >
                                    {isStatusSubmitting ? (
                                      <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                                    ) : (
                                      'Submit Log & Transition Status'
                                    )}
                                  </button>
                                </form>
                              </div>
                            )}

                            {/* Progressive SLA Resolution Roadmap & Audit Logs (Human Crafted) */}
                            <div className="flex flex-col gap-4 mt-2 border-t border-zinc-100 pt-5">
                              <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 block font-bold">
                                SLA Resolution Roadmap
                              </span>
                              
                              <div className="grid grid-cols-5 gap-1.5 sm:gap-2 text-center select-none relative z-0 mb-2">
                                {[
                                  { statusKey: 'reported', label: 'Reported' },
                                  { statusKey: 'under_review', label: 'In Review' },
                                  { statusKey: 'scheduled', label: 'Scheduled' },
                                  { statusKey: 'in_progress', label: 'Active Work' },
                                  { statusKey: 'resolved', label: 'Resolved' },
                                ].map((step, idx) => {
                                  const stepsOrder = ['reported', 'under_review', 'scheduled', 'in_progress', 'resolved'];
                                  const currentIdx = stepsOrder.indexOf(selectedIssue.status);
                                  const stepIdx = stepsOrder.indexOf(step.statusKey as any);
                                  const isCompleted = stepIdx < currentIdx;
                                  const isActive = stepIdx === currentIdx;
                                  
                                  return (
                                    <div key={step.statusKey} className="flex flex-col items-center gap-1.5 relative">
                                      <div className={`w-7 h-7 rounded-full border flex items-center justify-center text-[10px] font-bold transition-all relative z-10 ${
                                        isCompleted
                                          ? 'bg-zinc-900 border-zinc-900 text-white'
                                          : isActive
                                          ? 'bg-amber-500 border-amber-500 text-zinc-950 font-black shadow-xs scale-105'
                                          : 'bg-zinc-50 border-zinc-200 text-zinc-400'
                                      }`}>
                                        {isCompleted ? (
                                          <Check className="h-3.5 w-3.5" />
                                        ) : (
                                          <span>{idx + 1}</span>
                                        )}
                                        {/* Connecting horizontal line divider */}
                                        {idx < 4 && (
                                          <div className={`absolute left-[28px] w-[110%] sm:w-[150%] md:w-[220%] h-[2px] top-[13px] -z-10 transition-colors ${
                                            stepIdx < currentIdx
                                              ? 'bg-zinc-900'
                                              : 'bg-zinc-200'
                                          }`} />
                                        )}
                                      </div>
                                      <span className={`text-[9px] font-sans font-bold tracking-tight truncate w-full ${
                                        isActive
                                          ? 'text-zinc-900 font-extrabold'
                                          : isCompleted
                                          ? 'text-zinc-700'
                                          : 'text-zinc-400'
                                      }`}>
                                        {step.label}
                                      </span>
                                    </div>
                                  );
                                })}
                              </div>

                              <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 block font-bold mt-2">
                                Official Dispatch Audit Logs
                              </span>
                              
                              <div className="flex flex-col gap-4 pl-3.5 border-l-2 border-zinc-200">
                                {selectedIssue.updates.map((log) => {
                                  const badge = getStatusBadge(log.status);
                                  return (
                                    <div key={log.id} className="relative pl-4">
                                      {/* Timeline Indicator dot */}
                                      <span className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-zinc-400 border-2 border-white ring-4 ring-zinc-50" />
                                      <div className="flex items-center gap-2 flex-wrap">
                                        <span className={`text-[8px] font-mono font-bold px-1.5 py-0.2 rounded border ${badge.bg}`}>
                                          {badge.label}
                                        </span>
                                        <span className="text-[10px] font-bold text-zinc-800 font-sans">
                                          By {log.author}
                                        </span>
                                      </div>
                                      <p className="text-xs text-zinc-500 mt-1">{log.description}</p>
                                      <span className="text-[9px] text-zinc-400 font-mono mt-0.5 block">
                                        {new Date(log.createdAt).toLocaleString()}
                                      </span>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>

                            {/* Interactive Comments Section */}
                            <div className="border-t border-zinc-100 pt-5 flex flex-col gap-4">
                              <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 block font-bold">
                                Citizen Dispatches & Support
                              </span>

                              {selectedIssue.comments.length === 0 ? (
                                <p className="text-xs text-zinc-400 italic">No community dispatches on this report yet.</p>
                              ) : (
                                <div className="flex flex-col gap-3">
                                  {selectedIssue.comments.map((comment) => (
                                    <div
                                      key={comment.id}
                                      className={`border rounded-xl p-3.5 ${
                                        comment.isMunicipalOfficial
                                          ? 'bg-amber-50/30 border-amber-200'
                                          : 'bg-zinc-50/50 border-zinc-150'
                                      }`}
                                    >
                                      <div className="flex items-center justify-between gap-2 mb-1">
                                        <span className="text-[10.5px] font-bold text-zinc-800 flex items-center gap-1.5">
                                          {comment.isMunicipalOfficial ? (
                                            <>
                                              <Building className="h-3 w-3 text-amber-600" />
                                              <span className="text-amber-800">{comment.author}</span>
                                            </>
                                          ) : (
                                            <>
                                              <User className="h-3 w-3 text-zinc-400" />
                                              <span>{comment.author}</span>
                                            </>
                                          )}
                                        </span>
                                        {comment.isMunicipalOfficial && (
                                          <span className="text-[8px] bg-amber-100 text-amber-800 font-bold px-1.5 py-0.2 rounded border border-amber-200/50 uppercase tracking-wider">
                                            Official Staff
                                          </span>
                                        )}
                                      </div>
                                      <p className="text-xs text-zinc-600 font-sans leading-relaxed mt-0.5">
                                        {formatCommentContent(comment.content)}
                                      </p>
                                      <span className="text-[9px] text-zinc-400 font-mono mt-1.5 block">
                                        {new Date(comment.createdAt).toLocaleString()}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              )}

                              {/* Comment Input */}
                              <form onSubmit={handlePostComment} className="flex gap-2.5 mt-1">
                                <input
                                  type="text"
                                  required
                                  placeholder="Type a helpful comment or coordinates update..."
                                  value={commentText}
                                  onChange={(e) => setCommentText(e.target.value)}
                                  className="flex-1 bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2 text-xs text-zinc-800 placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500 font-sans"
                                />
                                <button
                                  type="submit"
                                  disabled={isCommentSubmitting || !commentText.trim()}
                                  className="bg-zinc-900 text-white hover:bg-zinc-800 border border-zinc-900 rounded-xl px-4 py-2 text-xs font-bold transition-all shadow-xs shrink-0 flex items-center justify-center font-semibold"
                                >
                                  Send
                                </button>
                              </form>
                            </div>

                          </div>
                        ) : activeView === 'file' ? (
                          
                          /* SCENARIO 2: File a New Report Form */
                          <FileHazardForm
                            selectedCoords={selectedCoords}
                            onSubmit={handleReportSubmit}
                            isSubmitting={false}
                            onCancel={() => {
                              setSelectedCoords(null);
                              setActiveView('grid');
                            }}
                            existingIssues={issues}
                            onSelectNearbyIssue={(issue) => {
                              setSelectedIssue(issue);
                              setActiveView('grid');
                            }}
                          />
                        ) : activeView === 'insights' ? (
                          
                          /* SCENARIO 2.1: Insights & Analytics Dashboard */
                          <div className="flex flex-col gap-6">
                            
                            {/* Dashboard Header */}
                            <div className="bg-white/60 backdrop-blur-md border border-zinc-200/50 rounded-2xl p-5 shadow-[0_8px_32px_0_rgba(0,0,0,0.03)] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                              <div>
                                <h3 className="text-base font-display font-extrabold text-zinc-900 tracking-tight flex items-center gap-2">
                                  <BarChart2 className="h-5 w-5 text-zinc-800" />
                                  City Grid Insights: {cityName}
                                </h3>
                                <p className="text-xs text-zinc-500 mt-1 font-sans">
                                  Live analytics tracking local infrastructure defects, priorities, and resolution progress.
                                </p>
                              </div>

                              <button
                                onClick={() => {
                                  // Export CSV Dispatch Sheet
                                  const headers = ['ID', 'Title', 'Category', 'Priority', 'Status', 'Address', 'Latitude', 'Longitude', 'Upvotes', 'Reports Count', 'Created At'];
                                  const rows = issues.map(i => [
                                    i.id,
                                    `"${i.title.replace(/"/g, '""')}"`,
                                    i.category,
                                    i.priority,
                                    i.status,
                                    `"${i.address.replace(/"/g, '""')}"`,
                                    i.latitude,
                                    i.longitude,
                                    i.upvotes,
                                    i.comments.length,
                                    new Date(i.createdAt).toISOString()
                                  ]);
                                  const csvContent = "data:text/csv;charset=utf-8," 
                                    + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
                                  const encodedUri = encodeURI(csvContent);
                                  const link = document.createElement("a");
                                  link.setAttribute("href", encodedUri);
                                  link.setAttribute("download", `cleanity_dispatch_sheet_${cityName.toLowerCase().replace(/\s+/g, '_')}.csv`);
                                  document.body.appendChild(link);
                                  link.click();
                                  document.body.removeChild(link);
                                }}
                                className="bg-zinc-950 hover:bg-zinc-800 text-white border border-zinc-900 text-xs font-mono font-bold px-4 py-2.5 rounded-xl transition-all shadow-xs shrink-0 flex items-center justify-center gap-2"
                              >
                                <Download className="h-4 w-4" />
                                Export CSV Dispatch Sheet
                              </button>
                            </div>

                            {/* Charts Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                              
                              {/* Category breakdown */}
                              <div className="bg-white/60 backdrop-blur-md border border-zinc-200/50 rounded-2xl p-5 shadow-[0_8px_32px_0_rgba(0,0,0,0.03)] flex flex-col">
                                <span className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-wider block mb-4">
                                  Defects by Infrastructure Category
                                </span>
                                <div className="h-56 w-full font-sans text-xs">
                                  <ResponsiveContainer width="100%" height="100%">
                                    <BarChart
                                      data={Object.entries(
                                        issues.reduce((acc, issue) => {
                                          acc[issue.category] = (acc[issue.category] || 0) + 1;
                                          return acc;
                                        }, {} as Record<string, number>)
                                      ).map(([cat, count]) => {
                                        const labels: Record<string, string> = {
                                          pothole: 'Potholes',
                                          water_leak: 'Water Leaks',
                                          broken_streetlight: 'Streetlights',
                                          waste_management: 'Waste',
                                          public_infrastructure: 'Sidewalks',
                                          other: 'Other'
                                        };
                                        return { name: labels[cat] || cat, Count: count };
                                      })}
                                      margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                                    >
                                      <XAxis dataKey="name" stroke="#a1a1aa" fontSize={10} tickLine={false} />
                                      <YAxis stroke="#a1a1aa" fontSize={10} tickLine={false} allowDecimals={false} />
                                      <RechartsTooltip cursor={{ fill: '#f4f4f5' }} />
                                      <Bar dataKey="Count" fill="#18181b" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                  </ResponsiveContainer>
                                </div>
                              </div>

                              {/* SLA Status pie breakdown */}
                              <div className="bg-white/60 backdrop-blur-md border border-zinc-200/50 rounded-2xl p-5 shadow-[0_8px_32px_0_rgba(0,0,0,0.03)] flex flex-col">
                                <span className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-wider block mb-4">
                                  SLA Resolution Progress
                                </span>
                                <div className="h-56 w-full font-sans text-xs flex flex-col sm:flex-row items-center justify-between gap-2">
                                  <div className="h-44 w-44 shrink-0">
                                    <ResponsiveContainer width="100%" height="100%">
                                      <PieChart>
                                        <Pie
                                          data={Object.entries(
                                            issues.reduce((acc, issue) => {
                                              acc[issue.status] = (acc[issue.status] || 0) + 1;
                                              return acc;
                                            }, {} as Record<string, number>)
                                          ).map(([stat, count]) => {
                                            const labels: Record<string, string> = {
                                              reported: 'Reported',
                                              under_review: 'Under Review',
                                              scheduled: 'Scheduled',
                                              in_progress: 'In Progress',
                                              resolved: 'Resolved'
                                            };
                                            const colors: Record<string, string> = {
                                              reported: '#ef4444',
                                              under_review: '#f59e0b',
                                              scheduled: '#3b82f6',
                                              in_progress: '#8b5cf6',
                                              resolved: '#10b981'
                                            };
                                            return {
                                              name: labels[stat] || stat,
                                              value: count,
                                              color: colors[stat] || '#71717a'
                                            };
                                          })}
                                          cx="50%"
                                          cy="50%"
                                          innerRadius={45}
                                          outerRadius={65}
                                          paddingAngle={3}
                                          dataKey="value"
                                        >
                                          {Object.entries(
                                            issues.reduce((acc, i) => {
                                              acc[i.status] = (acc[i.status] || 0) + 1;
                                              return acc;
                                            }, {} as Record<string, number>)
                                          ).map(([stat, count], idx) => {
                                            const colors: Record<string, string> = {
                                              reported: '#ef4444',
                                              under_review: '#f59e0b',
                                              scheduled: '#3b82f6',
                                              in_progress: '#8b5cf6',
                                              resolved: '#10b981'
                                            };
                                            return <Cell key={`cell-${idx}`} fill={colors[stat] || '#71717a'} />;
                                          })}
                                        </Pie>
                                      </PieChart>
                                    </ResponsiveContainer>
                                  </div>
                                  <div className="flex flex-col gap-1.5 w-full">
                                    {Object.entries(
                                      issues.reduce((acc, issue) => {
                                        acc[issue.status] = (acc[issue.status] || 0) + 1;
                                        return acc;
                                      }, {} as Record<string, number>)
                                    ).map(([stat, count]) => {
                                      const labels: Record<string, string> = {
                                        reported: 'Reported',
                                        under_review: 'Under Review',
                                        scheduled: 'Scheduled',
                                        in_progress: 'In Progress',
                                        resolved: 'Resolved'
                                      };
                                      const colors: Record<string, string> = {
                                        reported: '#ef4444',
                                        under_review: '#f59e0b',
                                        scheduled: '#3b82f6',
                                        in_progress: '#8b5cf6',
                                        resolved: '#10b981'
                                      };
                                      return (
                                        <div key={stat} className="flex items-center justify-between text-[11px]">
                                          <div className="flex items-center gap-1.5">
                                            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: colors[stat] || '#71717a' }} />
                                            <span className="text-zinc-600 font-medium">{labels[stat]}</span>
                                          </div>
                                          <span className="font-bold text-zinc-900">{count}</span>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              </div>

                            </div>

                            {/* Detailed List Metrics summary card */}
                            <div className="bg-zinc-50 border border-zinc-200/60 rounded-2xl p-5 flex items-start gap-3.5 shadow-2xs">
                              <TrendingUp className="h-5 w-5 text-zinc-800 shrink-0 mt-0.5" />
                              <div className="text-xs text-zinc-600 leading-normal">
                                <h4 className="font-bold text-zinc-900 mb-1">Grid Operational Performance</h4>
                                <p>
                                  Currently tracking {issues.length} municipal hazards in the database. Active resolution rate stands at{' '}
                                  <span className="font-bold text-zinc-900">
                                    {issues.length > 0
                                      ? Math.round((issues.filter((i) => i.status === 'resolved').length / issues.length) * 100)
                                      : 0}
                                    %
                                  </span>{' '}
                                  with an average triage response cycle of under 24 hours. Keep upvoting active threats to alert field dispatch.
                                </p>
                              </div>
                            </div>

                          </div>
                        ) : activeView === 'leaderboard' ? (
                          
                          /* SCENARIO 2.2: Local Heroes Leaderboard */
                          <div className="flex flex-col gap-6">
                            
                            {/* Onboarding User Position summary */}
                            <div className="bg-zinc-950/80 backdrop-blur-md border border-zinc-900 rounded-2xl p-5 text-white flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shadow-sm">
                              <div>
                                <div className="flex items-center gap-2">
                                  <Award className="h-5 w-5 text-amber-400" />
                                  <span className="text-xs font-mono font-bold tracking-wider uppercase text-zinc-400">Your Contributor Profile</span>
                                </div>
                                <h3 className="text-lg font-display font-black tracking-tight mt-1.5">
                                  {profile?.name || 'Local Resident'}
                                </h3>
                                <p className="text-xs text-zinc-400 font-sans mt-0.5">
                                  Earn contribution points by reporting infrastructure hazards, validating existing reports, and logging resolved status updates.
                                </p>
                              </div>

                              <div className="flex items-center gap-5 sm:border-l sm:border-zinc-800 sm:pl-6 shrink-0">
                                <div>
                                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-500 block">Current Rank</span>
                                  <span className="text-xl font-display font-black text-amber-400 block mt-0.5">
                                    #{leaderboard.findIndex(p => p.email === userEmail) !== -1 ? leaderboard.findIndex(p => p.email === userEmail) + 1 : '—'}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-500 block">Trust Score</span>
                                  <span className="text-xl font-display font-black text-white block mt-0.5">
                                    {profile?.xp || 0} <span className="text-[11px] font-medium text-zinc-500">pts</span>
                                  </span>
                                </div>
                                <div>
                                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-500 block">Contributor Level</span>
                                  <span className="text-xl font-display font-black text-white block mt-0.5">
                                    Lv. {profile?.level || 1}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Leaderboard list */}
                            <div className="bg-white/60 backdrop-blur-md border border-zinc-200/50 rounded-2xl p-5 shadow-[0_8px_32px_0_rgba(0,0,0,0.03)] flex flex-col gap-4">
                              <div className="border-b border-zinc-150 pb-3">
                                <h3 className="font-display font-bold text-zinc-900 text-sm tracking-tight flex items-center gap-2">
                                  <Trophy className="h-4.5 w-4.5 text-zinc-700" />
                                  Top Neighborhood Contributors
                                </h3>
                                <p className="text-[11px] text-zinc-500 font-sans mt-0.5">
                                  Citizen dispatch coordinators ranked by their infrastructure support contributions.
                                </p>
                              </div>

                              {loadingLeaderboard ? (
                                <div className="flex items-center justify-center py-12 text-zinc-400 gap-2">
                                  <RefreshCw className="h-4 w-4 animate-spin" />
                                  <span className="text-xs font-mono uppercase">Retrieving heroes...</span>
                                </div>
                              ) : (
                                <div className="flex flex-col gap-2.5">
                                  {leaderboard.map((hero, index) => {
                                    const isSelf = hero.email === userEmail;
                                    const rankColor = index === 0 ? 'text-amber-500 font-black' : index === 1 ? 'text-zinc-500 font-bold' : index === 2 ? 'text-amber-700 font-medium' : 'text-zinc-400';
                                    const rankSymbol = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`;
                                    
                                    const badgeLabels: Record<string, { label: string; style: string }> = {
                                      'newbie': { label: 'New Recruit', style: 'bg-zinc-100 text-zinc-700 border-zinc-200' },
                                      'first-report': { label: 'Hazard Spotter', style: 'bg-amber-50 text-amber-800 border-amber-200' },
                                      'voter-badge': { label: 'Community Supporter', style: 'bg-blue-50 text-blue-800 border-blue-200' },
                                      'verified-citizen': { label: 'Ground Truth Reviewer', style: 'bg-emerald-50 text-emerald-800 border-emerald-200' },
                                      'city-pillar': { label: 'Cleanity Pillar', style: 'bg-purple-50 text-purple-800 border-purple-200' },
                                      'eagle-eye': { label: 'Eagle Eye', style: 'bg-rose-50 text-rose-800 border-rose-200' },
                                      'streak-3': { label: '3-Day Active', style: 'bg-orange-50 text-orange-800 border-orange-200' },
                                    };

                                    return (
                                      <div
                                        key={hero.email}
                                        className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 border rounded-2xl p-3.5 transition-all ${
                                          isSelf
                                            ? 'bg-amber-50/10 border-amber-300/60 shadow-3xs'
                                            : 'bg-white/40 border-zinc-200/30 hover:bg-white/80 hover:border-zinc-300'
                                        }`}
                                      >
                                        <div className="flex items-center gap-3">
                                          <div className={`w-8 h-8 rounded-lg bg-white border border-zinc-200 flex items-center justify-center text-xs ${rankColor}`}>
                                            {rankSymbol}
                                          </div>
                                          <div>
                                            <div className="flex items-center gap-2">
                                              <span className="text-xs font-bold text-zinc-900">{hero.name}</span>
                                              {isSelf && (
                                                <span className="text-[8px] font-mono bg-amber-100 text-amber-800 font-extrabold px-1.5 py-0.2 rounded border border-amber-200/50 uppercase tracking-wider">
                                                  YOU
                                                </span>
                                              )}
                                            </div>
                                            
                                            {/* Badges row */}
                                            <div className="flex flex-wrap gap-1 mt-1.5">
                                              {hero.badges.map((badge) => {
                                                const meta = badgeLabels[badge] || { label: badge, style: 'bg-zinc-100 text-zinc-600 border-zinc-200' };
                                                return (
                                                  <span key={badge} className={`text-[9px] px-2 py-0.5 rounded-md border font-sans font-medium ${meta.style}`}>
                                                    {meta.label}
                                                  </span>
                                                );
                                              })}
                                            </div>
                                          </div>
                                        </div>

                                        <div className="flex items-center gap-6 self-end sm:self-center">
                                          <div className="text-right">
                                            <span className="text-[10px] text-zinc-400 font-mono block">Contributions</span>
                                            <span className="text-xs text-zinc-700 font-medium block mt-0.5">
                                              {hero.reportsCount} Reports / {hero.votesCount} Upvotes
                                            </span>
                                          </div>
                                          <div className="text-right border-l border-zinc-200 pl-4">
                                            <span className="text-[10px] text-zinc-400 font-mono block">Total XP</span>
                                            <span className="text-xs font-bold text-zinc-900 block mt-0.5">
                                              {hero.xp} XP
                                            </span>
                                          </div>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>

                          </div>
                        ) : (
                          
                          /* SCENARIO 3: Active Feed grid list */
                          <div className="flex flex-col gap-4">
                            
                            {/* Search & Categories filtering panel */}
                            <div className="bg-white/60 backdrop-blur-md border border-zinc-200/50 rounded-2xl p-4 flex flex-col sm:flex-row items-center gap-3.5 shadow-[0_8px_32px_0_rgba(0,0,0,0.03)]">
                              <div className="relative flex-1 w-full">
                                <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-zinc-400" />
                                <input
                                  type="text"
                                  placeholder="Search active potholes, leaks, streetlights, or tags..."
                                  value={searchQuery}
                                  onChange={(e) => setSearchQuery(e.target.value)}
                                  className="w-full bg-zinc-50 border border-zinc-200 rounded-lg py-3 pl-10 pr-4 text-xs text-zinc-700 placeholder-zinc-400 font-sans focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500"
                                />
                              </div>

                              <div className="flex flex-col sm:flex-row items-center gap-2.5 w-full sm:w-auto">
                                <div className="flex items-center gap-1.5 w-full sm:w-auto">
                                  <Filter className="h-4 w-4 text-zinc-400 shrink-0" />
                                  <select
                                    value={categoryFilter}
                                    onChange={(e) => setCategoryFilter(e.target.value)}
                                    className="w-full sm:w-auto bg-zinc-50 border border-zinc-200 rounded-lg px-2.5 py-3 text-xs text-zinc-600 font-sans focus:outline-none focus:ring-1 focus:ring-amber-500"
                                  >
                                    <option value="all">All Categories</option>
                                    <option value="pothole">Potholes / Road Damage</option>
                                    <option value="water_leak">Water Leaks</option>
                                    <option value="broken_streetlight">Streetlights</option>
                                    <option value="waste_management">Waste Management</option>
                                    <option value="public_infrastructure">Public Infrastructure</option>
                                    <option value="other">Other</option>
                                  </select>
                                </div>

                                <div className="flex items-center gap-1.5 w-full sm:w-auto border-t sm:border-t-0 sm:border-l border-zinc-200 pt-2 sm:pt-0 sm:pl-2.5">
                                  <Sliders className="h-4 w-4 text-zinc-400 shrink-0" />
                                  <select
                                    value={sortBy}
                                    onChange={(e) => setSortBy(e.target.value as any)}
                                    className="w-full sm:w-auto bg-zinc-50 border border-zinc-200 rounded-lg px-2.5 py-3 text-xs text-zinc-600 font-sans focus:outline-none focus:ring-1 focus:ring-amber-500"
                                  >
                                    <option value="newest">Newest Reports</option>
                                    <option value="priority">Priority / Urgency</option>
                                    <option value="upvotes">Most Upvoted</option>
                                    <option value="verified">Most Verified</option>
                                  </select>
                                </div>
                              </div>
                            </div>

                            {/* Hazards Grid Cards */}
                            {filteredIssues.length === 0 ? (
                              <div className="bg-white/60 backdrop-blur-md border border-zinc-200/50 rounded-2xl p-12 text-center shadow-[0_8px_32px_0_rgba(0,0,0,0.03)]">
                                <Info className="h-6 w-6 text-zinc-300 mx-auto mb-2" />
                                <p className="text-xs text-zinc-400 font-mono uppercase">No reports match your filters</p>
                              </div>
                            ) : (
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {filteredIssues.map((issue) => (
                                  <HazardCard
                                    key={issue.id}
                                    issue={issue}
                                    isSelected={selectedIssue?.id === issue.id}
                                    onSelect={() => setSelectedIssue(issue)}
                                    onUpvote={(e) => {
                                      e.stopPropagation();
                                      handleUpvote(issue.id);
                                    }}
                                    onVerify={(e) => {
                                      e.stopPropagation();
                                      handleVerify(issue.id);
                                    }}
                                  />
                                ))}
                              </div>
                            )}

                          </div>
                        )}

                      </motion.div>
                    </AnimatePresence>

                  </div>

                </div>
              )}

              {/* Floating Mobile View Toggle Button (Yelp/Airbnb research standard) */}
              <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 lg:hidden">
                <button
                  onClick={() => setMobileTab(mobileTab === 'map' ? 'list' : 'map')}
                  className="bg-zinc-900 text-white font-sans font-bold text-xs uppercase tracking-wider px-5 py-3 rounded-full shadow-lg border border-zinc-800 hover:bg-zinc-800 transition-all active:scale-95 flex items-center gap-2"
                >
                  {mobileTab === 'map' ? (
                    <>
                      <List className="h-4 w-4 text-amber-400" />
                      <span>View Feed List</span>
                    </>
                  ) : (
                    <>
                      <Map className="h-4 w-4 text-amber-400" />
                      <span>View Map Pinboard</span>
                    </>
                  )}
                </button>
              </div>

              {/* Mobile Absolute Map Detail Drawer (Airbnb map pin detail research pattern) */}
              {mobileTab === 'map' && selectedIssue && (
                <div className="fixed bottom-20 inset-x-6 z-40 lg:hidden animate-fade-in">
                  <div className="bg-white border-2 border-zinc-900 rounded-2xl p-4.5 shadow-xl flex flex-col gap-3 relative overflow-hidden">
                    {/* Tiny slide indication bar */}
                    <div className="w-10 h-1 bg-zinc-200 rounded-full mx-auto -mt-1 mb-1" />
                    
                    {/* Header bar */}
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[9px] font-mono font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded border border-amber-200/50 uppercase tracking-wide">
                        {selectedIssue.category.replace('_', ' ')}
                      </span>
                      <button
                        onClick={() => setSelectedIssue(null)}
                        className="text-zinc-400 hover:text-zinc-600 p-1"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>

                    {/* Content */}
                    <div>
                      <h4 className="font-display font-extrabold text-xs text-zinc-900 line-clamp-1">
                        {selectedIssue.title}
                      </h4>
                      <p className="text-[10px] text-zinc-500 font-sans mt-0.5 line-clamp-2 leading-relaxed">
                        {selectedIssue.description}
                      </p>
                      
                      <div className="flex items-center gap-1 text-[9px] text-zinc-400 font-mono uppercase tracking-tight mt-2">
                        <MapPin className="h-3 w-3 text-zinc-400 shrink-0" />
                        <span className="truncate">{selectedIssue.address}</span>
                      </div>
                    </div>

                    {/* Ground-Truth Support & Navigation CTA Bar */}
                    <div className="flex items-center gap-2 border-t border-zinc-150 pt-3 mt-1.5 flex-wrap">
                      <button
                        onClick={() => handleUpvote(selectedIssue.id)}
                        className="flex-1 py-2 bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 rounded-xl text-[10px] font-mono font-bold text-zinc-600 hover:text-zinc-900 transition-all flex items-center justify-center gap-1.5"
                      >
                        <ThumbsUp className="h-3 w-3 text-zinc-400" />
                        <span>Support ({selectedIssue.upvotes})</span>
                      </button>
                      
                      <button
                        onClick={() => handleVerify(selectedIssue.id)}
                        className="flex-1 py-2 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl text-[10px] font-mono font-bold text-emerald-800 transition-all flex items-center justify-center gap-1.5"
                      >
                        <Check className="h-3.5 w-3.5 text-emerald-600" />
                        <span>Verify ({selectedIssue.verifiedCount})</span>
                      </button>

                      <button
                        onClick={() => {
                          setMobileTab('list');
                          setActiveView('grid');
                        }}
                        className="w-full py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl text-[10px] font-sans font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1 shadow-md"
                      >
                        <span>Open Full Case File</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              )}

            </main>

          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
