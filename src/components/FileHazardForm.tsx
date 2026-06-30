/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { Upload, Sparkles, MapPin, AlertTriangle, CheckCircle, RefreshCw, X } from 'lucide-react';
import { Issue, IssueCategory, IssuePriority, AIAnalysis } from '../types';

interface FileHazardFormProps {
  selectedCoords: { lat: number; lng: number; address?: string } | null;
  onSubmit: (data: {
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
  }) => Promise<void>;
  isSubmitting: boolean;
  onCancel?: () => void;
  existingIssues?: Issue[];
  onSelectNearbyIssue?: (issue: Issue) => void;
}

const convertToDMS = (deg: number, isLat: boolean) => {
  if (isNaN(deg) || !isFinite(deg)) return '0°0\'0"N';
  const absolute = Math.abs(deg);
  const degrees = Math.floor(absolute);
  const minutesNotTruncated = (absolute - degrees) * 60;
  const minutes = Math.floor(minutesNotTruncated);
  const seconds = Math.round((minutesNotTruncated - minutes) * 60);
  const direction = isLat
    ? (deg >= 0 ? 'N' : 'S')
    : (deg >= 0 ? 'E' : 'W');
  return `${degrees}°${minutes}'${seconds}"${direction}`;
};

const getGridSector = (lat: number, lng: number) => {
  if (isNaN(lat) || isNaN(lng) || !isFinite(lat) || !isFinite(lng)) {
    return 'Sector Alpha: Central Corridor';
  }
  const sum = Math.abs(Math.floor(lat * 100) + Math.floor(lng * 100));
  const sectors = ['Sector Alpha: Central Corridor', 'Sector Beta: Water Mains & Utilities', 'Sector Gamma: Residential Hillside', 'Sector Delta: Port & Industrial Area', 'Sector Epsilon: Westside Commercial'];
  return sectors[sum % sectors.length];
};

