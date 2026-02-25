// Service Worker for HoraMed Desktop/Web Notifications
// Handles background notifications even when the app is closed

const CACHE_NAME = 'horamed-v1';
const NOTIFICATION_CACHE = 'horamed-notifications-v1';

// Install event - cache essential resources
self.addEventListener('install', (event) => {
    console.log('[SW] Installing Service Worker...');
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll([
                '/',
                '/index.html',
                '/manifest.json',
            ]);
        })
    );
    self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    console.log('[SW] Activating Service Worker...');
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME && cacheName !== NOTIFICATION_CACHE) {
                        console.log('[SW] Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    return self.clients.claim();
});

// Push notification received
self.addEventListener('push', (event) => {
    console.log('[SW] Push notification received:', event);

    let notificationData = {
        title: 'HoraMed',
        body: 'Hora de tomar seu medicamento!',
        icon: '/icon-192.png',
        badge: '/badge-72.png',
        tag: 'medication-reminder',
        requireInteraction: true,
        vibrate: [200, 100, 200],
        data: {
            url: '/',
            timestamp: Date.now(),
        },
    };

    // Parse push data if available
    if (event.data) {
        try {
            const data = event.data.json();
            notificationData = {
                ...notificationData,
                ...data,
                data: {
                    ...notificationData.data,
                    ...data.data,
                },
            };
        } catch (e) {
            console.error('[SW] Error parsing push data:', e);
        }
    }

    event.waitUntil(
        self.registration.showNotification(notificationData.title, {
            body: notificationData.body,
            icon: notificationData.icon,
            badge: notificationData.badge,
            tag: notificationData.tag,
            requireInteraction: notificationData.requireInteraction,
            vibrate: notificationData.vibrate,
            data: notificationData.data,
            actions: [
                {
                    action: 'taken',
                    title: '✓ Tomado',
                    icon: '/icons/check.png',
                },
                {
                    action: 'snooze',
                    title: '⏰ Soneca (5min)',
                    icon: '/icons/snooze.png',
                },
                {
                    action: 'skip',
                    title: '✕ Pular',
                    icon: '/icons/skip.png',
                },
            ],
        })
    );

    // Store notification in IndexedDB for offline access
    event.waitUntil(storeNotification(notificationData));
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
    console.log('[SW] Notification clicked:', event.action);

    event.notification.close();

    const action = event.action;
    const notificationData = event.notification.data;

    // Handle different actions
    if (action === 'taken') {
        event.waitUntil(handleMedicationTaken(notificationData));
    } else if (action === 'snooze') {
        event.waitUntil(handleSnooze(notificationData));
    } else if (action === 'skip') {
        event.waitUntil(handleSkip(notificationData));
    } else {
        // Default action - open app
        event.waitUntil(
            clients.openWindow(notificationData.url || '/')
        );
    }
});

// Periodic background sync for scheduled notifications
self.addEventListener('periodicsync', (event) => {
    if (event.tag === 'check-medications') {
        console.log('[SW] Periodic sync: checking medications...');
        event.waitUntil(checkScheduledMedications());
    }
});

// Background sync for offline actions
self.addEventListener('sync', (event) => {
    console.log('[SW] Background sync:', event.tag);

    if (event.tag === 'sync-medication-logs') {
        event.waitUntil(syncMedicationLogs());
    }
});

// Message handler for communication with main app
self.addEventListener('message', (event) => {
    console.log('[SW] Message received:', event.data);

    if (event.data.type === 'SCHEDULE_NOTIFICATION') {
        scheduleNotification(event.data.payload);
    } else if (event.data.type === 'CANCEL_NOTIFICATION') {
        cancelNotification(event.data.payload);
    } else if (event.data.type === 'GET_SCHEDULED_NOTIFICATIONS') {
        getScheduledNotifications().then((notifications) => {
            event.ports[0].postMessage({ notifications });
        });
    }
});

// Helper Functions

async function storeNotification(notificationData) {
    const db = await openDB();
    const tx = db.transaction('notifications', 'readwrite');
    const store = tx.objectStore('notifications');

    await store.add({
        ...notificationData,
        timestamp: Date.now(),
        status: 'shown',
    });

    await tx.complete;
}

async function handleMedicationTaken(data) {
    console.log('[SW] Medication marked as taken:', data);

    // Store action in IndexedDB
    const db = await openDB();
    const tx = db.transaction('medication-logs', 'readwrite');
    const store = tx.objectStore('medication-logs');

    await store.add({
        action: 'taken',
        timestamp: Date.now(),
        data,
    });

    await tx.complete;

    // Notify main app if open
    const clients = await self.clients.matchAll({ type: 'window' });
    clients.forEach((client) => {
        client.postMessage({
            type: 'MEDICATION_TAKEN',
            data,
        });
    });

    // Show confirmation notification
    await self.registration.showNotification('Medicamento Registrado', {
        body: 'Marcado como tomado com sucesso!',
        icon: '/icon-192.png',
        tag: 'confirmation',
        requireInteraction: false,
    });
}

