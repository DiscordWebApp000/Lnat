export interface User {
  uid: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'user' | 'admin';
  permissions: string[];
  createdAt: Date;
  lastLoginAt: Date;
  isActive: boolean;
}

export interface UserProfile {
  uid: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  institution?: string;
  studyLevel?: string;
}

export interface ExamResult {
  id: string;
  userId: string;
  examType: 'text-question-analysis' | 'question-generator' | 'writing-evaluator';
  examDate: Date;
  totalQuestions: number;
  correctAnswers: number;
  wrongAnswers: number;
  unansweredQuestions: number;
  totalTime: number;
  averageTime: number;
  score: number;
  evaluation?: {
    strengths: string[];
    weaknesses: string[];
    recommendations: string[];
    studyPlan: {
      focusAreas: string[];
      practiceQuestions: number;
      estimatedImprovement: string;
    };
  };
  answers: Record<number, string>;
  questionTimes: Record<number, number>;
}

export interface Permission {
  id: string;
  name: string;
  description: string;
  tool: 'text-question-analysis' | 'question-generator' | 'writing-evaluator' | 'all';
}

export interface UserPermission {
  userId: string;
  permissionId: string;
  grantedBy: string;
  grantedAt: Date;
  expiresAt?: Date;
  isActive: boolean;
} 