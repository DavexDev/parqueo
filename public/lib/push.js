/**
 * RDP S.A. — Push / Notificaciones en tiempo real
 *
 * Estrategia sin servidor:
 *  - Supabase Realtime broadcast para notificaciones cruzadas entre usuarios
 *  - Web Notifications API para mostrar en el sistema operativo
 *  - Firebase SW ya maneja las notificaciones en segundo plano (cuando el
 *    navegador está cerrado), pero eso requiere Firebase Admin — aquí
 *    cubrimos el caso en-línea y en-segundo-plano dentro del navegador.
 *
 * Uso:
 *   await rdpPush.init(userId);            // llamar después de login
 *   await rdpPush.notify(targetUserId, tipo, titulo, cuerpo, url);
 */

const rdpPush = (() => {
  let _userId   = null;
  let _channel  = null;  // canal de escucha propio del usuario
  let _unread   = 0;
  let _onBadge  = null;  // callback para actualizar badge en navbar

  // ── Registro del Service Worker ──────────────────────────────
  async function registerSW() {
    if (!('serviceWorker' in navigator)) return;
    try {
      await navigator.serviceWorker.register('/firebase-messaging-sw.js');
    } catch (e) {
      console.warn('[Push] SW no registrado:', e.message);
    }
  }

  // ── Permiso de notificaciones del SO ─────────────────────────
  async function requestPermission() {
    if (!('Notification' in window)) return false;
    if (Notification.permission === 'granted') return true;
    if (Notification.permission === 'denied')  return false;
    const result = await Notification.requestPermission();
    return result === 'granted';
  }

  // ── Mostrar notificación del navegador ───────────────────────
  function showBrowserNotif(title, body, url = '/') {
    if (!('Notification' in window) || Notification.permission !== 'granted') return;
    const n = new Notification(title, {
      body,
      icon: '/logo.png',
      badge: '/logo.png',
      tag: 'rdp-' + Date.now()
    });
    n.onclick = () => { window.focus(); if (url) window.location.href = url; n.close(); };
    setTimeout(() => n.close(), 8000);
  }

  // ── Toast en-pantalla (cuando el usuario está en la app) ─────
  function showToast(title, body, url = null) {
    let container = document.getElementById('rdp-toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'rdp-toast-container';
      container.style.cssText = 'position:fixed;top:70px;right:1rem;z-index:9999;display:flex;flex-direction:column;gap:.5rem;max-width:320px;';
      document.body.appendChild(container);
    }
    const toast = document.createElement('div');
    toast.style.cssText = 'background:#0F172A;color:#fff;padding:.75rem 1rem;border-radius:12px;box-shadow:0 4px 16px rgba(0,0,0,.25);cursor:pointer;animation:rdpToastIn .25s ease;border-left:3px solid #D4AF37;';
    toast.innerHTML = `<div style="font-weight:700;font-size:.88rem;">${esc(title)}</div><div style="font-size:.82rem;opacity:.85;margin-top:.15rem;">${esc(body)}</div>`;
    if (url) toast.onclick = () => { window.location.href = url; };
    container.appendChild(toast);
    // Añadir keyframe si no existe
    if (!document.getElementById('rdp-toast-style')) {
      const s = document.createElement('style');
      s.id = 'rdp-toast-style';
      s.textContent = '@keyframes rdpToastIn{from{opacity:0;transform:translateX(40px)}to{opacity:1;transform:translateX(0)}}';
      document.head.appendChild(s);
    }
    setTimeout(() => { toast.style.transition = 'opacity .3s'; toast.style.opacity = '0'; setTimeout(() => toast.remove(), 300); }, 5000);
  }

  // ── Actualizar badge del bell ─────────────────────────────────
  function addUnread(n = 1) {
    _unread += n;
    const badge = document.getElementById('rdp-notif-badge');
    if (badge) {
      badge.textContent = _unread > 9 ? '9+' : _unread;
      badge.style.display = _unread > 0 ? '' : 'none';
    }
    if (_onBadge) _onBadge(_unread);
  }

  function clearUnread() {
    _unread = 0;
    const badge = document.getElementById('rdp-notif-badge');
    if (badge) badge.style.display = 'none';
  }

  // ── Suscribirse al canal personal del usuario ─────────────────
  function subscribeSelf(userId) {
    if (!window.rdpSupabase?.isConfigured) return;
    const client = window.rdpSupabase.getClient();
    _channel = client.channel(`rdp:user:${userId}`)
      .on('broadcast', { event: 'notif' }, ({ payload }) => {
        addUnread();
        showToast(payload.title, payload.body, payload.url);
        showBrowserNotif(payload.title, payload.body, payload.url);
      })
      .subscribe();
  }

  // ── Enviar notificación a otro usuario ────────────────────────
  // Supabase requiere subscribe() antes de send(); creamos un canal
  // temporal, esperamos SUBSCRIBED, enviamos y lo destruimos.
  async function notify(targetUserId, title, body, url = '/') {
    if (!window.rdpSupabase?.isConfigured || !targetUserId) return;
    const client = window.rdpSupabase.getClient();
    return new Promise((resolve) => {
      let sent = false;
      const ch = client.channel(`rdp:user:${targetUserId}`);
      const cleanup = () => { try { client.removeChannel(ch); } catch (_) {} resolve(); };
      const timer = setTimeout(cleanup, 5000);
      ch.subscribe((status) => {
        if (status === 'SUBSCRIBED' && !sent) {
          sent = true;
          clearTimeout(timer);
          ch.send({ type: 'broadcast', event: 'notif', payload: { title, body, url } })
            .catch(() => {})
            .finally(cleanup);
        }
      });
    });
  }

  // ── Init principal ───────────────────────────────────────────
  async function init(userId, onBadgeUpdate = null) {
    _userId  = userId;
    _onBadge = onBadgeUpdate;
    await registerSW();
    await requestPermission();
    subscribeSelf(userId);
  }

  // ── Helper XSS ───────────────────────────────────────────────
  function esc(s) {
    return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }

  return { init, notify, showToast, showBrowserNotif, clearUnread, requestPermission };
})();

window.rdpPush = rdpPush;
