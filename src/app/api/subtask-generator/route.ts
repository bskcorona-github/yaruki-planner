import { NextResponse } from 'next/server';
import { divideIntoSubtasks } from '@/app/lib/openai';

export async function POST(request: Request) {
  try {
    const { taskTitle, taskDescription, additionalInfo } = await request.json();
    
    if (!taskTitle || typeof taskTitle !== 'string') {
      console.error('無効なリクエスト: タスクタイトルがありません');
      return NextResponse.json(
        { error: 'タスクタイトルが必要です' },
        { status: 400 }
      );
    }
    
    console.log(`サブタスク生成開始: "${taskTitle}"`);
    console.log(`追加情報: ${JSON.stringify(additionalInfo || {})}`);
    
    try {
      const subtasks = await divideIntoSubtasks(
        taskTitle, 
        taskDescription || '',
        additionalInfo || {}
      );
      
      console.log(`サブタスク生成完了: ${subtasks.length}件のサブタスクが生成されました`);
      
      if (!Array.isArray(subtasks)) {
        console.error('サブタスク生成エラー: 結果が配列ではありません');
        return NextResponse.json(
          { error: 'サブタスクの生成に失敗しました。適切なタスクが生成されませんでした。' },
          { status: 500 }
        );
      }
      
      if (subtasks.length === 0) {
        console.error('サブタスク生成エラー: 空の配列が返されました');
        
        // 最低限のダミーサブタスクを返す（完全な失敗を防ぐため）
        const dummySubtasks = [
          {
            title: `${taskTitle}の学習計画を立てる`,
            description: "目標達成のための詳細な学習計画を立案する",
            dueDate: new Date(new Date().setDate(new Date().getDate() + 3)),
            priority: "high",
            estimatedTime: 60
          },
          {
            title: `${taskTitle}の学習資料を集める`,
            description: "必要な教材や参考資料を集める",
            dueDate: new Date(new Date().setDate(new Date().getDate() + 7)),
            priority: "medium",
            estimatedTime: 120
          }
        ];
        
        console.log('ダミーサブタスクを生成: 2件');
        return NextResponse.json(dummySubtasks);
      }
      
      return NextResponse.json(subtasks);
    } catch (innerError) {
      console.error('サブタスク生成処理エラー:', innerError);
      return NextResponse.json(
        { error: 'サブタスク生成中に内部エラーが発生しました' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('サブタスク生成API全体エラー:', error);
    return NextResponse.json(
      { error: 'サブタスク生成中にエラーが発生しました' },
      { status: 500 }
    );
  }
} 