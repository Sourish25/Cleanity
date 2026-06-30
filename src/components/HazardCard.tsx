/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { MapPin, ThumbsUp, CheckCircle, MessageSquare, Clock, AlertTriangle, HelpCircle, AlertCircle, Trash2, ShieldAlert } from 'lucide-react';
import { Issue, IssueCategory, IssuePriority, IssueStatus } from '../types';

interface HazardCardProps {
  issue: Issue;
  isSelected: boolean;
  onSelect: () => void;
  onUpvote: (e: React.MouseEvent) => void;
  onVerify: (e: React.MouseEvent) => void;
}

export const HazardCard: React.FC<HazardCardProps> = ({
  issue,
  isSelected,
  onSelect,
  onUpvote,
  onVerify,
}) => {
  
  // Category styles - clean, light, and professional
  const getCategoryDetails = (cat: IssueCategory) => {
    switch (cat) {
      case 'pothole':
        return { label: 'Road / Pothole', bg: 'bg-amber-50 text-amber-700 border-amber-200' };
      case 'water_leak':
        return { label: 'Water Leak', bg: 'bg-sky-50 text-sky-700 border-sky-200' };
      case 'broken_streetlight':
        return { label: 'Streetlight', bg: 'bg-orange-50 text-orange-700 border-orange-200' };
      case 'waste_management':
        return { label: 'Sanitation', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
      case 'public_infrastructure':
        return { label: 'Sidewalk / Public Assets', bg: 'bg-indigo-50 text-indigo-700 border-indigo-200' };
      default:
        return { label: 'Other', bg: 'bg-zinc-50 text-zinc-700 border-zinc-200' };
    }
  };

  // Priority styles
  const getPriorityDetails = (prio: IssuePriority) => {
    switch (prio) {
      case 'critical':
        return { label: 'Critical Risk', bg: 'bg-red-50 text-red-700 border-red-200 font-semibold' };
      case 'high':
        return { label: 'High Urgency', bg: 'bg-orange-50 text-orange-700 border-orange-200 font-semibold' };
      case 'medium':
        return { label: 'Medium', bg: 'bg-amber-50 text-amber-700 border-amber-200' };
      default:
        return { label: 'Low', bg: 'bg-zinc-100 text-zinc-600 border-zinc-200' };
    }
  };

  // Status Details
  const getStatusDetails = (status: IssueStatus) => {
    switch (status) {
      case 'reported':
        return { label: 'Reported', color: 'bg-zinc-100 text-zinc-700 border-zinc-200', icon: AlertCircle };
      case 'under_review':
        return { label: 'Under Review', color: 'bg-yellow-50 text-yellow-700 border-yellow-200', icon: Clock };
      case 'scheduled':
        return { label: 'Scheduled', color: 'bg-blue-50 text-blue-700 border-blue-200', icon: Clock };
      case 'in_progress':
        return { label: 'In Progress', color: 'bg-amber-50 text-amber-700 border-amber-200', icon: Clock };
      case 'resolved':
        return { label: 'Resolved', color: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: CheckCircle };
    }
  };

  const catInfo = getCategoryDetails(issue.category);
  const prioInfo = getPriorityDetails(issue.priority);
  const statusInfo = getStatusDetails(issue.status);
  const StatusIcon = statusInfo.icon || AlertCircle;

  return (
    <div
      onClick={onSelect}
      className={`bg-white/60 backdrop-blur-md border rounded-2xl p-5 cursor-pointer transition-all duration-300 relative overflow-hidden group select-none shadow-[0_4px_24px_0_rgba(0,0,0,0.02)] ${
        isSelected
          ? 'border-zinc-950 ring-1 ring-zinc-950 bg-white/90 shadow-[0_8px_32px_0_rgba(0,0,0,0.06)]'
          : 'border-zinc-200/50 hover:border-zinc-300 hover:bg-white/80 hover:shadow-[0_8px_32px_0_rgba(0,0,0,0.04)]'
      }`}
    >
      {/* Visual notification dot for severe open hazards */}
      {issue.status !== 'resolved' && (issue.priority === 'critical' || issue.priority === 'high') && (
        <span className="absolute top-2 right-2 flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
        </span>
      )}

      {/* Top Tag Bar */}
      <div className="flex items-center gap-2 mb-2.5 flex-wrap">
        <span className={`text-[9px] font-mono font-bold px-2 py-0.5 border rounded-md uppercase tracking-wide ${catInfo.bg}`}>
          {catInfo.label}
        </span>
        <span className={`text-[9px] font-mono font-bold px-2 py-0.5 border rounded-md uppercase tracking-wide ${prioInfo.bg}`}>
          {prioInfo.label}
        </span>
      </div>

      {/* Title */}
      <h4 className="font-display font-bold text-xs text-zinc-900 group-hover:text-amber-600 transition-colors leading-snug tracking-tight">
        {issue.title}
      </h4>

      {/* Snippet Description */}
      <p className="text-[11px] text-zinc-500 mt-1.5 line-clamp-2 leading-relaxed">
        {issue.description}
      </p>

      {/* Location / Address Indicator */}
      <div className="flex items-center gap-1.5 text-[10px] text-zinc-500 mt-3 font-medium">
        <MapPin className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
        <span className="truncate">{issue.address}</span>
      </div>

      {/* Card Actions Footer */}
      <div className="flex items-center justify-between border-t border-zinc-150 pt-3 mt-3.5">
        {/* Status indicator */}
        <div className={`flex items-center gap-1 px-2 py-0.5 border rounded text-[9px] font-mono font-bold uppercase tracking-wider ${statusInfo.color}`}>
          <StatusIcon className="h-3 w-3 shrink-0" />
          <span>{statusInfo.label}</span>
        </div>

        {/* Counter controls */}
        <div className="flex items-center gap-2.5 text-[10px] font-mono text-zinc-500">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onUpvote(e);
            }}
            className="flex items-center gap-1 hover:text-zinc-800 transition-colors bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 px-2 py-0.5 rounded font-medium shadow-xs"
            title="Upvote / Support report"
          >
            <ThumbsUp className="h-3 w-3 text-zinc-400" />
            <span>{issue.upvotes}</span>
          </button>
          
          <button
            onClick={(e) => {
              e.stopPropagation();
              onVerify(e);
            }}
            className="flex items-center gap-1 hover:text-emerald-700 transition-colors bg-zinc-50 hover:bg-emerald-50 border border-zinc-200 px-2 py-0.5 rounded font-medium shadow-xs"
            title="Confirm Ground-Truth"
          >
            <CheckCircle className="h-3 w-3 text-emerald-500" />
            <span>{issue.verifiedCount}</span>
          </button>

          {issue.comments.length > 0 && (
            <div className="flex items-center gap-1 bg-zinc-50 border border-zinc-200 px-2 py-0.5 rounded text-zinc-400">
              <MessageSquare className="h-3 w-3" />
              <span>{issue.comments.length}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
