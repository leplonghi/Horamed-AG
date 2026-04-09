/**
 * useStockRefillReminder — tracks per-medication refill reminders in localStorage
 * When daysRemaining <= 5, exposes a "scheduleReminder" action that records the reminder
 * and triggers a toast notification.
 */

import { useCallback } from 'react';
import { toast } from 'sonner';
import { useStockProjection, StockProjection } from './useStockProjection';
import { format } from 'date-fns';

const REMINDER_PREFIX = 'refill_reminder_';

function getReminderKey(itemId: string): string {
  const today = format(new Date(), 'yyyy-MM-dd');
  return `${REMINDER_PREFIX}${itemId}_${today}`;
}

export function useStockRefillReminder() {
  const { data: stockData } = useStockProjection();

  const criticalItems: StockProjection[] = (stockData || []).filter(
    (item: StockProjection) =>
      item.daysRemaining !== null && item.daysRemaining <= 5
  );

  const isReminderSet = useCallback((itemId: string): boolean => {
    return localStorage.getItem(getReminderKey(itemId)) !== null;
  }, []);

  const scheduleReminder = useCallback((itemId: string, itemName: string) => {
    const key = getReminderKey(itemId);
    if (localStorage.getItem(key)) {
      toast.info(`Lembrete já agendado para ${itemName}`);
      return;
    }
    localStorage.setItem(key, JSON.stringify({ itemId, itemName, createdAt: new Date().toISOString() }));
    toast.success(`Lembrete criado: comprar ${itemName} hoje`, {
      description: 'Você será lembrado quando abrir o app amanhã.',
      duration: 4000,
    });
  }, []);

  const dismissReminder = useCallback((itemId: string) => {
    const key = getReminderKey(itemId);
    localStorage.removeItem(key);
  }, []);

  return { criticalItems, isReminderSet, scheduleReminder, dismissReminder };
}
