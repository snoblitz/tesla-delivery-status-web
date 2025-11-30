
import React, { useState, useEffect } from 'react';
import { HistoricalSnapshot } from '../types';
import { compareObjects } from '../utils/helpers';
import { DIFF_KEY_LABELS } from '../constants';
import { XIcon, FileTextIcon, ArrowRightIcon, BarChartIcon, HistoryIcon } from './icons';
import HistoricalAnalytics from './HistoricalAnalytics';

interface HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderReferenceNumber: string;
}

const formatValue = (value: any): string => {
  if (value === undefined || value === null) return 'N/A';
  if (typeof value === 'object') {
    // Attempt to pretty-print JSON, but keep it on one line if it's short
    const jsonString = JSON.stringify(value);
    if (jsonString.length > 75) {
      return JSON.stringify(value, null, 2);
    }
    return jsonString;
  }
  if (value === '') return '"" (empty string)';
  if (typeof value === 'boolean') return value ? 'True' : 'False';
  return String(value);
};

const getLabel = (key: string): string => {
  return DIFF_KEY_LABELS[key] || key;
};

const ChangeItem: React.FC<{ label: string; from: any; to: any }> = ({ label, from, to }) => (
  <li className="flex items-start text-sm py-3">
    <FileTextIcon className="w-4 h-4 mr-3 mt-1 flex-shrink-0 text-gray-400 dark:text-tesla-gray-500" />
    <div className="flex-grow min-w-0">
      <p className="font-semibold text-gray-700 dark:text-tesla-gray-200 break-words">{label}</p>
      <div className="flex flex-col sm:flex-row sm:items-start sm:gap-2 text-gray-500 dark:text-tesla-gray-400 mt-1">
        <span className="line-through whitespace-pre-wrap break-all">{formatValue(from)}</span>
        <ArrowRightIcon className="w-4 h-4 text-gray-400 dark:text-tesla-gray-500 hidden sm:block shrink-0 mt-1" />
        <span className="text-gray-800 dark:text-white font-medium whitespace-pre-wrap break-all">{formatValue(to)}</span>
      </div>
    </div>
  </li>
);


