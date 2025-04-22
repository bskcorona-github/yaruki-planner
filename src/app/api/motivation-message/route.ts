import { NextResponse } from 'next/server';
import { generateMotivationalMessage } from '@/app/lib/openai';
import { Task } from '@/app/types';

export async function POST(request: Request) {
  try {
    const { tasks } = await request.json();
    
    if (!Array.isArray(tasks)) {
      return NextResponse.json(
        { error: 'タスクのリストが必要です' },
        { status: 400 }
      );
    }
    
    const message = await generateMotivationalMessage(tasks as Task[]);
    
    return NextResponse.json(message);
  } catch (error) {
    console.error('モチベーションメッセージ生成エラー:', error);
    return NextResponse.json(
      { error: 'メッセージ生成中にエラーが発生しました' },
      { status: 500 }
    );
  }
} 