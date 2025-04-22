'use client';

import Header from './components/Header';
import TaskInput from './components/TaskInput';
import TaskList from './components/TaskList';
import ProgressSummary from './components/ProgressSummary';
import InsightPanel from './components/InsightPanel';
import AICoachMessage from './components/AICoachMessage';

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50">
      <Header />
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 sm:px-0">
          <h1 className="text-2xl font-semibold text-gray-900 mb-6">やるきプランナー</h1>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <TaskInput />
              <InsightPanel />
              <div className="bg-white shadow-sm rounded-lg p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">タスク一覧</h2>
                <TaskList />
              </div>
            </div>
            
            <div className="lg:col-span-1">
              <ProgressSummary />
              <AICoachMessage />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
