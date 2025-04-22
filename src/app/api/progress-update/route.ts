import { NextResponse } from 'next/server';
import { formatProgressUpdate } from '@/app/lib/openai';

export async function POST(request: Request) {
  try {
    const { 
      dailyTask, 
      isCompleted, 
      userFeedback, 
      learningGoal,
      currentPhase
    } = await request.json();
    
    if (!dailyTask || typeof dailyTask !== 'object') {
      console.error('無効なリクエスト: デイリータスク情報がありません');
      return NextResponse.json(
        { error: '有効なデイリータスク情報が必要です' },
        { status: 400 }
      );
    }
    
    if (isCompleted === undefined || typeof isCompleted !== 'boolean') {
      console.error('無効なリクエスト: 完了ステータスが不正です');
      return NextResponse.json(
        { error: 'タスクの完了ステータス（true/false）が必要です' },
        { status: 400 }
      );
    }
    
    console.log(`進捗更新リクエスト: タスク "${dailyTask.title || '不明'}"`);
    console.log(`完了ステータス: ${isCompleted ? '完了' : '未完了'}`);
    
    try {
      const progressUpdate = await formatProgressUpdate(
        dailyTask,
        isCompleted,
        userFeedback || '',
        learningGoal || dailyTask.title || '学習目標',
        currentPhase || '学習フェーズ'
      );
      
      if (!progressUpdate || typeof progressUpdate !== 'object') {
        console.error('進捗更新生成エラー: 無効な結果が返されました');
        return NextResponse.json(
          { error: '進捗更新の生成に失敗しました。適切なフィードバックが生成されませんでした。' },
          { status: 500 }
        );
      }
      
      console.log(`進捗更新生成完了`);
      return NextResponse.json(progressUpdate);
    } catch (innerError) {
      console.error('進捗更新処理エラー:', innerError);
      return NextResponse.json(
        { error: '進捗更新中に内部エラーが発生しました' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('進捗更新API全体エラー:', error);
    return NextResponse.json(
      { error: '進捗更新中にエラーが発生しました' },
      { status: 500 }
    );
  }
} 