import { NextResponse } from 'next/server';
import { generateDailyTask } from '@/app/lib/openai';

export async function POST(request: Request) {
  try {
    const { 
      masterStepTitle, 
      category, 
      level, 
      timeAvailable, 
      previousResults,
      masterPlanDetails 
    } = await request.json();
    
    if (!masterStepTitle || typeof masterStepTitle !== 'string') {
      console.error('無効なリクエスト: マスターステップのタイトルがありません');
      return NextResponse.json(
        { error: '学習ステップのタイトルが必要です' },
        { status: 400 }
      );
    }
    
    if (!category || !['language', 'programming', 'exam', 'hobby', 'other'].includes(category)) {
      console.error('無効なリクエスト: カテゴリが不正です');
      return NextResponse.json(
        { error: '有効な学習カテゴリが必要です' },
        { status: 400 }
      );
    }
    
    if (!level || !['beginner', 'intermediate', 'advanced'].includes(level)) {
      console.error('無効なリクエスト: レベルが不正です');
      return NextResponse.json(
        { error: '有効な学習レベルが必要です' },
        { status: 400 }
      );
    }
    
    // 利用可能時間のバリデーション（分単位、最低10分、最大240分）
    const validTimeAvailable = typeof timeAvailable === 'number' && !isNaN(timeAvailable) 
      ? Math.min(240, Math.max(10, timeAvailable)) 
      : 30; // デフォルト30分
    
    console.log(`日々のタスク生成開始: "${masterStepTitle}"`);
    console.log(`カテゴリ: ${category}, レベル: ${level}, 利用可能時間: ${validTimeAvailable}分`);
    
    try {
      const dailyTask = await generateDailyTask(
        masterStepTitle,
        category,
        level,
        validTimeAvailable,
        masterPlanDetails, // マスタープラン詳細情報を渡す
        Array.isArray(previousResults) ? previousResults : []
      );
      
      if (!dailyTask || typeof dailyTask !== 'object' || !dailyTask.title) {
        console.error('日々のタスク生成エラー: 無効な結果が返されました');
        return NextResponse.json(
          { error: '日々のタスクの生成に失敗しました。適切なタスクが生成されませんでした。' },
          { status: 500 }
        );
      }
      
      // 練習問題の数を確認
      if (!Array.isArray(dailyTask.exercises) || dailyTask.exercises.length === 0) {
        console.warn('日々のタスク生成警告: 練習問題がありません');
        
        // 最低限のダミー練習問題を追加
        dailyTask.exercises = [
          {
            question: `${masterStepTitle}に関する練習問題`,
            options: ['選択肢1', '選択肢2', '選択肢3', '選択肢4'],
            answer: '選択肢2',
            explanation: 'これはダミーの練習問題です。実際の問題は現在生成できませんでした。'
          }
        ];
      }
      
      // 活動リストの確認
      if (!Array.isArray(dailyTask.activities) || dailyTask.activities.length === 0) {
        console.warn('日々のタスク生成警告: 活動リストがありません');
        
        // 基本的な活動リストを追加
        dailyTask.activities = [
          '基本学習',
          '練習問題演習',
          '復習'
        ];
      }
      
      console.log(`日々のタスク生成完了: ${dailyTask.exercises.length}個の練習問題を含む`);
      return NextResponse.json(dailyTask);
    } catch (innerError) {
      console.error('日々のタスク生成処理エラー:', innerError);
      return NextResponse.json(
        { error: '日々のタスク生成中に内部エラーが発生しました' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('日々のタスクAPI全体エラー:', error);
    return NextResponse.json(
      { error: '日々のタスク生成中にエラーが発生しました' },
      { status: 500 }
    );
  }
} 