const HistoryModal: React.FC<HistoryModalProps> = ({ isOpen, onClose, orderReferenceNumber }) => {
  const [history, setHistory] = useState<HistoricalSnapshot[]>([]);
  const [activeView, setActiveView] = useState<'changelog' | 'analytics'>('changelog');

  useEffect(() => {
    if (isOpen) {
      try {
        const storedHistoryJson = localStorage.getItem(`tesla-order-history-${orderReferenceNumber}`);
        if (storedHistoryJson) {
          setHistory(JSON.parse(storedHistoryJson));
        } else {
          setHistory([]);
        }
      } catch (e) {
        console.error("Failed to parse history from localStorage", e);
        setHistory([]);
      }
    }
  }, [isOpen, orderReferenceNumber]);

  if (!isOpen) {
    return null;
  }

  const renderHistoryLog = () => {
    if (history.length === 0) {
      return <p className="text-center text-gray-500 dark:text-tesla-gray-400 p-8">No history recorded for this order yet.</p>;
    }
    
    const reversedHistory = [...history].reverse();
    
    return reversedHistory.map((snapshot, index) => {
      const previousSnapshot = reversedHistory[index + 1] || null;
      const dateTime = new Date(snapshot.timestamp);
      const formattedDate = dateTime.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
      const formattedTime = dateTime.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });

      // This is the very first snapshot, which establishes the baseline.
      if (!previousSnapshot) {
        return (
            <div key={snapshot.timestamp} className="relative pl-8">
              <span className="absolute left-0 top-1.5 h-full w-0.5 bg-gray-200 dark:bg-tesla-gray-700"></span>
              <div className="absolute left-[-5px] top-3 w-3 h-3 rounded-full bg-blue-500 ring-4 ring-white dark:ring-tesla-gray-800"></div>
              
              <div className="pb-8">
                <h4 className="font-semibold text-gray-800 dark:text-white">{formattedDate}
                    <span className="text-sm font-normal text-gray-500 dark:text-tesla-gray-400 ml-2">{formattedTime}</span>
                </h4>
                <div className="mt-3 p-4 bg-gray-50 dark:bg-tesla-gray-900/50 rounded-lg border border-gray-200 dark:border-tesla-gray-700/50">
                    <p className="text-sm font-semibold mb-2 text-gray-600 dark:text-tesla-gray-300">
                        Initial State Recorded
                    </p>
                    <p className="text-sm text-gray-500 dark:text-tesla-gray-400">
                        The first check has established a baseline. Any future changes to your order will be logged here.
                    </p>
                </div>
              </div>
            </div>
        );
      }
      
      const diffs = compareObjects(previousSnapshot.data, snapshot.data);
      const allDiffs = Object.entries(diffs);
      
      // If there are no changes, don't render an entry for this snapshot.
      if (allDiffs.length === 0) {
        return null;
      }

      return (
        <div key={snapshot.timestamp} className="relative pl-8">
            <span className="absolute left-0 top-1.5 h-full w-0.5 bg-gray-200 dark:bg-tesla-gray-700"></span>
            <div className="absolute left-[-5px] top-3 w-3 h-3 rounded-full bg-blue-500 ring-4 ring-white dark:ring-tesla-gray-800"></div>
          
          <div className="pb-8">
            <h4 className="font-semibold text-gray-800 dark:text-white">{formattedDate}
                <span className="text-sm font-normal text-gray-500 dark:text-tesla-gray-400 ml-2">{formattedTime}</span>
            </h4>
            <div className="mt-3 p-4 bg-gray-50 dark:bg-tesla-gray-900/50 rounded-lg border border-gray-200 dark:border-tesla-gray-700/50">
                <p className="text-sm font-semibold mb-2 text-gray-600 dark:text-tesla-gray-300">
                    Changes Detected:
                </p>
                <ul className="divide-y divide-gray-200 dark:divide-tesla-gray-700/50">
                    {allDiffs.map(([key, { old: oldVal, new: newVal }]) => (
                        <ChangeItem key={key} label={getLabel(key)} from={oldVal} to={newVal} />
                    ))}
                </ul>
            </div>
          </div>
        </div>
      );
    });
  };

  const TabButton: React.FC<{ view: 'changelog' | 'analytics'; label: string; icon: React.ReactNode }> = ({
    view,
    label,
    icon,
  }) => (
    <button
      onClick={() => setActiveView(view)}
      className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold transition-all duration-150 active:scale-95 ${
        activeView === view
          ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
          : 'text-gray-500 dark:text-tesla-gray-400 border-b-2 border-transparent hover:bg-gray-100 dark:hover:bg-tesla-gray-700/50'
      }`}
      aria-pressed={activeView === view}
      role="tab"
    >
      {icon}
      {label}
    </button>
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="history-modal-title"
    >
      <div
        className="relative flex flex-col w-full max-w-4xl max-h-[90vh] bg-white dark:bg-tesla-gray-800 rounded-2xl shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <header className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-tesla-gray-700 flex-shrink-0">
          <h2 id="history-modal-title" className="text-xl font-bold text-gray-900 dark:text-white">
            Order History & Analytics
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-tesla-gray-700 transition-all duration-150 active:scale-90 active:bg-gray-300 dark:active:bg-tesla-gray-600"
            aria-label="Close"
          >
            <XIcon className="w-6 h-6 text-gray-600 dark:text-tesla-gray-300" />
          </button>
        </header>

        <div className="flex border-b border-gray-200 dark:border-tesla-gray-700" role="tablist">
          <TabButton
            view="changelog"
            label="Changelog"
            icon={<HistoryIcon className="w-4 h-4" />}
          />
          <TabButton
            view="analytics"
            label="Analytics"
            icon={<BarChartIcon className="w-4 h-4" />}
          />
        </div>

        <main className="overflow-y-auto flex-grow">
          {activeView === 'changelog' ? (
            <div className="px-6 pt-6">{renderHistoryLog()}</div>
          ) : (
            <HistoricalAnalytics history={history} />
          )}
        </main>
      </div>
    </div>
  );
};

export default HistoryModal;
