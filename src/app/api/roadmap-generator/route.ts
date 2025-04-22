import { NextResponse } from 'next/server';
import { generateRoadmap } from '@/app/lib/openai';
import { LearningLevel } from '@/app/types';

export async function POST(request: Request) {
  try {
    const { goal, timeframe, userLevel, preferences } = await request.json();
    
    if (!goal || typeof goal !== 'string') {
      console.error('無効なリクエスト: 目標が指定されていません');
      return NextResponse.json(
        { error: '学習目標または目的が必要です' },
        { status: 400 }
      );
    }
    
    console.log(`ロードマップ生成開始: "${goal}"`);
    console.log(`時間枠: ${timeframe || '未指定'}, レベル: ${userLevel || '未指定'}`);
    
    try {
      const roadmap = await generateRoadmap(
        goal,
        timeframe,
        userLevel as LearningLevel,
        preferences
      );
      
      console.log(`ロードマップ生成完了: ${roadmap.nodes.length}ノード`);
      
      if (!roadmap || !Array.isArray(roadmap.nodes) || roadmap.nodes.length === 0) {
        console.error('ロードマップ生成エラー: 有効なノードがありません');
        return NextResponse.json(
          { error: 'ロードマップの生成に失敗しました。適切なパスが生成されませんでした。' },
          { status: 500 }
        );
      }
      
      return NextResponse.json(roadmap);
    } catch (innerError) {
      console.error('ロードマップ生成処理エラー:', innerError);
      return NextResponse.json(
        { error: 'ロードマップ生成中に内部エラーが発生しました' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('ロードマップAPI全体エラー:', error);
    return NextResponse.json(
      { error: 'ロードマップ生成中にエラーが発生しました' },
      { status: 500 }
    );
  }
} 