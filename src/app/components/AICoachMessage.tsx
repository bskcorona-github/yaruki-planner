import { useState, useEffect } from 'react';
import { useTaskStore } from '../lib/store';
import { ExclamationCircleIcon } from '@heroicons/react/24/outline';

interface MotivationalMessage {
  greeting: string;
  message: string;
  urgentMessage: string;
  goals: string[];
  tips: string;
  closing: string;
}

export default function AICoachMessage() {
  const tasks = useTaskStore((state) => state.tasks);
  const [message, setMessage] = useState<MotivationalMessage>({
    greeting: 'おはようございます！',
    message: '今日も新しい一日の始まりです。目標達成に向けて一歩一歩進んでいきましょう。',
    urgentMessage: '',
    goals: ['未完了タスクの1つを完了させる', '新しい目標を設定する'],
    tips: '大きなタスクは小さく分けると達成しやすくなります。',
    closing: 'あなたならできます！'
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // タスク数が変更されたら自動的にメッセージを更新
    if (tasks.length > 0) {
      generateMotivationalMessage();
    }
  }, [tasks.length]);

  const generateMotivationalMessage = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/motivation-message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ tasks }),
      });
      
      if (!response.ok) {
        throw new Error('メッセージ生成に失敗しました');
      }
      
      const newMessage = await response.json();
      setMessage(newMessage);
    } catch (error) {
      console.error('モチベーションメッセージ生成エラー:', error);
      // エラー時はデフォルトメッセージを表示するだけにする
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white shadow-sm rounded-lg p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-gray-900">AIコーチメッセージ</h2>
        <button
          onClick={generateMotivationalMessage}
          disabled={isLoading}
          className="text-indigo-600 hover:text-indigo-800 text-xs font-medium"
        >
          {isLoading ? '更新中...' : '更新'}
        </button>
      </div>
      <div className={`text-sm text-gray-600 ${isLoading ? 'opacity-50' : ''}`}>
        <p className="mb-2">{message.greeting}</p>
        <p className="mb-4">{message.message}</p>
        
        {message.urgentMessage && (
          <div className="p-3 bg-red-50 text-red-700 rounded-md mb-4 flex items-start">
            <ExclamationCircleIcon className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
            <p>{message.urgentMessage}</p>
          </div>
        )}
        
        <p className="mb-2">今日の目標：</p>
        <ul className="list-disc pl-5 mb-4">
          {message.goals.map((goal, index) => (
            <li key={index}>{goal}</li>
          ))}
        </ul>
        
        <div className="p-3 bg-indigo-50 text-indigo-700 rounded-md mb-4">
          <p className="font-medium mb-1">学習のヒント</p>
          <p>{message.tips}</p>
        </div>
        
        <p>{message.closing}</p>
      </div>
    </div>
  );
} 