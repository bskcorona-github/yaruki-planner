import { NextResponse } from 'next/server';

// タスク結果の型定義
interface TaskResult {
  id: string;
  userId: string;
  taskId: string;
  completed: boolean;
  exerciseResults: any[]; // 必要に応じて詳細な型を定義
  notes: string;
  createdAt: Date;
}

// タスクの型定義
interface Task {
  id: string;
  completed: boolean;
  lastAttemptAt: Date;
  learningPlanId?: string;
  [key: string]: any; // その他のプロパティ
}

// インメモリデータストア（開発用）
const inMemoryStore = {
  taskResults: [] as TaskResult[],
  tasks: new Map<string, Task>(),
  learningPlans: new Map<string, any>()
};

export async function POST(request: Request) {
  try {
    const { userId, taskId, completed, exerciseResults, notes } = await request.json();

    // バリデーション
    if (!userId || !taskId || completed === undefined) {
      return NextResponse.json(
        { error: '必須パラメータが不足しています（userId, taskId, completed）' },
        { status: 400 }
      );
    }

    // タスクの存在チェックはスキップ（開発モード）
    // 実際のアプリではここで存在チェックを行う

    // タスク結果を保存
    const taskResult: TaskResult = {
      id: `result-${Date.now()}`,
      userId,
      taskId,
      completed,
      exerciseResults: exerciseResults || [],
      notes: notes || '',
      createdAt: new Date(),
    };
    
    inMemoryStore.taskResults.push(taskResult);

    // タスクの状態更新（開発用）
    const existingTask = inMemoryStore.tasks.get(taskId) || { id: taskId };
    inMemoryStore.tasks.set(taskId, {
      ...existingTask,
      completed,
      lastAttemptAt: new Date(),
    });

    // 実際のアプリでは学習プランの進捗更新ロジックをここに実装

    console.log('タスク結果を保存しました（開発モード）:', taskResult);

    return NextResponse.json({
      success: true,
      taskResult,
      message: '結果が正常に保存されました（開発モード）',
    });
  } catch (error) {
    console.error('タスク結果の保存中にエラーが発生しました:', error);
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    );
  }
} 