async function handleSnooze(data) {
    console.log('[SW] Snooze requested:', data);

    // Schedule notification for 5 minutes later
    const snoozeTime = Date.now() + (5 * 60 * 1000);

    await scheduleNotification({
        ...data,
        scheduledTime: snoozeTime,
        isSnoozed: true,
    });

    // Show confirmation
    await self.registration.showNotification('Soneca Ativada', {
        body: 'Lembrete em 5 minutos',
        icon: '/icon-192.png',
        tag: 'snooze-confirmation',
        requireInteraction: false,
    });
}

async function handleSkip(data) {
    console.log('[SW] Medication skipped:', data);

    // Store skip action
    const db = await openDB();
    const tx = db.transaction('medication-logs', 'readwrite');
    const store = tx.objectStore('medication-logs');

    await store.add({
        action: 'skipped',
        timestamp: Date.now(),
        data,
    });

    await tx.complete;

    // Notify main app
    const clients = await self.clients.matchAll({ type: 'window' });
    clients.forEach((client) => {
        client.postMessage({
            type: 'MEDICATION_SKIPPED',
            data,
        });
    });
}

async function scheduleNotification(payload) {
    const db = await openDB();
    const tx = db.transaction('scheduled-notifications', 'readwrite');
    const store = tx.objectStore('scheduled-notifications');

    await store.add({
        ...payload,
        createdAt: Date.now(),
    });

    await tx.complete;

    console.log('[SW] Notification scheduled:', payload);
}

async function cancelNotification(payload) {
    const db = await openDB();
    const tx = db.transaction('scheduled-notifications', 'readwrite');
    const store = tx.objectStore('scheduled-notifications');

    await store.delete(payload.id);
    await tx.complete;

    console.log('[SW] Notification cancelled:', payload.id);
}

async function getScheduledNotifications() {
    const db = await openDB();
    const tx = db.transaction('scheduled-notifications', 'readonly');
    const store = tx.objectStore('scheduled-notifications');

    const notifications = await store.getAll();
    return notifications;
}

async function checkScheduledMedications() {
    const db = await openDB();
    const tx = db.transaction('scheduled-notifications', 'readonly');
    const store = tx.objectStore('scheduled-notifications');

    const now = Date.now();
    const notifications = await store.getAll();

    // Filter notifications that should be shown now
    const dueNotifications = notifications.filter(
        (n) => n.scheduledTime <= now && !n.shown
    );

    // Show each due notification
    for (const notification of dueNotifications) {
        await self.registration.showNotification(notification.title, {
            body: notification.body,
            icon: notification.icon || '/icon-192.png',
            badge: notification.badge || '/badge-72.png',
            tag: notification.tag || 'medication-reminder',
            requireInteraction: true,
            vibrate: [200, 100, 200],
            data: notification.data,
            actions: [
                { action: 'taken', title: '✓ Tomado' },
                { action: 'snooze', title: '⏰ Soneca (5min)' },
                { action: 'skip', title: '✕ Pular' },
            ],
        });

        // Mark as shown
        const updateTx = db.transaction('scheduled-notifications', 'readwrite');
        const updateStore = updateTx.objectStore('scheduled-notifications');
        notification.shown = true;
        await updateStore.put(notification);
        await updateTx.complete;
    }
}

async function syncMedicationLogs() {
    const db = await openDB();
    const tx = db.transaction('medication-logs', 'readonly');
    const store = tx.objectStore('medication-logs');

    const logs = await store.getAll();

    // Send logs to server when online
    if (logs.length > 0) {
        try {
            // This would be your actual API endpoint
            const response = await fetch('/api/sync-medication-logs', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ logs }),
            });

            if (response.ok) {
                // Clear synced logs
                const clearTx = db.transaction('medication-logs', 'readwrite');
                const clearStore = clearTx.objectStore('medication-logs');
                await clearStore.clear();
                await clearTx.complete;

                console.log('[SW] Medication logs synced successfully');
            }
        } catch (error) {
            console.error('[SW] Error syncing medication logs:', error);
        }
    }
}

// IndexedDB helper
function openDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('HoraMedDB', 1);

        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);

        request.onupgradeneeded = (event) => {
            const db = event.target.result;

            // Create object stores
            if (!db.objectStoreNames.contains('notifications')) {
                db.createObjectStore('notifications', { keyPath: 'id', autoIncrement: true });
            }

            if (!db.objectStoreNames.contains('scheduled-notifications')) {
                db.createObjectStore('scheduled-notifications', { keyPath: 'id', autoIncrement: true });
            }

            if (!db.objectStoreNames.contains('medication-logs')) {
                db.createObjectStore('medication-logs', { keyPath: 'id', autoIncrement: true });
            }
        };
    });
}

console.log('[SW] Service Worker loaded successfully');
