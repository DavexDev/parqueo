/**
 * RDP S.A. — Firebase Client (ES Module, Firebase v12.13.0)
 * Cargar con: <script type="module" src="lib/firebase-client.js"></script>
 * Expone window.rdpFirebase para acceso desde scripts no-módulo.
 *
 * Rol: SOLO notificaciones push (FCM).
 * Todos los datos transaccionales viven en Supabase.
 */

import { initializeApp, getApps } from 'https://www.gstatic.com/firebasejs/12.13.0/firebase-app.js';
import {
  getMessaging,
  getToken,
  onMessage,
  isSupported
} from 'https://www.gstatic.com/firebasejs/12.13.0/firebase-messaging.js';

// ── Configuración del proyecto ────────────────────────────────
const firebaseConfig = {
  apiKey:            window.FIREBASE_API_KEY            || 'AIzaSyBW2Hf2TE1IB36XJy7IME9V9JCKQ7GFDt4',
  authDomain:        window.FIREBASE_AUTH_DOMAIN        || 'parqueo-c49e0.firebaseapp.com',
  projectId:         window.FIREBASE_PROJECT_ID         || 'parqueo-c49e0',
  storageBucket:     window.FIREBASE_STORAGE_BUCKET     || 'parqueo-c49e0.firebasestorage.app',
  messagingSenderId: window.FIREBASE_MESSAGING_SENDER_ID || '298495039584',
  appId:             window.FIREBASE_APP_ID             || '1:298495039584:web:e4a7c057a9288c8170cb05'
};

const VAPID_KEY = window.FIREBASE_VAPID_KEY || '';

// Evitar doble inicialización (hot reload, SPA navigation)
const app = getApps().length > 0
  ? getApps()[0]
  : initializeApp(firebaseConfig);

// ── Instancia de messaging (solo si el browser lo soporta) ────
let _messaging = null;

async function getMessagingInstance() {
  if (_messaging) return _messaging;
  try {
    const supported = await isSupported();
    if (!supported) {
      console.info('[RDP Firebase] Push notifications no soportadas en este navegador.');
      return null;
    }
    _messaging = getMessaging(app);
    return _messaging;
  } catch (err) {
    console.warn('[RDP Firebase] Error al obtener instancia de messaging:', err.message);
    return null;
  }
}

/**
 * Solicitar permiso para notificaciones y obtener FCM token.
 * Guarda el token en Supabase si rdpSupabase está disponible.
 * @returns {Promise<string|null>} token FCM o null
 */
async function requestNotificationPermission() {
  const messaging = await getMessagingInstance();
  if (!messaging) return null;

  try {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.info('[RDP Firebase] Permiso de notificaciones denegado.');
      return null;
    }

    if (!VAPID_KEY) {
      console.warn('[RDP Firebase] VAPID_KEY no configurada. Ve a Firebase Console → Cloud Messaging → Web Push certificates.');
      return null;
    }

    const token = await getToken(messaging, { vapidKey: VAPID_KEY });
    if (!token) return null;

    localStorage.setItem('rdp_fcm_token', token);

    // Guardar en perfil Supabase
    if (window.rdpSupabase?.isConfigured) {
      const user = await window.rdpSupabase.getUser();
      if (user) {
        await window.rdpSupabase.updateProfile(user.id, { push_token: token });
      }
    }

    console.info('[RDP Firebase] FCM token obtenido.');
    return token;
  } catch (err) {
    console.warn('[RDP Firebase] Error obteniendo FCM token:', err.message);
    return null;
  }
}

/**
 * Registrar callback para mensajes en primer plano.
 * @param {function} callback - fn({ title, body, data })
 * @returns {Promise<function>} unsubscribe
 */
async function onForegroundMessage(callback) {
  const messaging = await getMessagingInstance();
  if (!messaging) return () => {};

  return onMessage(messaging, (payload) => {
    const { notification = {}, data = {} } = payload;
    callback({
      title: notification.title || 'RDP S.A.',
      body:  notification.body  || '',
      data
    });
  });
}

/**
 * Mostrar notificación visual nativa (fallback si no hay SW).
 */
function showToast(title, body) {
  if (typeof window.rdpToast === 'function') {
    window.rdpToast(`${title}: ${body}`);
    return;
  }
  if (Notification.permission === 'granted') {
    new Notification(title, { body, icon: '/logo.png' });
  }
}

// ── Exponer globalmente para compatibilidad con scripts no-módulo ──
window.rdpFirebase = {
  app,
  isConfigured: true,
  requestNotificationPermission,
  onForegroundMessage,
  showToast
};

console.info('[RDP Firebase] Inicializado. Proyecto:', firebaseConfig.projectId);