export const FileHazardForm: React.FC<FileHazardFormProps> = ({
  selectedCoords,
  onSubmit,
  isSubmitting,
  onCancel,
  existingIssues = [],
  onSelectNearbyIssue,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<IssueCategory>('pothole');
  const [priority, setPriority] = useState<IssuePriority>('medium');
  const [address, setAddress] = useState('');
  
  const [image, setImage] = useState('');
  const [imageMime, setImageMime] = useState('');
  const [enrichWithAI, setEnrichWithAI] = useState(true);
  
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysis | null>(null);
  
  const [nearbyIssues, setNearbyIssues] = useState<Issue[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Detect duplicates/nearby active issues
  useEffect(() => {
    if (selectedCoords && existingIssues.length > 0) {
      const { lat, lng } = selectedCoords;
      const closeIssues = existingIssues.filter((issue) => {
        if (issue.status === 'resolved') return false;
        const dLat = issue.latitude - lat;
        const dLng = issue.longitude - lng;
        // Check within ~0.003 degrees (approx 300m)
        return Math.sqrt(dLat * dLat + dLng * dLng) < 0.003;
      });
      setNearbyIssues(closeIssues);
    } else {
      setNearbyIssues([]);
    }
  }, [selectedCoords, existingIssues]);

  // Sync address with clicked coordinate location
  useEffect(() => {
    if (selectedCoords) {
      if (selectedCoords.address) {
        setAddress(selectedCoords.address);
      } else {
        setAddress(`Location Near Grid (${selectedCoords.lng}°E, ${selectedCoords.lat}°N)`);
      }
    }
  }, [selectedCoords]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setImageMime(file.type);
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setImage(result);
      if (enrichWithAI) {
        triggerAiAnalysis(description, result, file.type);
      }
    };
    reader.readAsDataURL(file);
  };

  const triggerAiAnalysis = async (text: string, imgBase64?: string, mime?: string) => {
    if (!text && !imgBase64) return;
    setIsAnalyzing(true);
    try {
      const cleanBase64 = imgBase64 ? imgBase64.split(',')[1] : undefined;
      const res = await fetch('/api/gemini/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: text || 'Analyze this hazard report.',
          imageBase64: cleanBase64,
          imageMime: mime,
        }),
      });
      const data = await res.json();
      if (data && !data.error) {
        setAiAnalysis(data);
        setCategory(data.category);
        setPriority(data.priority);
      }
    } catch (err) {
      console.error('Gemini draft analyzer failed:', err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;

    const lat = selectedCoords ? selectedCoords.lat : 42.0;
    const lng = selectedCoords ? selectedCoords.lng : 35.0;

    await onSubmit({
      title,
      description,
      category,
      priority,
      latitude: lat,
      longitude: lng,
      address: address || 'Maplewood Corridor',
      image,
      imageMime,
      enrichWithAI,
    });

    // Reset Form
    setTitle('');
    setDescription('');
    setImage('');
    setImageMime('');
    setAddress('');
    setAiAnalysis(null);
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white/60 backdrop-blur-md border border-zinc-200/50 rounded-2xl p-6 shadow-[0_8px_32px_0_rgba(0,0,0,0.03)] flex flex-col gap-5">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-display font-bold text-zinc-900 text-base tracking-tight flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Report a Neighborhood Hazard
          </h3>
          <p className="text-xs text-zinc-500 mt-1">
            Fill out local infrastructure defects to alert the community and city dispatchers.
          </p>
        </div>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="p-1.5 hover:bg-zinc-100 rounded-lg text-zinc-400 hover:text-zinc-600 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
      
      {/* Potential Duplicates / Nearby Issues Warning */}
      {nearbyIssues.length > 0 && onSelectNearbyIssue && (
        <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-4 flex flex-col gap-2.5">
          <div className="flex items-start gap-2.5 text-amber-800">
            <AlertTriangle className="h-4.5 w-4.5 shrink-0 mt-0.5 text-amber-500" />
            <div>
              <span className="text-xs font-bold block">Possible Duplicate Reports Found Nearby</span>
              <p className="text-[10.5px] leading-relaxed mt-0.5 text-amber-700 font-sans">
                Other citizens have already flagged active reports near this location. Please inspect them below. You can upvote or add comments to existing reports to raise their municipal priority instead!
              </p>
            </div>
          </div>
          <div className="flex flex-col gap-1.5 bg-white/80 rounded-lg p-2 border border-amber-200/50">
            {nearbyIssues.map((issue) => (
              <div key={issue.id} className="flex items-center justify-between gap-3 text-xs p-2 rounded-md hover:bg-zinc-50 transition-all border-b border-zinc-100 last:border-none">
                <div className="truncate">
                  <span className="font-bold text-zinc-900 block truncate">{issue.title}</span>
                  <span className="text-[10px] text-zinc-500 block truncate">{issue.address}</span>
                </div>
                <button
                  type="button"
                  onClick={() => onSelectNearbyIssue(issue)}
                  className="bg-zinc-900 hover:bg-zinc-800 text-white text-[10px] font-mono font-bold px-2.5 py-1 rounded transition-all shadow-xs shrink-0"
                >
                  Inspect & Upvote
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Title Input */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 font-bold">Report Title *</label>
          <input
            type="text"
            required
            placeholder="e.g. Deep pothole on 4th Avenue crossing"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="bg-zinc-50/50 border border-zinc-200 rounded-xl px-3 py-2 text-xs text-zinc-800 placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500 font-sans transition-all"
          />
        </div>

        {/* Physical Address Input */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 font-bold">Location or Nearest Address</label>
          <input
            type="text"
            placeholder="e.g. 240 Main St, near high school"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="bg-zinc-50/50 border border-zinc-200 rounded-xl px-3 py-2 text-xs text-zinc-800 placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500 font-sans transition-all"
          />
        </div>
      </div>

      {/* Description Textarea */}
      <div className="flex flex-col gap-1.5">
        <label className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 font-bold">Details & Safety Risks *</label>
        <textarea
          required
          rows={3}
          placeholder="Please describe the issue, its visual features, and if it poses immediate safety risks to drivers or walking residents..."
          value={description}
          onChange={(e) => {
            setDescription(e.target.value);
            if (enrichWithAI && e.target.value.length > 20) {
              const val = e.target.value;
              setTimeout(() => {
                if (val === description) triggerAiAnalysis(val, image, imageMime);
              }, 1500);
            }
          }}
          className="bg-zinc-50/50 border border-zinc-200 rounded-xl px-3 py-2.5 text-xs text-zinc-800 placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500 font-sans resize-none transition-all"
        />
      </div>

      {/* Image Upload Component */}
      <div className="flex flex-col gap-1.5">
        <label className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 font-bold">Photo Evidence</label>
        
        {image ? (
          <div className="relative w-full h-40 rounded-xl overflow-hidden border border-zinc-200 bg-zinc-100">
            <img src={image} alt="Evidence" className="w-full h-full object-cover" />
            <button
              type="button"
              onClick={() => {
                setImage('');
                setImageMime('');
                setAiAnalysis(null);
              }}
              className="absolute top-2 right-2 bg-white/90 hover:bg-red-50 hover:text-red-600 border border-zinc-200 text-zinc-700 rounded-lg px-2.5 py-1 text-[10px] font-mono transition-all font-bold shadow-sm"
            >
              Remove Photo
            </button>
          </div>
        ) : (
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border border-dashed border-zinc-300 hover:border-amber-500/80 bg-zinc-50/50 hover:bg-amber-50/20 rounded-xl p-5 text-center cursor-pointer transition-all flex flex-col items-center gap-1.5 group"
          >
            <Upload className="h-5 w-5 text-zinc-400 group-hover:text-amber-500 transition-colors" />
            <span className="text-xs text-zinc-700 group-hover:text-zinc-900 font-medium">
              Drag & Drop or Click to Upload Image
            </span>
            <span className="text-[10px] text-zinc-400 font-sans">Supports JPEG, PNG or WEBP (Max 5MB)</span>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              className="hidden"
            />
          </div>
        )}
      </div>

      {/* Location pinning assist (High Precision HUD) */}
      <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-4.5 flex flex-col gap-3 font-mono">
        <div className="flex items-center justify-between gap-2 border-b border-zinc-150 pb-2">
          <div className="flex items-center gap-1.5">
            <MapPin className="h-4 w-4 text-zinc-950 shrink-0" />
            <span className="text-[10px] font-bold text-zinc-800 uppercase tracking-wider font-sans">
              Municipal Grid Lockout
            </span>
          </div>
          {selectedCoords ? (
            <span className="text-[9px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded uppercase tracking-wide">
              Active Anchor
            </span>
          ) : (
            <span className="text-[9px] font-bold bg-zinc-200 text-zinc-600 border border-zinc-300/60 px-2 py-0.5 rounded uppercase tracking-wide">
              Default Center
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-sans">
          <div>
            <span className="text-[9px] font-mono text-zinc-400 font-bold uppercase block">Dec. Coordinates</span>
            <span className="font-bold text-zinc-800 mt-0.5 block">
              {selectedCoords && !isNaN(selectedCoords.lat) && !isNaN(selectedCoords.lng)
                ? `${selectedCoords.lat.toFixed(5)}°N, ${selectedCoords.lng.toFixed(5)}°E`
                : '40.71280°N, -74.00600°E'}
            </span>
          </div>
          <div>
            <span className="text-[9px] font-mono text-zinc-400 font-bold uppercase block">DMS GPS Target</span>
            <span className="font-bold text-zinc-800 mt-0.5 block">
              {selectedCoords
                ? `${convertToDMS(selectedCoords.lat, true)} / ${convertToDMS(selectedCoords.lng, false)}`
                : `${convertToDMS(40.7128, true)} / ${convertToDMS(-74.0060, false)}`}
            </span>
          </div>
          <div className="sm:col-span-2">
            <span className="text-[9px] font-mono text-zinc-400 font-bold uppercase block">Assigned Sector Area</span>
            <span className="font-medium text-zinc-700 mt-0.5 block font-mono text-[11px]">
              {selectedCoords
                ? getGridSector(selectedCoords.lat, selectedCoords.lng)
                : getGridSector(40.7128, -74.0060)}
            </span>
          </div>
        </div>

        {!selectedCoords && (
          <p className="text-[10px] text-zinc-400 font-sans italic border-t border-zinc-150 pt-2">
            * Note: Map is currently centered. Click anywhere on the geographic map at the top of the feed to pin exact hazard coordinates.
          </p>
        )}
      </div>

      {/* AI Smart classification */}
      <div className="border border-zinc-100 bg-zinc-50/30 rounded-xl p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <Sparkles className="h-4 w-4 text-amber-500" />
            <span className="text-xs font-bold text-zinc-800 font-sans">AI Smart Classification Assistance</span>
          </div>
          <label className="relative inline-flex items-center cursor-pointer select-none">
            <input
              type="checkbox"
              checked={enrichWithAI}
              onChange={(e) => setEnrichWithAI(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-8 h-4 bg-zinc-200 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-amber-500" />
          </label>
        </div>

        {enrichWithAI && (
          <div className="text-[11px] text-zinc-500 leading-normal">
            {isAnalyzing ? (
              <div className="flex items-center gap-1.5 text-amber-600 font-medium py-1">
                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                <span>Gemini is analyzing the details...</span>
              </div>
            ) : aiAnalysis ? (
              <div className="bg-white border border-zinc-200 rounded-lg p-3 mt-2 flex flex-col gap-1.5">
                <div className="flex items-center gap-2 justify-between border-b border-zinc-100 pb-1.5">
                  <span className="text-[10px] text-zinc-500 font-mono font-bold uppercase">Estimated Review</span>
                  <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded">
                    {Math.round(aiAnalysis.confidence * 100)}% confidence match
                  </span>
                </div>
                <p className="text-xs text-zinc-700 leading-relaxed whitespace-pre-wrap">
                  {aiAnalysis.explanation.split('**').map((part, index) => {
                    if (index % 2 === 1) {
                      return (
                        <strong key={index} className="font-bold text-zinc-900">
                          {part}
                        </strong>
                      );
                    }
                    return part;
                  })}
                </p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {aiAnalysis.tags.map((tag, idx) => (
                    <span key={idx} className="bg-zinc-100 text-zinc-600 font-sans text-[10px] px-2 py-0.5 rounded border border-zinc-200">
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            ) : (
              <span className="text-zinc-400 font-sans text-[10.5px]">
                Typing description or uploading a photo automatically triggers Gemini to estimate appropriate categories and urgency.
              </span>
            )}
          </div>
        )}
      </div>

      {/* Fields override */}
      <div className="grid grid-cols-2 gap-3 mt-1">
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 font-bold">Category</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as IssueCategory)}
            className="bg-zinc-50/50 border border-zinc-200 rounded-xl px-2.5 py-2 text-xs text-zinc-700 focus:outline-none focus:ring-1 focus:ring-amber-500"
          >
            <option value="pothole">Pothole / Road Damage</option>
            <option value="water_leak">Water Leak / Utility</option>
            <option value="broken_streetlight">Broken Streetlight</option>
            <option value="waste_management">Waste / Illegal Dumping</option>
            <option value="public_infrastructure">Public Sidewalk & Asset</option>
            <option value="other">Other Incident</option>
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 font-bold">Priority Level</label>
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value as IssuePriority)}
            className="bg-zinc-50/50 border border-zinc-200 rounded-xl px-2.5 py-2 text-xs text-zinc-700 focus:outline-none focus:ring-1 focus:ring-amber-500"
          >
            <option value="low">Low Priority</option>
            <option value="medium">Medium Priority</option>
            <option value="high">High Priority</option>
            <option value="critical">Critical / Threat to Safety</option>
          </select>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-3 mt-2">
        <button
          type="submit"
          disabled={isSubmitting || !title.trim() || !description.trim()}
          className={`flex-1 py-3 rounded-xl font-bold text-xs tracking-wide uppercase transition-all duration-300 flex items-center justify-center gap-2 ${
            isSubmitting || !title.trim() || !description.trim()
              ? 'bg-zinc-100 text-zinc-400 border border-zinc-200 cursor-not-allowed'
              : 'bg-zinc-900 text-white hover:bg-zinc-800 hover:shadow-sm active:scale-95'
          }`}
        >
          {isSubmitting ? (
            <>
              <RefreshCw className="h-4 w-4 animate-spin" />
              <span>Filing Report...</span>
            </>
          ) : (
            <>
              <CheckCircle className="h-4 w-4" />
              <span>Submit Hazard Report</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
};
