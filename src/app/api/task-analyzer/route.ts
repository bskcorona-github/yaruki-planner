import { NextResponse } from 'next/server';
import { extractTaskDetails } from '@/app/lib/openai';

export async function POST(request: Request) {
  try {
    const { taskText } = await request.json();
    
    if (!taskText || typeof taskText !== 'string') {
      return NextResponse.json(
        { error: 'タスクテキストが必要です' },
        { status: 400 }
      );
    }
    
    const taskDetails = await extractTaskDetails(taskText);
    
    return NextResponse.json(taskDetails);
  } catch (error) {
    console.error('タスク分析エラー:', error);
    return NextResponse.json(
      { error: 'タスク分析中にエラーが発生しました' },
      { status: 500 }
    );
  }
} 