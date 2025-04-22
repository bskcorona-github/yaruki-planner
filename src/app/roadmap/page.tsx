'use client';

import { useState } from 'react';
import Header from '../components/Header';
import RoadmapView from '../components/RoadmapView';
import MicroTaskList from '../components/MicroTaskList';
import { Roadmap, RoadmapNode, MicroTask } from '../types';

export default function RoadmapPage() {
  const [roadmap, setRoadmap] = useState<Roadmap | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [goalInput, setGoalInput] = useState('');
  const [selectedNode, setSelectedNode] = useState<RoadmapNode | null>(null);
  const [microTasks, setMicroTasks] = useState<MicroTask[]>([]);
  
  // ユーザーレベルと時間枠のオプション
  const [userLevel, setUserLevel] = useState<'beginner' | 'intermediate' | 'advanced'>('beginner');
  const [timeframe, setTimeframe] = useState('');
  
  // ロードマップの生成
  const generateRoadmap = async () => {
    if (!goalInput.trim()) {
      setError('学習目標を入力してください');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/roadmap-generator', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          goal: goalInput,
          userLevel,
          timeframe,
          preferences: {}
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'ロードマップの生成に失敗しました');
      }
      
      const roadmapData = await response.json();
      setRoadmap(roadmapData);
      setSelectedNode(null);
      
      // ロードマップ生成時は小タスクをクリア
      setMicroTasks([]);
    } catch (error) {
      console.error('ロードマップ生成エラー:', error);
      setError(error instanceof Error ? error.message : '予期せぬエラーが発生しました');
    } finally {
      setIsLoading(false);
    }
  };
  
  // ノード選択時の処理
  const handleNodeSelect = (node: RoadmapNode) => {
    setSelectedNode(node);
  };
  
  // 小タスクの生成
  const generateMicroTasks = async (node: RoadmapNode, count: number) => {
    try {
      const response = await fetch('/api/micro-tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          node,
          count
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '小タスクの生成に失敗しました');
      }
      
      const newTasks = await response.json();
      
      // 既存のタスクを保持しつつ、新しいタスクを追加
      // 同じノードの既存タスクは削除して新しいタスクに置き換える
      setMicroTasks(prev => {
        const filteredTasks = prev.filter(task => task.roadmapNodeId !== node.id);
        return [...filteredTasks, ...newTasks];
      });
    } catch (error) {
      console.error('小タスク生成エラー:', error);
      throw error;
    }
  };
  
  // タスク完了状態の更新
  const handleCompleteTask = (taskId: string, completed: boolean) => {
    setMicroTasks(prev => 
      prev.map(task => 
        task.id === taskId 
          ? { ...task, status: completed ? 'completed' : 'pending' } 
          : task
      )
    );
  };
  
  return (
    <main className="min-h-screen bg-gray-50">
      <Header />
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 sm:px-0">
          <h1 className="text-2xl font-semibold text-gray-900 mb-6">学習ロードマップ</h1>
          
          {!roadmap && (
            <div className="bg-white shadow-sm rounded-lg p-6 mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">新しいロードマップを作成</h2>
              
              {error && (
                <div className="bg-red-50 text-red-900 p-3 rounded-md mb-4">
                  {error}
                </div>
              )}
              
              <div className="space-y-4">
                <div>
                  <label htmlFor="goal-input" className="block text-sm font-medium text-gray-900 mb-1">
                    学習目標
                  </label>
                  <textarea
                    id="goal-input"
                    rows={3}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border text-black"
                    placeholder="例: フロントエンドエンジニアになりたい、HTML/CSS/JavaScriptの基礎からReactまで学びたい"
                    value={goalInput}
                    onChange={(e) => setGoalInput(e.target.value)}
                    disabled={isLoading}
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="level-input" className="block text-sm font-medium text-gray-900 mb-1">
                      現在のレベル
                    </label>
                    <select
                      id="level-input"
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border text-black"
                      value={userLevel}
                      onChange={(e) => setUserLevel(e.target.value as 'beginner' | 'intermediate' | 'advanced')}
                      disabled={isLoading}
                    >
                      <option value="beginner">初心者（基本的な知識がない）</option>
                      <option value="intermediate">中級者（基礎知識はある）</option>
                      <option value="advanced">上級者（実務経験あり、専門知識を深めたい）</option>
                    </select>
                  </div>
                  
                  <div>
                    <label htmlFor="time-input" className="block text-sm font-medium text-gray-900 mb-1">
                      学習予定期間
                    </label>
                    <select
                      id="time-input"
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border text-black"
                      value={timeframe}
                      onChange={(e) => setTimeframe(e.target.value)}
                      disabled={isLoading}
                    >
                      <option value="">指定なし</option>
                      <option value="1週間">約1週間</option>
                      <option value="1ヶ月">約1ヶ月</option>
                      <option value="3ヶ月">約3ヶ月</option>
                      <option value="6ヶ月">約6ヶ月</option>
                      <option value="1年">約1年</option>
                    </select>
                  </div>
                </div>
                
                <div className="flex justify-end">
                  <button
                    type="button"
                    className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
                    onClick={generateRoadmap}
                    disabled={isLoading}
                  >
                    {isLoading ? 'ロードマップを生成中...' : 'ロードマップを生成'}
                  </button>
                </div>
              </div>
            </div>
          )}
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <RoadmapView 
                roadmap={roadmap} 
                onNodeSelect={handleNodeSelect}
                selectedNodeId={selectedNode?.id}
                microTasks={microTasks}
              />
            </div>
            
            <div className="lg:col-span-1">
              <MicroTaskList 
                node={selectedNode}
                tasks={microTasks}
                onGenerateTasks={generateMicroTasks}
                onCompleteTask={handleCompleteTask}
              />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
} 