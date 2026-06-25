import { useState, useEffect, useRef } from 'react';
import { notificationApi } from '../../api/notificationApi';
import Icon from './Icon';
import './NotificationBell.css';

const TYPE_ICONS = {
  appointment_booked: '📅',
  appointment_cancelled: '❌',
  appointment_completed: '✅',
  prescription_added: '💊',
};

export default function NotificationBell() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef(null);

  const load = async () => {
    try {
      const { data } = await notificationApi.getAll();
      setNotifications(data.notifications);
      setUnreadCount(data.unreadCount);
    } catch {
      // Silent fail — non-critical
    }
  };

  // Poll every 30 seconds so new notifications appear without a page refresh.
  useEffect(() => {
    load();
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, []);

  // Close the dropdown when clicking anywhere outside it.
  useEffect(() => {
    const handleClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleOpen = async () => {
    setIsOpen((o) => !o);
    if (!isOpen && unreadCount > 0) {
      // Mark all read when the user opens the dropdown.
      try {
        await notificationApi.markAllRead();
        setUnreadCount(0);
        setNotifications((ns) => ns.map((n) => ({ ...n, isRead: true })));
      } catch {
        // Silent
      }
    }
  };

  const formatTime = (iso) => {
    const d = new Date(iso);
    const now = new Date();
    const diffMs = now - d;
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHrs = Math.floor(diffMins / 60);
    if (diffHrs < 24) return `${diffHrs}h ago`;
    return d.toLocaleDateString();
  };

  return (
    <div className="notif-bell" ref={ref}>
      <button
        className="notif-bell__btn"
        onClick={handleOpen}
        aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`}
      >
        <Icon name="bell" size={18} />
        {unreadCount > 0 && (
          <span className="notif-bell__badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
        )}
      </button>

      {isOpen && (
        <div className="notif-dropdown">
          <div className="notif-dropdown__header">
            <span className="notif-dropdown__title">Notifications</span>
          </div>

          {notifications.length === 0 && (
            <p className="notif-dropdown__empty">No notifications yet.</p>
          )}

          <ul className="notif-dropdown__list">
            {notifications.map((n) => (
              <li
                key={n.id}
                className={`notif-dropdown__item ${!n.isRead ? 'notif-dropdown__item--unread' : ''}`}
              >
                <span className="notif-dropdown__icon">
                  {TYPE_ICONS[n.type] || '🔔'}
                </span>
                <div className="notif-dropdown__body">
                  <p className="notif-dropdown__msg">{n.message}</p>
                  <span className="notif-dropdown__time">{formatTime(n.createdAt)}</span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
