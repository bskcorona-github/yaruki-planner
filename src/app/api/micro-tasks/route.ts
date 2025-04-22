import { NextResponse } from 'next/server';
import { generateMicroTasks } from '@/app/lib/openai';
import { RoadmapNode } from '@/app/types';

export async function POST(request: Request) {
  try {
    const { node, count } = await request.json();
    
    if (!node || typeof node !== 'object') {
      console.error('無効なリクエスト: ロードマップノードが指定されていません');
      return NextResponse.json(
        { error: '有効なロードマップノードが必要です' },
        { status: 400 }
      );
    }
    
    console.log(`小タスク生成開始: "${node.title}"`);
    
    try {
      // 型チェックと必須フィールドの確認
      const validNode: RoadmapNode = {
        id: node.id || crypto.randomUUID(),
        title: node.title || '不明なトピック',
        description: node.description || '説明なし',
        level: node.level || 'beginner',
        category: node.category || 'general',
        importance: node.importance || 'recommended',
        estimatedHours: node.estimatedHours || 1
      };
      
      const microTasks = await generateMicroTasks(
        validNode,
        typeof count === 'number' && count > 0 ? count : 5
      );
      
      console.log(`小タスク生成完了: ${microTasks.length}タスク`);
      
      if (!Array.isArray(microTasks) || microTasks.length === 0) {
        console.error('小タスク生成エラー: タスクが生成されませんでした');
        return NextResponse.json(
          { error: '小タスクの生成に失敗しました。有効なタスクが生成されませんでした。' },
          { status: 500 }
        );
      }
      
      return NextResponse.json(microTasks);
    } catch (innerError) {
      console.error('小タスク生成処理エラー:', innerError);
      return NextResponse.json(
        { error: '小タスク生成中に内部エラーが発生しました' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('小タスクAPI全体エラー:', error);
    return NextResponse.json(
      { error: '小タスク生成中にエラーが発生しました' },
      { status: 500 }
    );
  }
} 