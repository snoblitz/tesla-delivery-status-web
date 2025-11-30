import React, { useMemo } from 'react';
import { OrderDetails, TeslaTask } from '../types';
import { TrendingUpIcon, CheckCircle2, User, Server } from 'lucide-react';

interface ProgressScoreProps {
  tasksData: OrderDetails['tasks'];
}

interface TaskStats {
  total: number;
  completed: number;
  customerTotal: number;
  customerCompleted: number;
  teslaTotal: number;
  teslaCompleted: number;
  requiredTotal: number;
  requiredCompleted: number;
}

const ProgressScore: React.FC<ProgressScoreProps> = ({ tasksData }) => {
  const stats = useMemo<TaskStats>(() => {
    if (!tasksData) {
      return {
        total: 0,
        completed: 0,
        customerTotal: 0,
        customerCompleted: 0,
        teslaTotal: 0,
        teslaCompleted: 0,
        requiredTotal: 0,
        requiredCompleted: 0,
      };
    }

    const tasks: TeslaTask[] = Object.values(tasksData).filter(
      (task: any): task is TeslaTask =>
        task && typeof task === 'object' && 'id' in task && 'complete' in task
    );

    const stats: TaskStats = {
      total: tasks.length,
      completed: 0,
      customerTotal: 0,
      customerCompleted: 0,
      teslaTotal: 0,
      teslaCompleted: 0,
      requiredTotal: 0,
      requiredCompleted: 0,
    };

    tasks.forEach((task) => {
      const isComplete = task.complete;
      const isRequired = task.required;

      if (isComplete) stats.completed++;

      if (isRequired) {
        stats.requiredTotal++;
        if (isComplete) stats.requiredCompleted++;
      }

      // Check if task has delivery gate with action owner
      const gates = (tasksData as any).deliveryAcceptance?.gates;
      let isCustomerTask = false;

      if (gates) {
        const relatedGate = Object.values(gates).find(
          (gate: any) => gate.gate?.includes(task.id.toUpperCase())
        ) as any;
        isCustomerTask = relatedGate?.actionOwner === 'Customer';
      }

      if (isCustomerTask) {
        stats.customerTotal++;
        if (isComplete) stats.customerCompleted++;
      } else {
        stats.teslaTotal++;
        if (isComplete) stats.teslaCompleted++;
      }
    });

    return stats;
  }, [tasksData]);

  if (!tasksData || stats.total === 0) {
    return null;
  }

  const overallProgress = stats.total > 0 ? (stats.completed / stats.total) * 100 : 0;
  const requiredProgress =
    stats.requiredTotal > 0 ? (stats.requiredCompleted / stats.requiredTotal) * 100 : 0;
  const customerProgress =
    stats.customerTotal > 0 ? (stats.customerCompleted / stats.customerTotal) * 100 : 0;
  const teslaProgress =
    stats.teslaTotal > 0 ? (stats.teslaCompleted / stats.teslaTotal) * 100 : 0;

  const getProgressColor = (progress: number) => {
    if (progress === 100) return 'text-green-600 dark:text-green-400';
    if (progress >= 75) return 'text-blue-600 dark:text-blue-400';
    if (progress >= 50) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-orange-600 dark:text-orange-400';
  };

  const getProgressBg = (progress: number) => {
    if (progress === 100) return 'bg-green-600';
    if (progress >= 75) return 'bg-blue-600';
    if (progress >= 50) return 'bg-yellow-500';
    return 'bg-orange-500';
  };

  const ProgressBar: React.FC<{ progress: number; label: string; icon?: React.ReactNode }> = ({
    progress,
    label,
    icon,
  }) => (
    <div className="space-y-1.5">
      <div className="flex justify-between items-center text-sm">
        <div className="flex items-center gap-1.5">
          {icon}
          <span className="font-medium text-gray-700 dark:text-tesla-gray-300">{label}</span>
        </div>
        <span className={`font-bold ${getProgressColor(progress)}`}>
          {progress.toFixed(0)}%
        </span>
      </div>
      <div className="w-full bg-gray-200 dark:bg-tesla-gray-700 rounded-full h-2.5 overflow-hidden">
        <div
          className={`h-full ${getProgressBg(progress)} transition-all duration-500 ease-out rounded-full`}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/10 dark:to-indigo-900/10 border border-blue-200 dark:border-blue-500/20 rounded-xl p-5 mb-6">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-2">
          <TrendingUpIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">
            Delivery Preparation Score
          </h3>
        </div>
        <div className="text-right">
          <div className={`text-3xl font-bold ${getProgressColor(requiredProgress)}`}>
            {requiredProgress.toFixed(0)}
          </div>
          <div className="text-xs text-gray-500 dark:text-tesla-gray-400 uppercase tracking-wide">
            Required Tasks
          </div>
        </div>
      </div>

      <div className="space-y-3.5">
        <ProgressBar
          progress={overallProgress}
          label="Overall Progress"
          icon={<CheckCircle2 className="w-4 h-4 text-gray-500 dark:text-tesla-gray-400" />}
        />

        {stats.customerTotal > 0 && (
          <ProgressBar
            progress={customerProgress}
            label={`Your Tasks (${stats.customerCompleted}/${stats.customerTotal})`}
            icon={<User className="w-4 h-4 text-blue-600 dark:text-blue-400" />}
          />
        )}

        {stats.teslaTotal > 0 && (
          <ProgressBar
            progress={teslaProgress}
            label={`Tesla Tasks (${stats.teslaCompleted}/${stats.teslaTotal})`}
            icon={<Server className="w-4 h-4 text-gray-600 dark:text-tesla-gray-400" />}
          />
        )}
      </div>

      {requiredProgress === 100 ? (
        <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-500/30 rounded-lg flex items-start gap-2">
          <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-green-800 dark:text-green-300">
              All Required Tasks Complete!
            </p>
            <p className="text-xs text-green-700 dark:text-green-400 mt-0.5">
              You're ready for the next stage of delivery preparation.
            </p>
          </div>
        </div>
      ) : (
        <div className="mt-4 text-xs text-gray-600 dark:text-tesla-gray-400 flex items-center justify-between">
          <span>
            {stats.completed} of {stats.total} tasks completed
          </span>
          <span className="font-medium">
            {stats.requiredTotal - stats.requiredCompleted} required tasks remaining
          </span>
        </div>
      )}
    </div>
  );
};

export default ProgressScore;
