export enum UserRole {
  GUEST = 'GUEST',
  ADMIN = 'ADMIN',
  PARTICIPANT = 'PARTICIPANT'
}

export enum CompetitionStatus {
  DRAFT = 'DRAFT',
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED'
}

export interface TestCase {
  input: string;
  expectedOutput: string;
  isHidden: boolean;
}

export interface Problem {
  id: string;
  title: string;
  description: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  testCases: TestCase[];
  starterCode: string;
  timeLimit: number; // in minutes
}

export interface Competition {
  id: string;
  title: string;
  status: CompetitionStatus;
  participants: number;
  problems: Problem[];
  createdAt: string;
}

// Updated for manual submission flow
export interface Submission {
  id: string;
  problemId: string;
  problemTitle: string;
  participantName: string;
  code: string;
  status: 'PENDING' | 'GRADED';
  score?: number; // Assigned by admin
  feedback?: string; // Assigned by admin
  output?: string; // Last run output
  antiCheatMetrics: AntiCheatMetrics;
  submittedAt: string;
}

export interface SubmissionResult {
  output: string;
  executionTime: string;
}

export interface AntiCheatMetrics {
  tabSwitches: number;
  copyPasteCount: number;
  lastActive: number;
}