import { NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';
import { Task } from '@prisma/client';

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

    // タスクが存在するか確認
    const task = await prisma.task.findUnique({
      where: { id: taskId },
    });

    if (!task) {
      return NextResponse.json(
        { error: '指定されたタスクが見つかりません' },
        { status: 404 }
      );
    }

    // タスク結果を保存
    const taskResult = await prisma.taskResult.create({
      data: {
        userId,
        taskId,
        completed,
        exerciseResults: exerciseResults || [],
        notes: notes || '',
      },
    });

    // タスクのステータスを更新
    await prisma.task.update({
      where: { id: taskId },
      data: {
        completed,
        lastAttemptAt: new Date(),
      },
    });

    // 関連する学習プランの進捗状況を更新
    if (task.learningPlanId) {
      const allTasksInPlan = await prisma.task.findMany({
        where: { learningPlanId: task.learningPlanId },
      });
      
      const completedTasks = allTasksInPlan.filter((t: Task) => t.completed).length;
      const totalTasks = allTasksInPlan.length;
      const progressPercentage = Math.round((completedTasks / totalTasks) * 100);

      await prisma.learningPlan.update({
        where: { id: task.learningPlanId },
        data: {
          progress: progressPercentage,
          completed: progressPercentage === 100,
        },
      });
    }

    return NextResponse.json({
      success: true,
      taskResult,
      message: '結果が正常に保存されました',
    });
  } catch (error) {
    console.error('タスク結果の保存中にエラーが発生しました:', error);
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    );
  }
} 