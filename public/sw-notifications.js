// Service Worker Helper for HoraMed Notifications
// Imported by the main Service Worker via importScripts

console.log('[SW] Loading Notification Module...');

// Cache for notification assets (icons, badges)
const NOTIF_CACHE_NAME = 'horamed-notifications-resources-v1';

// IndexedDB configuration
const DB_NAME = 'HoraMedDB';
const DB_VERSION = 2; // Incremented version

// Push notification received
self.addEventListener('push', (event) => {
  console.log('[SW-Notif] Push received:', event);

  let data = {
    title: 'HoraMed',
    body: 'Novo lembrete',
    tag: 'default',
    timestamp: Date.now()
  };

  if (event.data) {
    try {
      const json = event.data.json();
      data = { ...data, ...json };
    } catch (e) {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: data.icon || '/icons/icon-192.png', // Ensure this path exists
    badge: data.badge || '/favicon.png',
    tag: data.tag,
    data: data.data || {},
    actions: data.actions || [
      { action: 'open', title: 'Abrir App' }
    ],
    vibrate: data.vibrate || [100, 50, 100],
    requireInteraction: data.requireInteraction || false,
    renotify: data.renotify || true
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
      .then(() => storeNotificationLog(data))
  );
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  console.log('[SW-Notif] Notification clicked:', event.action);

  event.notification.close();

  const action = event.action;
  const data = event.notification.data || {};
  const url = data.url || '/';

  // Specific Actions
  if (action === 'taken') {
    event.waitUntil(handleActionTaken(data));
  } else if (action === 'snooze') {
    event.waitUntil(handleActionSnooze(data));
  } else if (action === 'skip') {
    event.waitUntil(handleActionSkip(data));
  } else {
    // Default: Open Window
    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true })
        .then((windowClients) => {
          // Check if there is already a window/tab open with the target URL
          for (let i = 0; i < windowClients.length; i++) {
            const client = windowClients[i];
            if (client.url === url && 'focus' in client) {
              return client.focus();
            }
          }
          // If not, open a new window
          if (clients.openWindow) {
            return clients.openWindow(url);
          }
        })
    );
  }
});

// Interaction Handling Helpers
async function handleActionTaken(data) {
  // Logic to mark as taken (e.g., sync to server or store in IDB for sync)
  console.log('[SW-Notif] Handling TAKEN action', data);
  await sendMessageToClients({ type: 'MEDICATION_TAKEN', payload: data });
  // Could also implement direct API call here if supported
}

async function handleActionSnooze(data) {
  console.log('[SW-Notif] Handling SNOOZE action', data);
  // Re-schedule logic would typically be server-side for reliability, 
  // or client-side if the app is open. 
  // For offline SW, we might use a delayed notification if the browser supports it, 
  // but standard SW doesn't support "wait and show later" easily without keeping the SW alive.
  // We'll notify the client.
  await sendMessageToClients({ type: 'MEDICATION_SNOOZED', payload: data });
}

async function handleActionSkip(data) {
  console.log('[SW-Notif] Handling SKIP action', data);
  await sendMessageToClients({ type: 'MEDICATION_SKIPPED', payload: data });
}

// Log notification to IndexedDB
async function storeNotificationLog(data) {
  const db = await openDB();
  const tx = db.transaction('notification-logs', 'readwrite');
  tx.objectStore('notification-logs').add({
    ...data,
    receivedAt: Date.now()
  });
  return tx.complete;
}

// Communication with Clients
async function sendMessageToClients(message) {
  const allClients = await clients.matchAll({ type: 'window', includeUncontrolled: true });
  return Promise.all(allClients.map(client => client.postMessage(message)));
}

// IndexedDB Helper
function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('notification-logs')) {
        db.createObjectStore('notification-logs', { keyPath: 'id', autoIncrement: true });
      }
    };
  });
}

// Listen for messages from the main app
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  // Handle other messages if needed
});
