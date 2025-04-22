import { LightBulbIcon, ExclamationTriangleIcon, HeartIcon, ChartBarIcon } from '@heroicons/react/24/outline';
import { useTaskStore } from '../lib/store';
import { useState, useEffect } from 'react';
import { TaskInsight } from '../types';

export default function InsightPanel() {
  const insights = useTaskStore((state) => state.insights);
  const tasks = useTaskStore((state) => state.tasks);
  const generateInsight = useTaskStore((state) => state.generateInsight);
  const [latestInsight, setLatestInsight] = useState<TaskInsight | null>(null);

  useEffect(() => {
    if (insights.length > 0) {
      // 最新のインサイトを取得
      const latest = [...insights].sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )[0];
      setLatestInsight(latest);
    } else if (tasks.length > 0) {
      // タスクはあるがインサイトがない場合、モック用のインサイトを生成
      generateMockInsight();
    }
  }, [insights, tasks]);

  // モック用のインサイト生成（実際の実装ではAI APIを使用）
  const generateMockInsight = () => {
    const mockInsights = [
      {
        type: 'advice' as const,
        content: '大きなタスクを小さく分割すると、達成感を得やすくなります。'
      },
      {
        type: 'motivation' as const,
        content: '継続は力なり！毎日少しずつ進めることで大きな目標も達成できます。'
      },
      {
        type: 'warning' as const,
        content: '締め切りが近いタスクがあります。優先度を上げて取り組みましょう。'
      },
      {
        type: 'analysis' as const,
        content: '午前中にタスクを完了させる傾向があります。この時間帯を活用しましょう。'
      }
    ];
    
    const randomInsight = mockInsights[Math.floor(Math.random() * mockInsights.length)];
    const taskId = tasks[0].id; // 最初のタスクIDを使用
    
    generateInsight(taskId, randomInsight.type, randomInsight.content);
  };

  if (!latestInsight) {
    return null;
  }

  const getIconByType = (type: TaskInsight['type']) => {
    switch (type) {
      case 'advice':
        return <LightBulbIcon className="h-5 w-5 text-amber-500" />;
      case 'warning':
        return <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />;
      case 'motivation':
        return <HeartIcon className="h-5 w-5 text-pink-500" />;
      case 'analysis':
        return <ChartBarIcon className="h-5 w-5 text-blue-500" />;
    }
  };

  const getBgColorByType = (type: TaskInsight['type']) => {
    switch (type) {
      case 'advice':
        return 'bg-amber-50';
      case 'warning':
        return 'bg-red-50';
      case 'motivation':
        return 'bg-pink-50';
      case 'analysis':
        return 'bg-blue-50';
    }
  };

  const getTitleByType = (type: TaskInsight['type']) => {
    switch (type) {
      case 'advice':
        return 'アドバイス';
      case 'warning':
        return '注意';
      case 'motivation':
        return 'モチベーション';
      case 'analysis':
        return '分析';
    }
  };

  return (
    <div className={`p-4 rounded-lg mb-8 ${getBgColorByType(latestInsight.type)}`}>
      <div className="flex items-start">
        <div className="flex-shrink-0">
          {getIconByType(latestInsight.type)}
        </div>
        <div className="ml-3">
          <h3 className="text-sm font-medium text-gray-900">
            {getTitleByType(latestInsight.type)}
          </h3>
          <div className="mt-2 text-sm text-gray-700">
            <p>{latestInsight.content}</p>
          </div>
        </div>
      </div>
    </div>
  );
} 