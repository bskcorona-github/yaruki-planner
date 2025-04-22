'use client';

import { useState } from 'react';
import { LightBulbIcon, MapIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';

export default function InsightPanel() {
  const [insights] = useState<string[]>([
    '今週は前週比20%多くのタスクを完了しました！',
    '最も集中できる時間帯は午前中のようです。',
    '定期的な復習タスクを設定すると学習効果が高まります。',
  ]);

  return (
    <div className="bg-white shadow-sm rounded-lg p-6 mb-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-gray-900">学習のヒント</h2>
        <span className="text-sm text-gray-900">最終更新: 今日</span>
      </div>
      
      <div className="bg-amber-50 border border-amber-100 rounded-lg p-4 mb-4">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <MapIcon className="h-6 w-6 text-amber-600" aria-hidden="true" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-amber-900">新機能: 学習ロードマップ</h3>
            <div className="mt-2 text-sm text-amber-900">
              <p>
                新しく追加された学習ロードマップ機能を使って、学習目標を達成するための具体的な道筋を作成できます。
                各ステップには実践的な小タスクが生成され、効果的な学習をサポートします。
              </p>
              <div className="mt-2">
                <Link 
                  href="/roadmap" 
                  className="text-amber-900 font-medium hover:text-black underline"
                >
                  ロードマップを作成する →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <ul className="divide-y divide-gray-200">
        {insights.map((insight, index) => (
          <li key={index} className="py-3 flex items-start">
            <div className="flex-shrink-0">
              <LightBulbIcon className="h-5 w-5 text-yellow-500" aria-hidden="true" />
            </div>
            <p className="ml-3 text-sm text-gray-900">{insight}</p>
          </li>
        ))}
      </ul>
    </div>
  );
} 