export type Task = {
  id: string;
  title: string;
  description?: string;
  dueDate: Date | null;
  status: 'pending' | 'in-progress' | 'completed';
  priority: 'low' | 'medium' | 'high';
  estimatedTime?: number; // 予想所要時間（分）
  parentTaskId?: string; // 親タスクID（サブタスクの場合）
  createdAt: Date;
  updatedAt: Date;
};

export type SubTask = Task & {
  parentTaskId: string;
};

export type TaskInsight = {
  id: string;
  taskId: string;
  type: 'advice' | 'warning' | 'motivation' | 'analysis';
  content: string;
  createdAt: Date;
};

export type ProgressData = {
  date: string;
  completedTasks: number;
  totalTasks: number;
};

export type UserPreference = {
  userId: string;
  theme: 'light' | 'dark';
  notifications: boolean;
  language: 'ja' | 'en';
}; 