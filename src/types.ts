/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type IssueCategory =
  | 'pothole'
  | 'water_leak'
  | 'broken_streetlight'
  | 'waste_management'
  | 'public_infrastructure'
  | 'other';

export type IssueStatus =
  | 'reported'
  | 'under_review'
  | 'scheduled'
  | 'in_progress'
  | 'resolved';

export type IssuePriority = 'low' | 'medium' | 'high' | 'critical';

export interface Comment {
  id: string;
  author: string;
  email: string;
  content: string;
  createdAt: string;
  isMunicipalOfficial?: boolean;
  upvotes: number;
}

export interface UpdateLog {
  id: string;
  status: IssueStatus;
  description: string;
  createdAt: string;
  author: string;
}

export interface AIAnalysis {
  category: IssueCategory;
  confidence: number;
  priority: IssuePriority;
  explanation: string;
  tags: string[];
  suggestedAction: string;
  estimatedResolutionDays: number;
}

export interface WorkOrder {
  id: string;
  assignedCrew: string;
  scheduledDate: string;
  materialsNeeded: string;
  instructions: string;
  dispatchedAt: string;
}

export interface Issue {
  id: string;
  title: string;
  category: IssueCategory;
  description: string;
  imageUrl?: string;
  latitude: number;
  longitude: number;
  address: string;
  status: IssueStatus;
  priority: IssuePriority;
  reporterName: string;
  reporterEmail: string;
  createdAt: string;
  upvotes: number;
  votedEmails: string[];
  verifiedCount: number;
  verifiedEmails: string[];
  duplicatedCount: number;
  duplicateOfId?: string; // Links this issue as a duplicate of another issue
  workOrder?: WorkOrder; // Staff-generated maintenance dispatch order
  comments: Comment[];
  updates: UpdateLog[];
  tags: string[];
  aiAnalysis?: AIAnalysis;
}

export interface UserProfile {
  email: string;
  name: string;
  xp: number;
  level: number;
  badges: string[]; // Badge IDs
  reportsCount: number;
  votesCount: number;
  streak: number;
}

export interface Badge {
  id: string;
  title: string;
  description: string;
  iconName: string;
  colorClass: string;
}

export interface PredictiveHotspot {
  area: string;
  category: IssueCategory;
  riskScore: number; // 0 to 100
  dominantIssueType: string;
  recommendedPrevention: string;
  trend: 'increasing' | 'stable' | 'decreasing';
}

export interface PredictiveInsights {
  hotspots: PredictiveHotspot[];
  priorityActions: {
    title: string;
    description: string;
    priority: 'high' | 'critical';
    area: string;
  }[];
  seasonalAlerts: string[];
  aiSummary: string;
}
