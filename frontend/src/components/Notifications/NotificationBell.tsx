import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './NotificationBell.module.css';

export interface Notification {
  id: string;
  type: 'report_ready' | 'paste_detected' | 'session_complete' | 'info';
  title: string;
  message: string;
  read: boolean;
  createdAt: Date;
  link?: string;
}

// Global notification store
let globalNotifications: Notification[] = JSON.parse(
  localStorage.getItem('vi_notifications') || '[]'
).map((n: any) => ({ ...n, createdAt: new Date(n.createdAt) }));

let listeners: Array<() => void> = [];

const saveNotifications = () => {
  localStorage.setItem('vi_notifications', JSON.stringify(globalNotifications));
  listeners.forEach(l => l());
};

export const addNotification = (notif: Omit<Notification, 'id' | 'read' | 'createdAt'>) => {
  const newNotif: Notification = {
    ...notif,
    id: Date.now().toString(),
    read: false,
    createdAt: new Date(),
  };
  globalNotifications = [newNotif, ...globalNotifications.slice(0, 19)];
  saveNotifications();
};

const NotificationBell: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>(globalNotifications);
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const listener = () => setNotifications([...globalNotifications]);
    listeners.push(listener);
    return () => { listeners = listeners.filter(l => l !== listener); };
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const unread = notifications.filter(n => !n.read).length;

  const markAllRead = () => {
    globalNotifications = globalNotifications.map(n => ({ ...n, read: true }));
    saveNotifications();
  };

  const markRead = (id: string) => {
    globalNotifications = globalNotifications.map(n =>
      n.id === id ? { ...n, read: true } : n
    );
    saveNotifications();
  };

  const clearAll = () => {
    globalNotifications = [];
    saveNotifications();
  };

  const handleClick = (notif: Notification) => {
    markRead(notif.id);
    if (notif.link) navigate(notif.link);
    setOpen(false);
  };

  const iconMap: Record<string, string> = {
    report_ready: '📊',
    paste_detected: '⚑',
    session_complete: '✓',
    info: 'ℹ',
  };

  const timeAgo = (date: Date) => {
    const diff = Math.floor((Date.now() - date.getTime()) / 1000);
    if (diff < 60) return 'just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  return (
    <div className={styles.wrap} ref={panelRef}>
      <button
        className={styles.bell}
        onClick={() => { setOpen(v => !v); if (!open) markAllRead(); }}
        title="Notifications"
      >
        <span className={styles.bellIcon}>🔔</span>
        {unread > 0 && <span className={styles.badge}>{unread > 9 ? '9+' : unread}</span>}
      </button>

      {open && (
        <div className={styles.panel}>
          <div className={styles.panelHeader}>
            <span className={styles.panelTitle}>Notifications</span>
            {notifications.length > 0 && (
              <button className={styles.clearBtn} onClick={clearAll}>Clear all</button>
            )}
          </div>

          {notifications.length === 0 ? (
            <div className={styles.empty}>No notifications yet</div>
          ) : (
            <div className={styles.list}>
              {notifications.map(notif => (
                <div
                  key={notif.id}
                  className={`${styles.item} ${!notif.read ? styles.unread : ''}`}
                  onClick={() => handleClick(notif)}
                >
                  <div className={styles.itemIcon}>{iconMap[notif.type]}</div>
                  <div className={styles.itemBody}>
                    <div className={styles.itemTitle}>{notif.title}</div>
                    <div className={styles.itemMsg}>{notif.message}</div>
                    <div className={styles.itemTime}>{timeAgo(notif.createdAt)}</div>
                  </div>
                  {!notif.read && <div className={styles.dot} />}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
