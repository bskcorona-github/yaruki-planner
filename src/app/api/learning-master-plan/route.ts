import { NextResponse } from 'next/server';
import { generateLearningMasterPlan } from '@/app/lib/openai';

export async function POST(request: Request) {
  try {
    const { taskTitle, taskDescription, dueDate, additionalInfo } = await request.json();
    
    if (!taskTitle || typeof taskTitle !== 'string') {
      console.error('無効なリクエスト: タスクタイトルがありません');
      return NextResponse.json(
        { error: '学習目標のタイトルが必要です' },
        { status: 400 }
      );
    }
    
    console.log(`学習マスタープラン生成開始: "${taskTitle}"`);
    console.log(`目標期限: ${dueDate || '未設定'}`);
    console.log(`追加情報: ${JSON.stringify(additionalInfo || {})}`);
    
    try {
      // 日付文字列をDate型に変換
      let dueDateObj = null;
      if (dueDate) {
        try {
          dueDateObj = new Date(dueDate);
          if (isNaN(dueDateObj.getTime())) {
            dueDateObj = null;
          }
        } catch {
          dueDateObj = null;
        }
      }
      
      const result = await generateLearningMasterPlan(
        taskTitle, 
        taskDescription || '',
        dueDateObj,
        additionalInfo || {}
      );
      
      // masterPlanには従来の形式とdetailsを含む新しい形式がある
      const { plan, details } = result;
      
      console.log(`マスタープラン生成完了: ${plan.length}ステップ`);
      
      if (!Array.isArray(plan) || plan.length === 0) {
        console.error('マスタープラン生成エラー: 空の配列が返されました');
        return NextResponse.json(
          { error: 'マスタープランの生成に失敗しました。適切なプランが生成されませんでした。' },
          { status: 500 }
        );
      }
      
      // 詳細情報も含めて返す
      return NextResponse.json({
        plan,
        details
      });
    } catch (innerError) {
      console.error('マスタープラン生成処理エラー:', innerError);
      return NextResponse.json(
        { error: 'マスタープラン生成中に内部エラーが発生しました' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('マスタープランAPI全体エラー:', error);
    return NextResponse.json(
      { error: 'マスタープラン生成中にエラーが発生しました' },
      { status: 500 }
    );
  }
} 