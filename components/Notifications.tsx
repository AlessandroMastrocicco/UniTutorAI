import React, { useEffect } from 'react';
import type { AppNotification } from '../types';

// Icons
const LoadingIcon = () => <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>;
const SuccessIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const ErrorIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const CloseIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>;

const ICONS: Record<AppNotification['type'], React.ReactNode> = {
    loading: <LoadingIcon />,
    success: <SuccessIcon />,
    error: <ErrorIcon />,
};

const COLORS: Record<AppNotification['type'], string> = {
    loading: 'bg-gray-800 border-gray-700 text-white',
    success: 'bg-green-800 border-green-700 text-green-200',
    error: 'bg-red-800 border-red-700 text-red-200',
};

interface NotificationItemProps {
    notification: AppNotification;
    onDismiss: (id: string) => void;
}

const NotificationItem: React.FC<NotificationItemProps> = ({ notification, onDismiss }) => {
    useEffect(() => {
        if (notification.duration) {
            const timer = setTimeout(() => {
                onDismiss(notification.id);
            }, notification.duration);
            return () => clearTimeout(timer);
        }
    }, [notification, onDismiss]);

    return (
        <div className={`w-full max-w-sm rounded-xl shadow-2xl p-4 flex items-start space-x-4 border ${COLORS[notification.type]}`}>
            <div className="flex-shrink-0 pt-0.5">
                {ICONS[notification.type]}
            </div>
            <div className="flex-1">
                <p className="text-sm font-medium text-white">{notification.message}</p>
            </div>
            <div className="flex-shrink-0">
                <button onClick={() => onDismiss(notification.id)} className="text-gray-400 hover:text-white">
                    <CloseIcon />
                </button>
            </div>
        </div>
    );
};

interface NotificationsProps {
    notifications: AppNotification[];
    onDismiss: (id: string) => void;
}

export const Notifications: React.FC<NotificationsProps> = ({ notifications, onDismiss }) => {
    return (
        <div className="fixed top-5 right-5 z-50 space-y-3">
            {notifications.map(notification => (
                <NotificationItem key={notification.id} notification={notification} onDismiss={onDismiss} />
            ))}
        </div>
    );
};