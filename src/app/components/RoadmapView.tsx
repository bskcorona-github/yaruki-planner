'use client';

import { useState } from 'react';
import { Roadmap, RoadmapNode, MicroTask } from '../types';

interface RoadmapViewProps {
  roadmap: Roadmap | null;
  onNodeSelect: (node: RoadmapNode) => void;
  selectedNodeId?: string;
  microTasks?: MicroTask[];
}

export default function RoadmapView({ roadmap, onNodeSelect, selectedNodeId, microTasks = [] }: RoadmapViewProps) {
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({});
  
  if (!roadmap) {
    return (
      <div className="bg-white shadow-sm rounded-lg p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">学習ロードマップ</h2>
        <div className="flex items-center justify-center h-40 bg-gray-50 rounded-md">
          <p className="text-gray-900">ロードマップがまだ作成されていません</p>
        </div>
      </div>
    );
  }
  
  const toggleNode = (nodeId: string) => {
    setExpandedNodes(prev => ({
      ...prev,
      [nodeId]: !prev[nodeId]
    }));
  };
  
  const renderNode = (node: RoadmapNode, depth = 0) => {
    const isSelected = node.id === selectedNodeId;
    const isExpanded = expandedNodes[node.id] ?? true;
    const hasChildren = node.children && node.children.length > 0;
    const hasCompletedTasks = microTasks.some(task => 
      task.roadmapNodeId === node.id && task.status === 'completed'
    );
    
    // 重要度に基づいてスタイルを設定
    let importanceBadgeColor = 'bg-gray-100 text-gray-900';
    if (node.importance === 'essential') {
      importanceBadgeColor = 'bg-red-100 text-red-900';
    } else if (node.importance === 'recommended') {
      importanceBadgeColor = 'bg-blue-100 text-blue-900';
    }
    
    // レベルに基づいてスタイルを設定
    let levelBadgeColor = 'bg-green-100 text-green-900';
    if (node.level === 'intermediate') {
      levelBadgeColor = 'bg-yellow-100 text-yellow-900';
    } else if (node.level === 'advanced') {
      levelBadgeColor = 'bg-purple-100 text-purple-900';
    }
    
    return (
      <div key={node.id} style={{ marginLeft: `${depth * 20}px` }} className="mb-3">
        <div 
          className={`flex items-start border rounded-md p-3 ${isSelected ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200'}`}
        >
          <div className="flex-1">
            <div className="flex items-center mb-1">
              {hasChildren && (
                <button
                  onClick={() => toggleNode(node.id)}
                  className="mr-2 text-gray-700 hover:text-black"
                >
                  {isExpanded ? '▼' : '▶'}
                </button>
              )}
              
              <h3 
                className="text-md font-medium text-gray-900 cursor-pointer hover:text-indigo-600"
                onClick={() => onNodeSelect(node)}
              >
                {node.title}
                {hasCompletedTasks && (
                  <span className="ml-2 text-green-600">✓</span>
                )}
              </h3>
            </div>
            
            <div className="mt-1 flex flex-wrap gap-2">
              <span className={`px-2 py-1 text-xs rounded-full ${importanceBadgeColor}`}>
                {node.importance}
              </span>
              <span className={`px-2 py-1 text-xs rounded-full ${levelBadgeColor}`}>
                {node.level}
              </span>
              <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-900">
                {node.estimatedHours}時間
              </span>
            </div>
            
            {isSelected && (
              <p className="mt-2 text-sm text-gray-900">{node.description}</p>
            )}
          </div>
        </div>
        
        {hasChildren && isExpanded && (
          <div className="mt-2 border-l-2 border-gray-200 pl-2">
            {node.children?.map(childNode => renderNode(childNode, depth + 1))}
          </div>
        )}
      </div>
    );
  };
  
  return (
    <div className="bg-white shadow-sm rounded-lg p-6 mb-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-gray-900">{roadmap.title}</h2>
        <span className="text-sm text-gray-900">合計: {roadmap.estimatedTotalHours}時間</span>
      </div>
      
      <p className="text-gray-900 mb-4">{roadmap.description}</p>
      
      <div className="mb-6">
        <h3 className="font-medium text-gray-900 mb-2">目標</h3>
        <p className="text-gray-900 bg-indigo-50 p-3 rounded-md">{roadmap.goalDescription}</p>
      </div>
      
      <div className="border-t pt-4">
        <h3 className="font-medium text-gray-900 mb-2">学習パス</h3>
        <div className="max-h-[400px] overflow-y-auto pr-2">
          {roadmap.nodes.map(node => renderNode(node))}
        </div>
      </div>
    </div>
  );
} 