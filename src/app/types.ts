// タスクの状態を表す型
export type TaskStatus = 'pending' | 'in-progress' | 'completed';
export type TaskPriority = 'high' | 'medium' | 'low';

// タスクを表す型
export interface Task {
  id: string;
  title: string;
  description?: string;
  dueDate: Date | null;
  priority: TaskPriority;
  status: TaskStatus;
  estimatedTime: number; // 分単位
  parentTaskId?: string;
  createdAt: Date;
  updatedAt: Date;
}

// 学習カテゴリを表す型
export type LearningCategory = 'language' | 'programming' | 'exam' | 'hobby' | 'other';

// 学習レベルを表す型
export type LearningLevel = 'beginner' | 'intermediate' | 'advanced';

// 学習計画の設定を表す型
export interface LearningSettings {
  category: LearningCategory;
  level: LearningLevel;
  dailyTimeAvailable: number; // 分単位
}

// 学習マスタープランのステップを表す型
export interface LearningMasterStep {
  id: string;
  title: string;
  description: string;
  dueDate: Date;
  priority: TaskPriority;
  estimatedTotalTime: number; // 分単位
  completedPercentage: number; // 完了率(0-100)
  status: TaskStatus;
  taskId: string; // 親タスクID
  createdAt: Date;
  updatedAt: Date;
}

// 日々の練習問題を表す型
export interface Exercise {
  id: string;
  question: string;
  options?: string[]; // 選択肢（選択問題の場合）
  answer: string;
  explanation: string;
  userAnswer?: string; // ユーザーの回答（解答後に設定）
  isCorrect?: boolean; // ユーザーの回答が正解かどうか（解答後に設定）
}

// 日々のタスクを表す型
export interface DailyTask {
  id: string;
  title: string;
  description: string;
  date: Date; // タスクの日付
  estimatedTime: number; // 分単位
  isCompleted: boolean;
  masterStepId: string; // 関連するマスタープランのステップID
  exercises: Exercise[];
  createdAt: Date;
  updatedAt: Date;
} 