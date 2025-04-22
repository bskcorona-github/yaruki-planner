'use client';

import { useState } from 'react';
import { MicroTask, RoadmapNode } from '../types';

interface MicroTaskListProps {
  node: RoadmapNode | null;
  tasks: MicroTask[];
  onGenerateTasks: (node: RoadmapNode, count: number) => Promise<void>;
  onCompleteTask: (taskId: string, completed: boolean) => void;
}

export default function MicroTaskList({ node, tasks, onGenerateTasks, onCompleteTask }: MicroTaskListProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [taskCount, setTaskCount] = useState(5);
  
  if (!node) {
    return (
      <div className="bg-white shadow-sm rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">小タスク</h2>
        <div className="flex items-center justify-center h-40 bg-gray-50 rounded-md">
          <p className="text-gray-900">ロードマップのノードを選択すると、関連する小タスクが表示されます</p>
        </div>
      </div>
    );
  }
  
  const nodeTasks = tasks.filter(task => task.roadmapNodeId === node.id);
  const selectedTask = selectedTaskId ? tasks.find(task => task.id === selectedTaskId) : null;
  
  const handleGenerateTasks = async () => {
    try {
      setIsLoading(true);
      await onGenerateTasks(node, taskCount);
    } catch (error) {
      console.error('タスク生成エラー:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-100 text-green-900';
      case 'medium': return 'bg-yellow-100 text-yellow-900';
      case 'hard': return 'bg-red-100 text-red-900';
      default: return 'bg-gray-100 text-gray-900';
    }
  };
  
  const getTypeColor = (type: string) => {
    switch (type) {
      case 'reading': return 'bg-blue-100 text-blue-900';
      case 'exercise': return 'bg-purple-100 text-purple-900';
      case 'project': return 'bg-indigo-100 text-indigo-900';
      case 'quiz': return 'bg-orange-100 text-orange-900';
      case 'practice': return 'bg-teal-100 text-teal-900';
      default: return 'bg-gray-100 text-gray-900';
    }
  };
  
  return (
    <div className="bg-white shadow-sm rounded-lg p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-gray-900">
          「{node.title}」の小タスク
        </h2>
        <div className="flex items-center space-x-2">
          <select
            className="border border-gray-300 rounded-md text-sm p-1"
            value={taskCount}
            onChange={(e) => setTaskCount(Number(e.target.value))}
            disabled={isLoading}
          >
            {[3, 5, 7, 10].map(count => (
              <option key={count} value={count}>{count}個</option>
            ))}
          </select>
          <button
            className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50"
            onClick={handleGenerateTasks}
            disabled={isLoading}
          >
            {isLoading ? '生成中...' : 'タスク生成'}
          </button>
        </div>
      </div>
      
      {nodeTasks.length === 0 ? (
        <div className="flex items-center justify-center h-40 bg-gray-50 rounded-md mb-4">
          <p className="text-gray-900">まだタスクがありません。「タスク生成」ボタンをクリックして作成してください。</p>
        </div>
      ) : (
        <div className="mb-4">
          {selectedTask ? (
            <div className="border rounded-md p-4 mb-4">
              <div className="flex justify-between items-start mb-3">
                <h3 className="text-md font-medium text-gray-900">{selectedTask.title}</h3>
                <button
                  className="text-gray-900 hover:text-black"
                  onClick={() => setSelectedTaskId(null)}
                >
                  ×
                </button>
              </div>
              
              <div className="flex flex-wrap gap-2 mb-3">
                <span className={`px-2 py-1 text-xs rounded-full ${getTypeColor(selectedTask.type)}`}>
                  {selectedTask.type}
                </span>
                <span className={`px-2 py-1 text-xs rounded-full ${getDifficultyColor(selectedTask.difficulty)}`}>
                  {selectedTask.difficulty}
                </span>
                <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-900">
                  {selectedTask.estimatedMinutes}分
                </span>
              </div>
              
              <p className="text-gray-900 mb-3">{selectedTask.description}</p>
              
              {selectedTask.instructions && (
                <div className="mb-3">
                  <h4 className="font-medium text-gray-900 mb-1">手順</h4>
                  <div className="bg-gray-50 p-3 rounded-md text-sm text-gray-900 whitespace-pre-line">
                    {selectedTask.instructions}
                  </div>
                </div>
              )}
              
              {selectedTask.resources && selectedTask.resources.length > 0 && (
                <div className="mb-3">
                  <h4 className="font-medium text-gray-900 mb-1">リソース</h4>
                  <ul className="list-disc list-inside text-sm text-gray-900">
                    {selectedTask.resources.map((resource, index) => (
                      <li key={index}>{resource}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              {selectedTask.hints && selectedTask.hints.length > 0 && (
                <div className="mb-3">
                  <h4 className="font-medium text-gray-900 mb-1">ヒント</h4>
                  <ul className="list-disc list-inside text-sm text-gray-900">
                    {selectedTask.hints.map((hint, index) => (
                      <li key={index}>{hint}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              <div className="mt-4 pt-4 border-t">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={selectedTask.status === 'completed'}
                    onChange={(e) => onCompleteTask(selectedTask.id, e.target.checked)}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-900">このタスクを完了としてマークする</span>
                </label>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-2 max-h-[400px] overflow-y-auto pr-2">
              {nodeTasks.map(task => (
                <div 
                  key={task.id}
                  className={`border rounded-md p-3 cursor-pointer hover:border-indigo-300 hover:bg-indigo-50 ${
                    task.status === 'completed' ? 'bg-green-50 border-green-200' : ''
                  }`}
                  onClick={() => setSelectedTaskId(task.id)}
                >
                  <div className="flex items-start">
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-medium text-gray-900 flex items-center">
                          {task.status === 'completed' && (
                            <span className="mr-1 text-green-600">✓</span>
                          )}
                          {task.title}
                        </h3>
                        <div className="flex flex-wrap gap-1">
                          <span className={`px-2 py-0.5 text-xs rounded-full ${getTypeColor(task.type)}`}>
                            {task.type}
                          </span>
                          <span className={`px-2 py-0.5 text-xs rounded-full ${getDifficultyColor(task.difficulty)}`}>
                            {task.difficulty}
                          </span>
                        </div>
                      </div>
                      <p className="mt-1 text-xs text-gray-900 line-clamp-2">{task.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
} 