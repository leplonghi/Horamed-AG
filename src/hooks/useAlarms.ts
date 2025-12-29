/**
 * Hook for managing scheduled alarms and notifications
 * Works with Service Worker for background execution
 */

import { useState, useEffect, useCallback } from 'react';
import { alarmDB, Alarm } from '@/lib/alarmDB';
import { toast } from 'sonner';

interface UseAlarmsReturn {
  alarms: Alarm[];
  loading: boolean;
  error: string | null;
  createAlarm: (alarm: Omit<Alarm, 'id' | 'createdAt'>) => Promise<string>;
  updateAlarm: (alarm: Alarm) => Promise<void>;
  deleteAlarm: (id: string) => Promise<void>;
  toggleAlarm: (id: string) => Promise<void>;
  testNotification: (title?: string, message?: string) => Promise<void>;
  requestPermission: () => Promise<boolean>;
  permissionStatus: NotificationPermission | 'unsupported';
  isSupported: boolean;
  syncWithServiceWorker: () => Promise<void>;
}

// Check if notifications are supported
const checkSupport = () => {
  return 'Notification' in window && 'serviceWorker' in navigator;
};

// Generate unique ID
const generateId = () => {
  return `alarm-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

export function useAlarms(): UseAlarmsReturn {
  const [alarms, setAlarms] = useState<Alarm[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermission | 'unsupported'>(
    checkSupport() ? Notification.permission : 'unsupported'
  );

  const isSupported = checkSupport();

  // Load alarms from IndexedDB
  const loadAlarms = useCallback(async () => {
    try {
      setLoading(true);
      const storedAlarms = await alarmDB.getAll();
      setAlarms(storedAlarms.sort((a, b) => 
        new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime()
      ));
      setError(null);
    } catch (err) {
      console.error('[useAlarms] Error loading alarms:', err);
      setError('Erro ao carregar alarmes');
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    loadAlarms();
  }, [loadAlarms]);

  // Listen for messages from service worker
  useEffect(() => {
    if (!isSupported) return;

    const handleMessage = (event: MessageEvent) => {
      const { type, alarmId } = event.data || {};
      
      if (type === 'ALARM_COMPLETED') {
        loadAlarms();
        toast.success('Alarme concluído!');
      }
      
      if (type === 'NOTIFICATION_CLOSED') {
        console.log('[useAlarms] Notification closed:', alarmId);
      }
    };

    navigator.serviceWorker.addEventListener('message', handleMessage);
    
    return () => {
      navigator.serviceWorker.removeEventListener('message', handleMessage);
    };
  }, [isSupported, loadAlarms]);

  // Request notification permission
  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!isSupported) {
      toast.error('Notificações não são suportadas neste navegador');
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      setPermissionStatus(permission);
      
      if (permission === 'granted') {
        toast.success('Notificações ativadas!');
        return true;
      } else if (permission === 'denied') {
        toast.error('Notificações bloqueadas. Ative nas configurações do navegador.');
        return false;
      }
      
      return false;
    } catch (err) {
      console.error('[useAlarms] Error requesting permission:', err);
      toast.error('Erro ao solicitar permissão');
      return false;
    }
  }, [isSupported]);

  // Send message to service worker
  const sendToServiceWorker = useCallback(async (type: string, payload: any) => {
    if (!isSupported) return null;

    const registration = await navigator.serviceWorker.ready;
    
    return new Promise((resolve, reject) => {
      const messageChannel = new MessageChannel();
      
      messageChannel.port1.onmessage = (event) => {
        if (event.data.success) {
          resolve(event.data);
        } else {
          reject(new Error(event.data.error || 'Unknown error'));
        }
      };

      registration.active?.postMessage(
        { type, payload },
        [messageChannel.port2]
      );

      // Timeout after 5 seconds
      setTimeout(() => reject(new Error('Timeout')), 5000);
    });
  }, [isSupported]);

  // Create new alarm
  const createAlarm = useCallback(async (
    alarmData: Omit<Alarm, 'id' | 'createdAt'>
  ): Promise<string> => {
    try {
      // Check permission first
      if (permissionStatus !== 'granted') {
        const granted = await requestPermission();
        if (!granted) throw new Error('Permissão negada');
      }

      const alarm: Alarm = {
        ...alarmData,
        id: generateId(),
        createdAt: new Date().toISOString(),
      };

      // Save to IndexedDB
      await alarmDB.save(alarm);

      // Notify service worker
      try {
        await sendToServiceWorker('SCHEDULE_ALARM', alarm);
      } catch (swError) {
        console.warn('[useAlarms] Service worker not available, alarm saved locally');
      }

      // Update state
      setAlarms(prev => [...prev, alarm].sort((a, b) => 
        new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime()
      ));

      toast.success('Alarme criado com sucesso!');
      return alarm.id;
    } catch (err) {
      console.error('[useAlarms] Error creating alarm:', err);
      toast.error('Erro ao criar alarme');
      throw err;
    }
  }, [permissionStatus, requestPermission, sendToServiceWorker]);

  // Update existing alarm
  const updateAlarm = useCallback(async (alarm: Alarm) => {
    try {
      await alarmDB.save(alarm);

      try {
        await sendToServiceWorker('UPDATE_ALARM', alarm);
      } catch (swError) {
        console.warn('[useAlarms] Service worker not available');
      }

      setAlarms(prev => prev.map(a => a.id === alarm.id ? alarm : a));
      toast.success('Alarme atualizado!');
    } catch (err) {
      console.error('[useAlarms] Error updating alarm:', err);
      toast.error('Erro ao atualizar alarme');
      throw err;
    }
  }, [sendToServiceWorker]);

  // Delete alarm
  const deleteAlarm = useCallback(async (id: string) => {
    try {
      await alarmDB.delete(id);

      try {
        await sendToServiceWorker('CANCEL_ALARM', { id });
      } catch (swError) {
        console.warn('[useAlarms] Service worker not available');
      }

      setAlarms(prev => prev.filter(a => a.id !== id));
      toast.success('Alarme excluído!');
    } catch (err) {
      console.error('[useAlarms] Error deleting alarm:', err);
      toast.error('Erro ao excluir alarme');
      throw err;
    }
  }, [sendToServiceWorker]);

  // Toggle alarm enabled state
  const toggleAlarm = useCallback(async (id: string) => {
    try {
      const alarm = await alarmDB.toggleEnabled(id);
      if (alarm) {
        try {
          await sendToServiceWorker('UPDATE_ALARM', alarm);
        } catch (swError) {
          console.warn('[useAlarms] Service worker not available');
        }

        setAlarms(prev => prev.map(a => a.id === id ? alarm : a));
        toast.success(alarm.enabled ? 'Alarme ativado!' : 'Alarme desativado!');
      }
    } catch (err) {
      console.error('[useAlarms] Error toggling alarm:', err);
      toast.error('Erro ao alterar alarme');
    }
  }, [sendToServiceWorker]);

  // Test notification
  const testNotification = useCallback(async (
    title = '🔔 Teste de Notificação',
    message = 'Esta é uma notificação de teste do HoraMed!'
  ) => {
    try {
      if (permissionStatus !== 'granted') {
        const granted = await requestPermission();
        if (!granted) return;
      }

      // Try service worker first
      try {
        await sendToServiceWorker('TEST_NOTIFICATION', { title, message });
        return;
      } catch (swError) {
        console.warn('[useAlarms] Service worker not available, using Notification API');
      }

      // Fallback to direct Notification API
      if ('Notification' in window) {
        const options: NotificationOptions = {
          body: message,
          icon: '/icons/icon-192.png',
          badge: '/favicon.png',
        };
        new Notification(title, options);
      }
    } catch (err) {
      console.error('[useAlarms] Error testing notification:', err);
      toast.error('Erro ao enviar notificação de teste');
    }
  }, [permissionStatus, requestPermission, sendToServiceWorker]);

  // Sync with service worker
  const syncWithServiceWorker = useCallback(async () => {
    if (!isSupported) return;

    try {
      await sendToServiceWorker('CHECK_ALARMS', {});
      await loadAlarms();
    } catch (err) {
      console.error('[useAlarms] Error syncing with service worker:', err);
    }
  }, [isSupported, sendToServiceWorker, loadAlarms]);

  return {
    alarms,
    loading,
    error,
    createAlarm,
    updateAlarm,
    deleteAlarm,
    toggleAlarm,
    testNotification,
    requestPermission,
    permissionStatus,
    isSupported,
    syncWithServiceWorker,
  };
}
