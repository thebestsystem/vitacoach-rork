export type GoalStatus = 'active' | 'completed' | 'archived';

export interface KeyResult {
  id: string;
  description: string;
  target: number;
  current: number;
  unit: string;
}

export interface Goal {
  id: string;
  title: string;
  description?: string;
  category: 'business' | 'personal' | 'health' | 'learning';
  deadline?: string; // ISO Date
  status: GoalStatus;
  progress: number; // 0-100
  keyResults: KeyResult[];
  createdAt: string;
  updatedAt: string;
}
