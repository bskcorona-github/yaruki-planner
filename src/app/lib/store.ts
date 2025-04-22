import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { Task, TaskInsight, ProgressData } from '../types';

interface TaskStore {
  tasks: Task[];
  insights: TaskInsight[];
  progressData: ProgressData[];
  
  // タスク操作
  addTask: (taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'status'>) => Task;
  updateTask: (id: string, taskData: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  completeTask: (id: string) => void;
  
  // AIによるタスク処理
  subdivideTask: (taskId: string, subTasks: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'status' | 'parentTaskId'>[]) => void;
  generateInsight: (taskId: string, type: TaskInsight['type'], content: string) => void;
  
  // 分析データ
  addProgressData: (data: Omit<ProgressData, 'date'>) => void;
}

export const useTaskStore = create<TaskStore>((set) => ({
  tasks: [],
  insights: [],
  progressData: [],
  
  addTask: (taskData) => {
    const newTask: Task = {
      id: uuidv4(),
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date(),
      ...taskData,
    };
    
    set((state) => ({
      tasks: [...state.tasks, newTask]
    }));
    
    return newTask;
  },
  
  updateTask: (id, taskData) => {
    set((state) => ({
      tasks: state.tasks.map(task => 
        task.id === id 
          ? { ...task, ...taskData, updatedAt: new Date() } 
          : task
      )
    }));
  },
  
  deleteTask: (id) => {
    set((state) => ({
      tasks: state.tasks.filter(task => task.id !== id)
    }));
  },
  
  completeTask: (id) => {
    set((state) => ({
      tasks: state.tasks.map(task => 
        task.id === id 
          ? { ...task, status: 'completed', updatedAt: new Date() } 
          : task
      )
    }));
  },
  
  subdivideTask: (taskId, subTasks) => {
    const newSubTasks: Task[] = subTasks.map(subTask => ({
      id: uuidv4(),
      status: 'pending',
      parentTaskId: taskId,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...subTask
    }));
    
    set((state) => ({
      tasks: [...state.tasks, ...newSubTasks]
    }));
  },
  
  generateInsight: (taskId, type, content) => {
    const newInsight: TaskInsight = {
      id: uuidv4(),
      taskId,
      type,
      content,
      createdAt: new Date()
    };
    
    set((state) => ({
      insights: [...state.insights, newInsight]
    }));
  },
  
  addProgressData: (data) => {
    const today = new Date().toISOString().split('T')[0];
    
    set((state) => {
      // 同じ日の進捗データが既に存在する場合は更新
      const existingDataIndex = state.progressData.findIndex(
        p => p.date === today
      );
      
      if (existingDataIndex >= 0) {
        const updatedProgressData = [...state.progressData];
        updatedProgressData[existingDataIndex] = {
          ...updatedProgressData[existingDataIndex],
          ...data,
        };
        return { progressData: updatedProgressData };
      } else {
        // 新しいデータを追加
        return {
          progressData: [...state.progressData, {
            date: today,
            ...data
          }]
        };
      }
    });
  },
})); 