/**
 * RDP S.A. — Firebase Messaging Service Worker
 * Maneja notificaciones push en segundo plano (cuando la app no está en foco).
 *
 * Este archivo DEBE estar en la raíz del dominio (/firebase-messaging-sw.js)
 * para que FCM pueda registrarlo correctamente.
 * En Vercel, public/firebase-messaging-sw.js se sirve como /firebase-messaging-sw.js
 */

// Firebase 12.13.0 — importScripts para service workers (no ES modules)
importScripts('https://www.gstatic.com/firebasejs/12.13.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/12.13.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey:            'AIzaSyBW2Hf2TE1IB36XJy7IME9V9JCKQ7GFDt4',
  authDomain:        'parqueo-c49e0.firebaseapp.com',
  projectId:         'parqueo-c49e0',
  storageBucket:     'parqueo-c49e0.firebasestorage.app',
  messagingSenderId: '298495039584',
  appId:             '1:298495039584:web:e4a7c057a9288c8170cb05'
});

const messaging = firebase.messaging();

// Manejar mensajes en segundo plano
messaging.onBackgroundMessage((payload) => {
  const { notification = {}, data = {} } = payload;

  const title = notification.title || data.title || 'RDP S.A.';
  const body  = notification.body  || data.body  || 'Nueva notificación';
  const icon  = notification.icon  || '/logo.png';
  const badge = '/badge.png';
  const tag   = data.tag || 'rdp-notification';

  // Datos para el click handler
  const notificationData = {
    url: data.url || '/',
    ...data
  };

  return self.registration.showNotification(title, {
    body,
    icon,
    badge,
    tag,
    renotify: true,
    data: notificationData
  });
});

// Abrir/enfocar la app al hacer clic en la notificación
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // Si ya hay una ventana abierta con esa URL, enfocarla
      for (const client of windowClients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }
      // Si no hay ventana abierta, abrir una nueva
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
