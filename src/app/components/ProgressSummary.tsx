import { useTaskStore } from '../lib/store';

export default function ProgressSummary() {
  const tasks = useTaskStore((state) => state.tasks);
  
  // タスク集計
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(task => task.status === 'completed').length;
  const inProgressTasks = tasks.filter(task => task.status === 'in-progress').length;
  const pendingTasks = tasks.filter(task => task.status === 'pending').length;
  
  // 進捗率（パーセント）
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  
  return (
    <div className="bg-white shadow-sm rounded-lg p-6 mb-8">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">進捗状況</h2>
      
      <div className="flex flex-col sm:flex-row justify-between mb-6">
        <div className="text-center mb-4 sm:mb-0">
          <span className="block text-2xl font-bold text-indigo-600">{totalTasks}</span>
          <span className="text-sm text-gray-500">総タスク数</span>
        </div>
        <div className="text-center mb-4 sm:mb-0">
          <span className="block text-2xl font-bold text-green-600">{completedTasks}</span>
          <span className="text-sm text-gray-500">完了</span>
        </div>
        <div className="text-center mb-4 sm:mb-0">
          <span className="block text-2xl font-bold text-blue-600">{inProgressTasks}</span>
          <span className="text-sm text-gray-500">進行中</span>
        </div>
        <div className="text-center">
          <span className="block text-2xl font-bold text-amber-600">{pendingTasks}</span>
          <span className="text-sm text-gray-500">未着手</span>
        </div>
      </div>
      
      <div className="mb-2 flex justify-between">
        <span className="text-sm font-medium text-gray-700">進捗率</span>
        <span className="text-sm font-medium text-gray-700">{completionRate}%</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2.5">
        <div 
          className="bg-indigo-600 h-2.5 rounded-full" 
          style={{ width: `${completionRate}%` }}
        ></div>
      </div>
      
      {totalTasks > 0 ? (
        <div className="mt-4 text-sm text-center text-gray-900">
          {
            completionRate >= 80 ? "素晴らしい進捗です！あと少しで完了です！" :
            completionRate >= 50 ? "良い進捗です！引き続き頑張りましょう。" :
            completionRate >= 20 ? "順調に進んでいます。一歩一歩着実に！" :
            "始めたばかりですね。小さな一歩から始めましょう！"
          }
        </div>
      ) : (
        <div className="mt-4 text-sm text-center text-gray-900">
          タスクを追加して目標達成へ向けて進みましょう！
        </div>
      )}
    </div>
  );
} 