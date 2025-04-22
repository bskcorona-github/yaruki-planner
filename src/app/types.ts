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

// タスクインサイト（AIによる分析結果）を表す型
export interface TaskInsight {
  id: string;
  taskId: string;
  type: 'suggestion' | 'analysis' | 'motivation' | 'feedback';
  content: string;
  createdAt: Date;
}

// 進捗データを表す型
export interface ProgressData {
  date: string;
  tasksCompleted: number;
  tasksCreated: number;
  studyTime?: number; // 分単位
  streak?: number; // 連続日数
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

// ロードマップノードの重要度
export type NodeImportance = 'essential' | 'recommended' | 'optional';

// ロードマップリソースの型
export interface Resource {
  type: 'article' | 'video' | 'course' | 'book' | 'tool' | 'other';
  title: string;
  url?: string;
  description?: string;
}

// ロードマップのノードを表す型
export interface RoadmapNode {
  id: string;
  title: string;
  description: string;
  level: LearningLevel;
  category: string;
  importance: NodeImportance;
  estimatedHours: number;
  parentId?: string; // 親ノードのID（ルートノードの場合はundefined）
  children?: RoadmapNode[]; // 子ノード（存在する場合）
  resources?: string[]; // 学習リソース（URL、書籍名など）
  prerequisites?: string[]; // 前提条件となるノードのID
  progress?: number; // 進捗率（0-100）
  status?: 'not-started' | 'in-progress' | 'completed';
  skills?: string[];
}

// ロードマップ全体を表す型
export interface Roadmap {
  id: string;
  title: string;
  description: string;
  goalDescription: string;
  category: string;
  level: LearningLevel;
  createdAt: Date;
  updatedAt: Date;
  estimatedTotalHours: number;
  nodes: RoadmapNode[]; // ルートノードのリスト
  milestones?: { // 重要なマイルストーン
    title: string;
    description: string;
    nodeIds: string[];
  }[];
  version: number; // バージョン管理用
}

// マイクロタスクの難易度
export type TaskDifficulty = 'easy' | 'medium' | 'hard';

// マイクロタスクの種類
export type TaskType = 
  | 'coding_exercise' 
  | 'research' 
  | 'quiz' 
  | 'project' 
  | 'reading' 
  | 'exercise'
  | 'practice' 
  | 'reflection';

// 小タスク（具体的な学習タスク）を表す型
export interface MicroTask {
  id: string;
  roadmapNodeId: string; // 関連するロードマップノードのID
  title: string;
  description: string;
  type: TaskType;
  difficulty: TaskDifficulty;
  estimatedMinutes: number;
  instructions?: string; // 詳細な手順
  resources?: string[]; // 関連するリソース
  codeSnippet?: string; // コードスニペット（該当する場合）
  expectedOutput?: string; // 期待される結果
  hints?: string[]; // ヒント
  status: 'pending' | 'in-progress' | 'completed' | 'skipped';
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  isCompleted?: boolean;
  nodeId?: string;
}

// ロードマップの進捗追跡を表す型
export interface RoadmapProgress {
  userId: string;
  roadmapId: string;
  startedAt: Date;
  lastActivityAt: Date;
  completedNodes: string[]; // 完了したノードのID
  inProgressNodes: string[]; // 進行中のノードのID
  completedMicroTasks: string[]; // 完了した小タスクのID
  overallProgress: number; // 全体進捗率（0-100）
  milestones: {
    id: string;
    completedAt?: Date;
  }[];
} 