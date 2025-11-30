import React, { useState, useEffect } from 'react';
import { BellIcon, BellOffIcon, XIcon } from './icons';
import {
  requestNotificationPermission,
  isNotificationSupported,
  isNotificationEnabled,
  getNotificationPreference,
  setNotificationPreference,
  sendTestNotification,
} from '../utils/notifications';

interface NotificationSettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

const NotificationSettings: React.FC<NotificationSettingsProps> = ({ isOpen, onClose }) => {
  const [permission, setPermission] = useState<NotificationPermission>(
    isNotificationSupported() ? Notification.permission : 'denied'
  );
  const [enabled, setEnabled] = useState(getNotificationPreference());

  useEffect(() => {
    if (isNotificationSupported()) {
      setPermission(Notification.permission);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleToggle = async () => {
    if (!isNotificationSupported()) {
      return;
    }

    if (permission !== 'granted') {
      const result = await requestNotificationPermission();
      setPermission(result);

      if (result === 'granted') {
        setEnabled(true);
        setNotificationPreference(true);
        sendTestNotification();
      }
    } else {
      const newEnabled = !enabled;
      setEnabled(newEnabled);
      setNotificationPreference(newEnabled);

      if (newEnabled) {
        sendTestNotification();
      }
    }
  };

  const getStatusText = () => {
    if (!isNotificationSupported()) {
      return 'Not supported in this browser';
    }
    if (permission === 'denied') {
      return 'Blocked by browser - check site settings';
    }
    if (permission === 'granted' && enabled) {
      return 'Active - you\'ll be notified of order changes';
    }
    return 'Click to enable';
  };

  const getStatusColor = () => {
    if (!isNotificationSupported() || permission === 'denied') {
      return 'text-red-600 dark:text-red-400';
    }
    if (permission === 'granted' && enabled) {
      return 'text-green-600 dark:text-green-400';
    }
    return 'text-gray-600 dark:text-tesla-gray-400';
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in-up"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="notification-settings-title"
    >
      <div
        className="relative w-full max-w-md bg-white dark:bg-tesla-gray-800 rounded-2xl shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <header className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-tesla-gray-700">
          <h2 id="notification-settings-title" className="text-xl font-bold text-gray-900 dark:text-white">
            Notification Settings
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-tesla-gray-700 transition-all duration-150 active:scale-90"
            aria-label="Close"
          >
            <XIcon className="w-6 h-6 text-gray-600 dark:text-tesla-gray-300" />
          </button>
        </header>

        <main className="p-5">
          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0 mt-1">
              {enabled && permission === 'granted' ? (
                <BellIcon className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              ) : (
                <BellOffIcon className="w-8 h-8 text-gray-400 dark:text-tesla-gray-500" />
              )}
            </div>
            <div className="flex-grow">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                Browser Notifications
              </h3>
              <p className="text-sm text-gray-600 dark:text-tesla-gray-300 mb-4">
                Get instant alerts when your Tesla order status changes, including VIN assignment,
                delivery window updates, and appointment scheduling.
              </p>

              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-tesla-gray-900/50 rounded-lg border border-gray-200 dark:border-tesla-gray-700">
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">Status</p>
                  <p className={`text-xs ${getStatusColor()}`}>
                    {getStatusText()}
                  </p>
                </div>
                <button
                  onClick={handleToggle}
                  disabled={!isNotificationSupported() || permission === 'denied'}
                  className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-tesla-gray-800 disabled:opacity-50 disabled:cursor-not-allowed ${
                    enabled && permission === 'granted'
                      ? 'bg-blue-600'
                      : 'bg-gray-300 dark:bg-tesla-gray-600'
                  }`}
                  aria-label={enabled ? 'Disable notifications' : 'Enable notifications'}
                  role="switch"
                  aria-checked={enabled && permission === 'granted'}
                >
                  <span
                    className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                      enabled && permission === 'granted' ? 'translate-x-8' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {permission === 'denied' && (
                <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-500/30 rounded-lg">
                  <p className="text-xs text-yellow-800 dark:text-yellow-200">
                    <strong>Notifications are blocked.</strong> To enable them, click the lock icon
                    in your browser's address bar and allow notifications for this site.
                  </p>
                </div>
              )}

              {enabled && permission === 'granted' && (
                <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-500/30 rounded-lg">
                  <p className="text-xs text-green-800 dark:text-green-200">
                    <strong>You're all set!</strong> We'll notify you when your order status changes.
                    Keep this tab open in the background for instant notifications.
                  </p>
                </div>
              )}
            </div>
          </div>
        </main>

        <footer className="p-5 border-t border-gray-200 dark:border-tesla-gray-700 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-all duration-150 active:scale-95"
          >
            Done
          </button>
        </footer>
      </div>
    </div>
  );
};

export default NotificationSettings;
