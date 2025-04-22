'use client'

import { useState } from 'react';
import { useTaskStore } from '../lib/store';
import { LightBulbIcon } from '@heroicons/react/24/outline';
import { PlusIcon } from '@heroicons/react/24/outline';
import { generateTask } from '../lib/openai';

interface TaskDetails {
  title: string;
  description: string;
  dueDate: Date | null;
  priority: 'high' | 'medium' | 'low';
  estimatedTime: number;
  needsMoreInfo: boolean;
  questions: string[];
}

export default function TaskInput() {
  const [taskText, setTaskText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isQuestioning, setIsQuestioning] = useState(false);
  const [questions, setQuestions] = useState<string[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [taskDetails, setTaskDetails] = useState<TaskDetails | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [goal, setGoal] = useState('');
  
  const addTask = useTaskStore((state) => state.addTask);
  const subdivideTask = useTaskStore((state) => state.subdivideTask);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskText.trim()) {
      setError('タスクを入力してください');
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);
    
    try {
      const task = await generateTask(taskText, goal);
      addTask(task);
      setTaskText('');
      setGoal('');
    } catch (error) {
      console.error('Task generation error:', error);
      setError('タスク生成中にエラーが発生しました。もう一度お試しください。');
    } finally {
      setIsLoading(false);
    }
  };

  // 質問への回答を処理する関数
  const handleAnswerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentAnswer.trim() || !taskDetails) return;

    // 回答を保存
    const updatedAnswers = {
      ...answers,
      [questions[currentQuestionIndex]]: currentAnswer
    };
    setAnswers(updatedAnswers);
    setCurrentAnswer('');

    // 次の質問があればインデックスを進める、なければタスク作成
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      // 全ての質問が終わったらタスク作成
      setIsLoading(true);
      setIsQuestioning(false);
      await createTaskWithDetails(taskDetails, updatedAnswers);
    }
  };

  // タスクとサブタスクを作成する関数
  const createTaskWithDetails = async (details: TaskDetails, additionalInfo: Record<string, string> = {}) => {
    try {
      // 新しいタスクを作成
      const newTask = addTask({
        title: details.title,
        description: details.description,
        dueDate: details.dueDate,
        priority: details.priority,
        estimatedTime: details.estimatedTime,
      });
      
      console.log('新しいタスクを作成しました:', newTask);
      
      // サブタスク生成APIを呼び出し
      setError(null);
      setSuccessMessage('学習プランを作成中です...');
      
      const subtasksResponse = await fetch('/api/subtask-generator', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          taskTitle: newTask.title, 
          taskDescription: newTask.description,
          additionalInfo
        }),
      });
      
      let subtasks = [];
      
      try {
        const responseData = await subtasksResponse.json();
        
        if (!subtasksResponse.ok) {
          throw new Error(responseData.error || 'サブタスクの生成に失敗しました。適切なタスクが生成されませんでした。');
        }
        
        subtasks = responseData;
      } catch (parseError) {
        console.error('サブタスクレスポンスの解析エラー:', parseError);
        throw new Error('サブタスクデータの解析に失敗しました。もう一度お試しください。');
      }
      
      // サブタスクをストアに追加
      if (Array.isArray(subtasks) && subtasks.length > 0) {
        subdivideTask(newTask.id, subtasks);
        setSuccessMessage(`${subtasks.length}項目の学習スケジュールを作成しました。`);
        console.log(`${subtasks.length}個のサブタスクを生成しました`);
      } else {
        console.error('サブタスク生成失敗:', subtasks);
        setError('学習スケジュールの生成に失敗しました。もう一度お試しください。');
      }
      
      // 入力フォームをリセット
      setTaskText('');
      setTaskDetails(null);
      setIsLoading(false);
    } catch (error) {
      console.error('タスク作成エラー:', error);
      setError(error instanceof Error ? error.message : '予期せぬエラーが発生しました');
      setIsLoading(false);
    }
  };

  // 質問モードのUI
  if (isQuestioning && taskDetails) {
    return (
      <div className="bg-white shadow-sm rounded-lg p-6 mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">追加情報が必要です</h2>
        <div className="mb-4">
          <p className="text-sm text-gray-700 mb-2">
            目標「{taskDetails.title}」の詳細な学習計画を立てるために、いくつか質問に答えてください：
          </p>
          <div className="bg-amber-50 p-3 rounded-md mb-4">
            <p className="font-medium text-gray-900 flex items-center">
              <LightBulbIcon className="h-5 w-5 text-amber-500 mr-2" />
              質問 {currentQuestionIndex + 1}/{questions.length}
            </p>
            <p className="text-gray-800 mt-1">{questions[currentQuestionIndex]}</p>
          </div>
        </div>
        <form onSubmit={handleAnswerSubmit} className="space-y-4">
          <input
            type="text"
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border text-black"
            placeholder="回答を入力してください"
            value={currentAnswer}
            onChange={(e) => setCurrentAnswer(e.target.value)}
            autoFocus
          />
          <div className="flex justify-between">
            <button
              type="button"
              className="inline-flex justify-center rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
              onClick={() => {
                setIsQuestioning(false);
                setTaskText('');
              }}
            >
              キャンセル
            </button>
            <button
              type="submit"
              className="inline-flex justify-center rounded-md border border-transparent px-4 py-2 text-sm font-medium text-white shadow-sm bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            >
              {currentQuestionIndex < questions.length - 1 ? '次へ' : '完了'}
            </button>
          </div>
        </form>
      </div>
    );
  }

  // 通常の入力フォームUI
  return (
    <div className="bg-white shadow-sm rounded-lg p-4 mb-6">
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label 
            htmlFor="taskContent" 
            className="block text-sm font-medium text-gray-900 mb-1"
          >
            新しいタスク
          </label>
          <textarea
            id="taskContent"
            rows={2}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border text-black"
            placeholder="何をしたいですか？例：JavaScriptの基本を学ぶ"
            value={taskText}
            onChange={(e) => setTaskText(e.target.value)}
            disabled={isLoading}
          />
        </div>
        
        <div className="mb-4">
          <label 
            htmlFor="taskGoal" 
            className="block text-sm font-medium text-gray-900 mb-1"
          >
            目標（任意）
          </label>
          <input
            type="text"
            id="taskGoal"
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border text-black"
            placeholder="例：フロントエンドエンジニアになる"
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            disabled={isLoading}
          />
          <p className="mt-1 text-sm text-gray-900">
            目標を設定するとAIがより適切なタスクを提案します
          </p>
        </div>

        {successMessage && (
          <div className="bg-green-50 text-green-800 p-3 rounded-md mb-4">
            {successMessage}
          </div>
        )}

        {error && (
          <div className="text-red-600 text-sm mb-4">
            {error}
          </div>
        )}

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isLoading}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            {isLoading ? (
              <span>生成中...</span>
            ) : (
              <>
                <PlusIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
                <span>タスクを追加</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
} 