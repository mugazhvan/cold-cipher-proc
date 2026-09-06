import React, { useState } from 'react';
import { useKisanFlow } from '../../context/KisanFlowContext';
import { AppNotification } from '../../types';
import {
  Bell,
  CheckCircle2,
  AlertTriangle,
  Radio,
  Clock,
  Trash2,
  X,
  CreditCard,
  Building2,
  Check,
} from 'lucide-react';

export const NotificationBell: React.FC = () => {
  const {
    notifications,
    unreadNotificationCount,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    clearNotification,
    clearAllNotifications,
    role,
  } = useKisanFlow();

  const [isOpen, setIsOpen] = useState(false);

  // Filter relevant notifications for current role
  const relevantNotifications = notifications.filter(
    (n) => n.targetRole === 'all' || n.targetRole === role
  );

  const getNotificationIcon = (notif: AppNotification) => {
    switch (notif.type) {
      case 'PAYMENT_SETTLED':
        return <CreditCard className="w-4 h-4 text-emerald-600" />;
      case 'BAY_CALL':
        return <Radio className="w-4 h-4 text-amber-500 animate-pulse" />;
      case 'QUALITY_CLEARED':
        return <CheckCircle2 className="w-4 h-4 text-emerald-600" />;
      case 'QUALITY_REJECTED':
      case 'WEATHER_ALERT':
        return <AlertTriangle className="w-4 h-4 text-amber-500" />;
      case 'QUEUE_UPDATE':
      default:
        return <Building2 className="w-4 h-4 text-sky-600" />;
    }
  };

  return (
    <div className="relative">
      <button
        id="notification-bell-btn"
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition cursor-pointer"
        title="View Notifications"
      >
        <Bell className="w-4 h-4" />
        {unreadNotificationCount > 0 && (
          <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-600 text-[9px] font-bold text-white shadow-xs">
            {unreadNotificationCount > 9 ? '9+' : unreadNotificationCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-white shadow-2xl border border-slate-200 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="p-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Bell className="w-4 h-4 text-emerald-600" />
                <h4 className="text-xs font-bold text-slate-900">
                  Procurement Alerts ({relevantNotifications.length})
                </h4>
              </div>
              <div className="flex items-center space-x-2">
                {unreadNotificationCount > 0 && (
                  <button
                    onClick={markAllNotificationsAsRead}
                    className="text-[10px] font-bold text-emerald-700 hover:text-emerald-800 flex items-center space-x-1"
                    title="Mark all as read"
                  >
                    <Check className="w-3 h-3" />
                    <span>Mark Read</span>
                  </button>
                )}
                {relevantNotifications.length > 0 && (
                  <button
                    onClick={clearAllNotifications}
                    className="text-[10px] font-medium text-slate-400 hover:text-red-600"
                    title="Clear all alerts"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* List */}
            <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
              {relevantNotifications.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-400 space-y-1">
                  <p className="font-semibold text-slate-600">No new alerts</p>
                  <p className="text-[11px]">All queue updates & payments will appear here.</p>
                </div>
              ) : (
                relevantNotifications.map((n) => (
                  <div
                    key={n.id}
                    onClick={() => markNotificationAsRead(n.id)}
                    className={`p-3 text-xs transition cursor-pointer hover:bg-slate-50 flex items-start space-x-2.5 ${
                      !n.read ? 'bg-emerald-50/40 font-medium' : 'text-slate-600'
                    }`}
                  >
                    <div className="p-1.5 rounded-lg bg-white border border-slate-200 mt-0.5 shadow-2xs">
                      {getNotificationIcon(n)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900 truncate">{n.title}</span>
                        <span className="text-[10px] text-slate-400 flex items-center space-x-0.5 whitespace-nowrap ml-1">
                          <Clock className="w-2.5 h-2.5" />
                          <span>{n.timestamp}</span>
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 mt-0.5 line-clamp-2">
                        {n.message}
                      </p>
                      {n.tokenNumber && (
                        <span className="inline-block mt-1 font-mono text-[9px] font-bold text-emerald-800 bg-emerald-100/80 px-1.5 py-0.5 rounded">
                          {n.tokenNumber}
                        </span>
                      )}
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        clearNotification(n.id);
                      }}
                      className="text-slate-300 hover:text-red-500 p-0.5 transition"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
