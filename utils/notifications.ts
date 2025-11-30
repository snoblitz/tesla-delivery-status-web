import { OrderDiff } from '../types';
import { DIFF_KEY_LABELS } from '../constants';

export const requestNotificationPermission = async (): Promise<NotificationPermission> => {
  if (!('Notification' in window)) {
    console.warn('This browser does not support notifications');
    return 'denied';
  }

  if (Notification.permission === 'granted') {
    return 'granted';
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission;
  }

  return Notification.permission;
};

export const isNotificationSupported = (): boolean => {
  return 'Notification' in window;
};

export const isNotificationEnabled = (): boolean => {
  return isNotificationSupported() && Notification.permission === 'granted';
};

export const getNotificationPreference = (): boolean => {
  const saved = localStorage.getItem('notification-enabled');
  return saved === 'true';
};

export const setNotificationPreference = (enabled: boolean): void => {
  localStorage.setItem('notification-enabled', enabled.toString());
};

export const sendOrderChangeNotification = (
  referenceNumber: string,
  diffs: OrderDiff
): void => {
  if (!isNotificationEnabled() || !getNotificationPreference()) {
    return;
  }

  const diffKeys = Object.keys(diffs);
  if (diffKeys.length === 0) {
    return;
  }

  // Get human-readable labels for changed fields
  const changedFields = diffKeys
    .map(key => DIFF_KEY_LABELS[key] || key)
    .slice(0, 3); // Show max 3 fields

  const body = changedFields.length > 0
    ? `Changed: ${changedFields.join(', ')}${diffKeys.length > 3 ? '...' : ''}`
    : 'Your order status has been updated';

  try {
    const notification = new Notification('Tesla Order Update! 🚗', {
      body,
      icon: '/favicon.svg',
      badge: '/favicon.svg',
      tag: `order-${referenceNumber}`, // Prevents duplicate notifications
      requireInteraction: false,
      silent: false,
    });

    // Auto-close after 10 seconds
    setTimeout(() => notification.close(), 10000);

    // Focus window when notification is clicked
    notification.onclick = () => {
      window.focus();
      notification.close();
    };
  } catch (error) {
    console.error('Failed to show notification:', error);
  }
};

export const sendTestNotification = (): void => {
  if (!isNotificationEnabled()) {
    return;
  }

  try {
    const notification = new Notification('Test Notification 🔔', {
      body: 'Notifications are working! You\'ll be alerted when your order changes.',
      icon: '/favicon.svg',
    });

    setTimeout(() => notification.close(), 5000);
  } catch (error) {
    console.error('Failed to send test notification:', error);
  }
};
