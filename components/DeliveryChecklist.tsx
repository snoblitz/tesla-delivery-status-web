
import React, { useState, useEffect, useMemo } from 'react';
import { DELIVERY_CHECKLIST } from '../constants';
import { DownloadIcon, CalendarIcon } from './icons';

interface DeliveryChecklistProps {
  orderReferenceNumber: string;
  appointmentDate?: string;
  deliveryLocation?: string;
}

type CheckedState = Record<string, boolean>;

const generateCalendarFile = (appointmentDate: string, location?: string): string => {
  // Parse the appointment string to extract date and time
  const dateMatch = appointmentDate.match(/([A-Za-z]+\s+\d{1,2},\s+\d{4})/);
  const timeMatch = appointmentDate.match(/(\d{1,2}:\d{2}\s*[AP]M)/i);

  if (!dateMatch) {
    throw new Error('Could not parse appointment date');
  }

  const dateStr = dateMatch[0];
  const timeStr = timeMatch ? timeMatch[0] : '12:00 PM';

  // Create Date object
  const appointmentDateTime = new Date(`${dateStr} ${timeStr}`);

  if (isNaN(appointmentDateTime.getTime())) {
    throw new Error('Invalid date format');
  }

  // Format date for iCalendar (YYYYMMDDTHHMMSS)
  const formatICSDate = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${year}${month}${day}T${hours}${minutes}${seconds}`;
  };

  // End time is 1 hour after start
  const endDateTime = new Date(appointmentDateTime.getTime() + 60 * 60 * 1000);

  const now = new Date();
  const dtstamp = formatICSDate(now);
  const dtstart = formatICSDate(appointmentDateTime);
  const dtend = formatICSDate(endDateTime);

  const locationText = location || 'Tesla Delivery Center';

  // Create iCalendar format
  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Tesla Delivery Status Tracker//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `DTSTAMP:${dtstamp}`,
    `DTSTART:${dtstart}`,
    `DTEND:${dtend}`,
    `SUMMARY:Tesla Vehicle Delivery Appointment`,
    `DESCRIPTION:Your Tesla delivery appointment. Don't forget to bring:\\n- Driver's license\\n- Proof of insurance\\n- Payment method\\n- Trade-in vehicle (if applicable)`,
    `LOCATION:${locationText}`,
    'STATUS:CONFIRMED',
    'SEQUENCE:0',
    `UID:tesla-delivery-${now.getTime()}@tesla-delivery-tracker`,
    'BEGIN:VALARM',
    'TRIGGER:-P1D',
    'ACTION:DISPLAY',
    'DESCRIPTION:Tesla Delivery Tomorrow - Review your checklist!',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n');

  return icsContent;
};

const downloadCalendarFile = (content: string, filename: string): void => {
  const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

const ChecklistProgressBar: React.FC<{ completed: number; total: number }> = ({ completed, total }) => {
  const percentage = total > 0 ? (completed / total) * 100 : 0;
  return (
    <div className="w-full bg-gray-200 dark:bg-tesla-gray-700 rounded-full h-2 my-2">
      <div
        className="bg-blue-600 h-2 rounded-full transition-all duration-500"
        style={{ width: `${percentage}%` }}
      ></div>
    </div>
  );
};

const DeliveryChecklist: React.FC<DeliveryChecklistProps> = ({
  orderReferenceNumber,
  appointmentDate,
  deliveryLocation,
}) => {
  const storageKey = `checklist-state-${orderReferenceNumber}`;

  const [checkedItems, setCheckedItems] = useState<CheckedState>(() => {
    try {
      if (typeof localStorage !== 'undefined') {
        const storedState = localStorage.getItem(storageKey);
        return storedState ? JSON.parse(storedState) : {};
      }
    } catch (error) {
      console.error("Error reading checklist state from localStorage", error);
    }
    return {};
  });

  useEffect(() => {
    try {
        if (typeof localStorage !== 'undefined') {
            localStorage.setItem(storageKey, JSON.stringify(checkedItems));
        }
    } catch (error) {
      console.error("Error saving checklist state to localStorage", error);
    }
  }, [checkedItems, storageKey]);

  const handleToggle = (itemId: string) => {
    setCheckedItems(prev => ({
      ...prev,
      [itemId]: !prev[itemId],
    }));
  };

  const handleExportToCalendar = () => {
    if (!appointmentDate) {
      alert('No delivery appointment scheduled yet.');
      return;
    }

    try {
      const icsContent = generateCalendarFile(appointmentDate, deliveryLocation);
      downloadCalendarFile(icsContent, 'tesla-delivery-appointment.ics');
    } catch (error) {
      console.error('Failed to generate calendar file:', error);
      alert('Failed to create calendar file. Please check your appointment date format.');
    }
  };

  return (
    <div className="p-5 space-y-6 flex-grow">
      {appointmentDate && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-500/30 rounded-lg p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <CalendarIcon className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-semibold text-blue-900 dark:text-blue-100 text-sm">
                  Delivery Appointment
                </p>
                <p className="text-sm text-blue-700 dark:text-blue-300 mt-0.5">
                  {appointmentDate}
                </p>
                {deliveryLocation && (
                  <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                    {deliveryLocation}
                  </p>
                )}
              </div>
            </div>
            <button
              onClick={handleExportToCalendar}
              className="flex items-center gap-1.5 px-3 py-2 text-sm font-semibold text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-900/40 hover:bg-blue-200 dark:hover:bg-blue-900/60 rounded-lg transition-all duration-150 active:scale-95 whitespace-nowrap"
              aria-label="Add to calendar"
            >
              <DownloadIcon className="w-4 h-4" />
              <span className="hidden sm:inline">Add to Calendar</span>
              <span className="sm:hidden">.ics</span>
            </button>
          </div>
        </div>
      )}

      <div className="space-y-8">
      {DELIVERY_CHECKLIST.map(section => {
        const completedCount = useMemo(() => section.items.filter(item => checkedItems[item.id]).length, [section.items, checkedItems]);
        const totalCount = section.items.length;

        return (
          <div key={section.title}>
            <div className="flex justify-between items-center mb-2">
              <h4 className="text-lg font-semibold text-gray-800 dark:text-white">{section.title}</h4>
              <span className="text-sm font-medium text-gray-500 dark:text-tesla-gray-400">
                {completedCount} / {totalCount} Complete
              </span>
            </div>
            <ChecklistProgressBar completed={completedCount} total={totalCount} />
            <ul className="space-y-3 mt-4">
              {section.items.map(item => (
                <li key={item.id}>
                  <label className="flex items-center space-x-3 cursor-pointer group" htmlFor={`checklist-item-${item.id}`}>
                    <input
                      id={`checklist-item-${item.id}`}
                      type="checkbox"
                      checked={!!checkedItems[item.id]}
                      onChange={() => handleToggle(item.id)}
                      className="h-5 w-5 rounded border-gray-300 dark:border-tesla-gray-500 text-blue-600 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-tesla-gray-800 bg-white dark:bg-tesla-gray-700 transition"
                    />
                    <span className={`flex-1 text-gray-700 dark:text-tesla-gray-200 group-hover:text-gray-900 dark:group-hover:text-white transition ${checkedItems[item.id] ? 'line-through text-gray-400 dark:text-tesla-gray-500' : ''}`}>
                      {item.text}
                    </span>
                  </label>
                </li>
              ))}
            </ul>
          </div>
        );
      })}
      </div>
    </div>
  );
};

export default DeliveryChecklist;
