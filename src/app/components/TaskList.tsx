import { useState, useEffect } from 'react';
import { useTaskStore } from '../lib/store';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import { CheckCircleIcon, ClockIcon, TrashIcon, ChevronDownIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { Task } from '../types';

export default function TaskList() {
  const tasks = useTaskStore((state) => state.tasks);
  const completeTask = useTaskStore((state) => state.completeTask);
  const deleteTask = useTaskStore((state) => state.deleteTask);
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);

  // 初期状態では親タスクは全て展開する
  useEffect(() => {
    const parentTasks = tasks.filter(task => !task.parentTaskId);
    if (parentTasks.length > 0 && expandedTaskId === null) {
      setExpandedTaskId(parentTasks[0].id);
    }
  }, [tasks]);

  const priorityColorMap = {
    high: 'text-red-600 bg-red-50',
    medium: 'text-yellow-600 bg-yellow-50',
    low: 'text-green-600 bg-green-50',
  };

  const statusColorMap = {
    'pending': 'text-gray-900 bg-gray-50',
    'in-progress': 'text-blue-600 bg-blue-50',
    'completed': 'text-green-600 bg-green-50 line-through',
  };

  const toggleExpanded = (taskId: string) => {
    setExpandedTaskId(expandedTaskId === taskId ? null : taskId);
  };

  if (tasks.length === 0) {
    return (
      <div className="text-center py-12">
        <h3 className="mt-2 text-lg font-medium text-gray-900">タスクがありません</h3>
        <p className="mt-1 text-sm text-gray-900">
          新しいタスクを追加して、目標達成に近づきましょう。
        </p>
      </div>
    );
  }

  // 親タスク（parentTaskIdがないもの）を取得
  const parentTasks = tasks.filter(task => !task.parentTaskId);
  
  // 親タスクがなく、すべてサブタスクの場合は「メインタスクなし」メッセージを表示
  if (parentTasks.length === 0 && tasks.length > 0) {
    return (
      <div className="text-center py-12">
        <h3 className="mt-2 text-lg font-medium text-gray-900">メインタスクがありません</h3>
        <p className="mt-1 text-sm text-gray-900">
          何か問題が発生しているようです。新しい目標を設定してください。
        </p>
      </div>
    );
  }
  
  // 日付でソートする関数
  const sortByDate = (a: Task, b: Task) => {
    if (!a.dueDate) return 1;  // nullは後ろへ
    if (!b.dueDate) return -1; // nullは後ろへ
    return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
  };
  
  return (
    <div className="bg-white shadow-sm rounded-lg overflow-hidden">
      <ul role="list" className="divide-y divide-gray-200">
        {parentTasks.map((task) => {
          const isExpanded = expandedTaskId === task.id;
          const childTasks = tasks
            .filter(t => t.parentTaskId === task.id)
            .sort(sortByDate);
          
          return (
            <li key={task.id} className="relative">
              <div 
                className={`px-4 py-4 sm:px-6 ${task.status === 'completed' ? 'bg-gray-50' : 'bg-white'} hover:bg-gray-50 cursor-pointer`}
                onClick={() => toggleExpanded(task.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        completeTask(task.id);
                      }}
                      className="mr-3 text-gray-600 hover:text-green-500"
                    >
                      <CheckCircleIcon className={`h-6 w-6 ${task.status === 'completed' ? 'text-green-500' : ''}`} />
                    </button>
                    <div>
                      <p className={`text-sm font-medium ${statusColorMap[task.status]}`}>
                        {task.title}
                      </p>
                      {task.description && (
                        <p className="mt-1 text-xs text-gray-900 line-clamp-1">
                          {task.description}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center">
                    <span className={`inline-flex rounded-full px-2 text-xs font-semibold mx-2 ${priorityColorMap[task.priority]}`}>
                      {task.priority === 'high' ? '高' : task.priority === 'medium' ? '中' : '低'}
                    </span>
                    {task.dueDate && (
                      <div className="flex items-center text-sm text-gray-900 mr-4">
                        <ClockIcon className="h-4 w-4 mr-1" />
                        {format(new Date(task.dueDate), 'yyyy/MM/dd', { locale: ja })}
                      </div>
                    )}
                    {childTasks.length > 0 && (
                      <span className="mr-2 text-indigo-600 flex items-center">
                        {isExpanded ? 
                          <ChevronDownIcon className="h-5 w-5" /> : 
                          <ChevronRightIcon className="h-5 w-5" />
                        }
                      </span>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteTask(task.id);
                      }}
                      className="text-gray-600 hover:text-red-500"
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </div>
                </div>
                {childTasks.length > 0 && (
                  <div className="mt-2 text-xs text-indigo-600">
                    学習スケジュール: {childTasks.length}ステップ
                  </div>
                )}
              </div>
              
              {/* サブタスク */}
              {isExpanded && childTasks.length > 0 && (
                <div className="bg-gray-50 p-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">学習スケジュール</h4>
                  <div className="space-y-3">
                    {childTasks.map((childTask, index) => (
                      <div key={childTask.id} className="bg-white rounded-md p-3 shadow-sm">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start">
                            <button
                              onClick={() => completeTask(childTask.id)}
                              className="mt-0.5 mr-3 text-gray-600 hover:text-green-500"
                            >
                              <CheckCircleIcon className={`h-5 w-5 ${childTask.status === 'completed' ? 'text-green-500' : ''}`} />
                            </button>
                            <div>
                              <div className="flex items-center">
                                <span className="text-xs font-semibold text-gray-900 mr-2">ステップ {index + 1}</span>
                                <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${priorityColorMap[childTask.priority]}`}>
                                  {childTask.priority === 'high' ? '高優先' : childTask.priority === 'medium' ? '中優先' : '低優先'}
                                </span>
                              </div>
                              <p className={`text-sm font-medium mt-1 ${childTask.status === 'completed' ? 'line-through text-gray-700' : 'text-gray-900'}`}>
                                {childTask.title}
                              </p>
                              {childTask.description && (
                                <p className="mt-1 text-xs text-gray-900">
                                  {childTask.description}
                                </p>
                              )}
                              <div className="mt-2 flex items-center text-xs text-gray-900">
                                {childTask.dueDate && (
                                  <span className="flex items-center mr-3">
                                    <ClockIcon className="h-3 w-3 mr-1" />
                                    {format(new Date(childTask.dueDate), 'MM/dd', { locale: ja })}まで
                                  </span>
                                )}
                                {childTask.estimatedTime && (
                                  <span>
                                    約{childTask.estimatedTime}分
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <button
                            onClick={() => deleteTask(childTask.id)}
                            className="ml-2 text-gray-600 hover:text-red-500"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
} 