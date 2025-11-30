import React, { useMemo } from 'react';
import { HistoricalSnapshot } from '../types';
import { BarChartIcon, TrendingUpIcon } from './icons';

interface HistoricalAnalyticsProps {
  history: HistoricalSnapshot[];
}

interface DataPoint {
  timestamp: number;
  value: string;
  dateLabel: string;
}

const HistoricalAnalytics: React.FC<HistoricalAnalyticsProps> = ({ history }) => {
  const deliveryWindowChanges = useMemo<DataPoint[]>(() => {
    return history
      .map((snapshot) => {
        const window = snapshot.data.details?.tasks?.scheduling?.deliveryWindowDisplay;
        if (!window) return null;

        return {
          timestamp: snapshot.timestamp,
          value: window,
          dateLabel: new Date(snapshot.timestamp).toLocaleDateString(undefined, {
            month: 'short',
            day: 'numeric',
          }),
        };
      })
      .filter((item): item is DataPoint => item !== null);
  }, [history]);

  const odometerChanges = useMemo<DataPoint[]>(() => {
    return history
      .map((snapshot) => {
        const odometer = snapshot.data.details?.tasks?.registration?.orderDetails?.vehicleOdometer;
        if (odometer === undefined || odometer === null) return null;

        return {
          timestamp: snapshot.timestamp,
          value: odometer.toString(),
          dateLabel: new Date(snapshot.timestamp).toLocaleDateString(undefined, {
            month: 'short',
            day: 'numeric',
          }),
        };
      })
      .filter((item): item is DataPoint => item !== null);
  }, [history]);

  const totalChanges = history.length;
  const uniqueDeliveryWindows = new Set(deliveryWindowChanges.map((d) => d.value)).size;

  if (history.length === 0) {
    return (
      <div className="p-6 text-center text-gray-500 dark:text-tesla-gray-400">
        <p>No historical data available yet.</p>
        <p className="text-sm mt-1">
          History is tracked automatically. Check back after your order updates.
        </p>
      </div>
    );
  }

  const TimelineChart: React.FC<{ data: DataPoint[]; title: string }> = ({ data, title }) => {
    if (data.length === 0) {
      return null;
    }

    const uniqueValues = Array.from(new Set(data.map((d) => d.value)));
    const colorMap: Record<string, string> = {};
    const colors = [
      '#3B82F6', // blue
      '#10B981', // green
      '#F59E0B', // amber
      '#8B5CF6', // purple
      '#EC4899', // pink
      '#06B6D4', // cyan
    ];

    uniqueValues.forEach((value, index) => {
      colorMap[value] = colors[index % colors.length];
    });

    return (
      <div className="space-y-3">
        <h4 className="font-semibold text-gray-800 dark:text-white flex items-center gap-2">
          <BarChartIcon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          {title}
        </h4>
        <div className="space-y-2">
          {data.map((point, index) => (
            <div key={index} className="flex items-center gap-3">
              <div className="w-20 text-xs text-gray-500 dark:text-tesla-gray-400 font-medium flex-shrink-0">
                {point.dateLabel}
              </div>
              <div className="flex-grow">
                <div
                  className="h-8 rounded-md flex items-center px-3 text-sm font-medium text-white"
                  style={{ backgroundColor: colorMap[point.value] }}
                >
                  <span className="truncate">{point.value}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
        {uniqueValues.length > 1 && (
          <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-gray-200 dark:border-tesla-gray-700">
            {uniqueValues.map((value) => (
              <div key={value} className="flex items-center gap-1.5 text-xs">
                <div
                  className="w-3 h-3 rounded"
                  style={{ backgroundColor: colorMap[value] }}
                />
                <span className="text-gray-600 dark:text-tesla-gray-400 truncate max-w-[150px]">
                  {value}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="p-5 space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-500/30 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-blue-600 dark:text-blue-400 font-medium uppercase tracking-wide">
                Snapshots
              </p>
              <p className="text-2xl font-bold text-blue-900 dark:text-blue-100 mt-1">
                {totalChanges}
              </p>
            </div>
            <TrendingUpIcon className="w-8 h-8 text-blue-600/40 dark:text-blue-400/40" />
          </div>
          <p className="text-xs text-blue-700 dark:text-blue-300 mt-2">
            Total historical records
          </p>
        </div>

        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-500/30 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-green-600 dark:text-green-400 font-medium uppercase tracking-wide">
                Window Changes
              </p>
              <p className="text-2xl font-bold text-green-900 dark:text-green-100 mt-1">
                {uniqueDeliveryWindows}
              </p>
            </div>
            <BarChartIcon className="w-8 h-8 text-green-600/40 dark:text-green-400/40" />
          </div>
          <p className="text-xs text-green-700 dark:text-green-300 mt-2">
            Unique delivery windows
          </p>
        </div>

        <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-500/30 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-purple-600 dark:text-purple-400 font-medium uppercase tracking-wide">
                Latest Update
              </p>
              <p className="text-sm font-bold text-purple-900 dark:text-purple-100 mt-1">
                {history.length > 0
                  ? new Date(history[history.length - 1].timestamp).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })
                  : 'N/A'}
              </p>
            </div>
          </div>
          <p className="text-xs text-purple-700 dark:text-purple-300 mt-2">
            Most recent snapshot
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {deliveryWindowChanges.length > 0 && (
          <div className="bg-gray-50 dark:bg-tesla-gray-900/50 border border-gray-200 dark:border-tesla-gray-700 rounded-lg p-4">
            <TimelineChart data={deliveryWindowChanges} title="Delivery Window History" />
          </div>
        )}

        {odometerChanges.length > 0 && (
          <div className="bg-gray-50 dark:bg-tesla-gray-900/50 border border-gray-200 dark:border-tesla-gray-700 rounded-lg p-4">
            <TimelineChart data={odometerChanges} title="Odometer Readings" />
          </div>
        )}
      </div>

      {deliveryWindowChanges.length === 0 && odometerChanges.length === 0 && (
        <div className="text-center py-8 text-gray-500 dark:text-tesla-gray-400">
          <BarChartIcon className="w-12 h-12 mx-auto mb-3 opacity-40" />
          <p>No trackable metrics found in history.</p>
          <p className="text-sm mt-1">
            Data will appear here as your order information changes over time.
          </p>
        </div>
      )}
    </div>
  );
};

export default HistoricalAnalytics;
