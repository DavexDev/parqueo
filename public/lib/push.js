/**
 * RDP S.A. — Push / Notificaciones en tiempo real
 *
 * Estrategia:
 *  - Supabase Realtime broadcast para entregas cruzadas entre usuarios
 *  - Al recibir, persiste en tabla notifications (RLS: receptor = auth.uid())
 *  - Al iniciar, carga historial desde notifications
 *  - Bell click → dropdown con lista, marcar leído, navegación
 */

const rdpPush = (() => {
  let _userId  = null;
  let _channel = null;
  let _unread  = 0;
  let _history = [];   // [{ id?, titulo, cuerpo, url, tipo, leido, created_at }]
  let _dropOpen = false;

  // ── Service Worker ────────────────────────────────────────────
  async function registerSW() {
    if (!('serviceWorker' in navigator)) return;
    try { await navigator.serviceWorker.register('/firebase-messaging-sw.js'); }
    catch (e) { console.warn('[Push] SW no registrado:', e.message); }
  }

  // ── Permiso del SO ────────────────────────────────────────────
  async function requestPermission() {
    if (!('Notification' in window)) return false;
    if (Notification.permission === 'granted') return true;
    if (Notification.permission === 'denied')  return false;
    return (await Notification.requestPermission()) === 'granted';
  }

  // ── Notificación nativa del navegador ────────────────────────
  function showBrowserNotif(title, body, url = '/') {
    if (!('Notification' in window) || Notification.permission !== 'granted') return;
    const n = new Notification(title, { body, icon: '/logo.png', badge: '/logo.png', tag: 'rdp-' + Date.now() });
    n.onclick = () => { window.focus(); if (url) window.location.href = url; n.close(); };
    setTimeout(() => n.close(), 8000);
  }

  // ── Toast en-pantalla ─────────────────────────────────────────
  function showToast(title, body, url = null) {
    let container = document.getElementById('rdp-toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'rdp-toast-container';
      container.style.cssText = 'position:fixed;top:70px;right:1rem;z-index:9999;display:flex;flex-direction:column;gap:.5rem;max-width:320px;pointer-events:none;';
      document.body.appendChild(container);
    }
    if (!document.getElementById('rdp-toast-style')) {
      const s = document.createElement('style');
      s.id = 'rdp-toast-style';
      s.textContent = '@keyframes rdpToastIn{from{opacity:0;transform:translateX(40px)}to{opacity:1;transform:translateX(0)}}';
      document.head.appendChild(s);
    }
    const toast = document.createElement('div');
    toast.style.cssText = 'background:#0F172A;color:#fff;padding:.75rem 1rem;border-radius:12px;box-shadow:0 4px 16px rgba(0,0,0,.25);cursor:pointer;animation:rdpToastIn .25s ease;border-left:3px solid #D4AF37;pointer-events:auto;';
    toast.innerHTML = `<div style="font-weight:700;font-size:.88rem;">${esc(title)}</div><div style="font-size:.82rem;opacity:.85;margin-top:.15rem;">${esc(body)}</div>`;
    if (url) toast.onclick = () => { window.location.href = url; };
    container.appendChild(toast);
    setTimeout(() => { toast.style.transition = 'opacity .3s'; toast.style.opacity = '0'; setTimeout(() => toast.remove(), 300); }, 5000);
  }

  // ── Badge ─────────────────────────────────────────────────────
  function addUnread(n = 1) {
    _unread += n;
    const badge = document.getElementById('rdp-notif-badge');
    if (badge) { badge.textContent = _unread > 9 ? '9+' : _unread; badge.style.display = ''; }
  }
  function clearUnread() {
    _unread = 0;
    const badge = document.getElementById('rdp-notif-badge');
    if (badge) badge.style.display = 'none';
  }

  // ── Tipo ──────────────────────────────────────────────────────
  function inferTipo(title) {
    const t = (title || '').toLowerCase();
    if (t.includes('mensaje')) return 'mensaje_nuevo';
    if (t.includes('confirmad')) return 'reserva_confirmada';
    if (t.includes('cancelad')) return 'reserva_cancelada';
    if (t.includes('reserva') || t.includes('reservó')) return 'reserva_nueva';
    if (t.includes('pago') || t.includes('comisi')) return 'pago_recibido';
    return 'sistema';
  }
  function tipoIcon(tipo) {
    return ({ reserva_nueva:'bi-calendar-plus', reserva_confirmada:'bi-check-circle-fill',
      reserva_cancelada:'bi-x-circle', pago_recibido:'bi-cash-stack',
      mensaje_nuevo:'bi-chat-dots-fill', resena_nueva:'bi-star-fill',
      incidente_nuevo:'bi-exclamation-triangle-fill', sistema:'bi-bell-fill' })[tipo] || 'bi-bell-fill';
  }

  // ── Historial desde BD ────────────────────────────────────────
  async function loadHistory() {
    if (!window.rdpSupabase?.isConfigured || !_userId) return;
    const client = window.rdpSupabase.getClient();
    const { data } = await client.from('notifications')
      .select('id, titulo, cuerpo, tipo, leido, referencia_tipo, created_at')
      .eq('usuario_id', _userId)
      .order('created_at', { ascending: false })
      .limit(30);
    if (!data) return;
    _history = data.map(n => ({
      id: n.id, titulo: n.titulo, cuerpo: n.cuerpo,
      url: n.referencia_tipo,   // almacenamos la URL en este campo
      tipo: n.tipo, leido: n.leido, created_at: n.created_at
    }));
    const unread = _history.filter(n => !n.leido).length;
    _unread = unread;
    const badge = document.getElementById('rdp-notif-badge');
    if (badge && unread > 0) { badge.textContent = unread > 9 ? '9+' : unread; badge.style.display = ''; }
  }

  // ── Marcar todo leído ─────────────────────────────────────────
  async function markAllRead() {
    _history.forEach(n => { n.leido = true; });
    clearUnread();
    refreshDropdown();
    if (!window.rdpSupabase?.isConfigured || !_userId) return;
    const client = window.rdpSupabase.getClient();
    await client.from('notifications').update({ leido: true }).eq('usuario_id', _userId).eq('leido', false);
  }

  // ── Tiempo relativo ───────────────────────────────────────────
  function relTime(iso) {
    const diff = (Date.now() - new Date(iso).getTime()) / 1000;
    if (diff < 60) return 'Ahora';
    if (diff < 3600) return Math.floor(diff / 60) + ' min';
    if (diff < 86400) return Math.floor(diff / 3600) + 'h';
    return Math.floor(diff / 86400) + 'd';
  }

  // ── Dropdown ──────────────────────────────────────────────────
  function renderDropdownContent() {
    const items = _history.slice(0, 25);
    const hasUnread = items.some(n => !n.leido);
    let rows = '';
    if (items.length === 0) {
      rows = `<div style="text-align:center;padding:2.5rem 1rem;color:#94a3b8;font-size:.85rem;"><i class="bi bi-bell-slash" style="font-size:2rem;display:block;margin-bottom:.5rem;"></i>Sin notificaciones</div>`;
    } else {
      for (const n of items) {
        const icon = tipoIcon(n.tipo || inferTipo(n.titulo));
        const unreadBg = n.leido ? '' : 'background:rgba(212,175,55,.07);';
        const dot = n.leido ? '' : `<span style="width:7px;height:7px;border-radius:50%;background:#ef4444;flex-shrink:0;margin-top:.3rem;display:block;"></span>`;
        const safeUrl = n.url ? n.url.replace(/'/g, '') : '';
        const handler = safeUrl
          ? `onclick="rdpPush.closeDropdown();window.location.href='${safeUrl}'"`
          : `onclick="rdpPush.closeDropdown()"`;
        rows += `<div style="display:flex;gap:.65rem;padding:.6rem .85rem;cursor:pointer;border-bottom:1px solid #f1f5f9;${unreadBg}transition:background .15s;" ${handler}
          onmouseenter="this.style.background='#f8fafc'" onmouseleave="this.style.background='${n.leido ? '' : 'rgba(212,175,55,.07)'}'">
          <div style="width:34px;height:34px;border-radius:10px;background:#0F172A;color:#D4AF37;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
            <i class="bi ${icon}" style="font-size:.9rem;"></i>
          </div>
          <div style="flex:1;min-width:0;">
            <div style="font-weight:${n.leido ? '500' : '700'};font-size:.82rem;color:#0F172A;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${esc(n.titulo)}</div>
            <div style="font-size:.76rem;color:#64748b;margin-top:.1rem;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;">${esc(n.cuerpo)}</div>
          </div>
          <div style="display:flex;flex-direction:column;align-items:flex-end;gap:.25rem;flex-shrink:0;">
            <span style="font-size:.69rem;color:#94a3b8;white-space:nowrap;">${relTime(n.created_at)}</span>
            ${dot}
          </div>
        </div>`;
      }
    }
    return `
      <div style="padding:.65rem .9rem .5rem;border-bottom:1px solid #e2e8f0;display:flex;align-items:center;justify-content:space-between;flex-shrink:0;">
        <span style="font-weight:700;font-size:.9rem;color:#0F172A;">Notificaciones</span>
        ${hasUnread ? `<button onclick="rdpPush.markAllRead()" style="background:none;border:none;font-size:.72rem;color:#D4AF37;cursor:pointer;font-weight:600;padding:0;">Marcar todo leído</button>` : ''}
      </div>
      <div style="overflow-y:auto;flex:1;">${rows}</div>`;
  }

  function refreshDropdown() {
    const d = document.getElementById('rdp-notif-dropdown');
    if (d) d.innerHTML = renderDropdownContent();
  }

  function closeDropdown() {
    document.getElementById('rdp-notif-dropdown')?.remove();
    _dropOpen = false;
    document.removeEventListener('click', _outsideClick);
  }

  function _outsideClick(e) {
    const d = document.getElementById('rdp-notif-dropdown');
    const b = document.getElementById('rdp-notif-btn');
    if (d && !d.contains(e.target) && (!b || !b.contains(e.target))) closeDropdown();
  }

  function toggleDropdown() {
    if (_dropOpen) { closeDropdown(); return; }
    _dropOpen = true;
    const el = document.createElement('div');
    el.id = 'rdp-notif-dropdown';
    // Posición: debajo del bell, alineado a la derecha
    const btn = document.getElementById('rdp-notif-btn');
    let topPx = '58px', rightPx = '.75rem';
    if (btn) {
      const r = btn.getBoundingClientRect();
      topPx = (r.bottom + 8) + 'px';
      rightPx = (window.innerWidth - r.right) + 'px';
    }
    el.style.cssText = `position:fixed;top:${topPx};right:${rightPx};z-index:9980;background:#fff;border-radius:16px;box-shadow:0 8px 32px rgba(15,23,42,.18);width:320px;max-height:420px;display:flex;flex-direction:column;overflow:hidden;animation:rdpDropIn .18s ease;`;
    if (!document.getElementById('rdp-drop-style')) {
      const s = document.createElement('style');
      s.id = 'rdp-drop-style';
      s.textContent = '@keyframes rdpDropIn{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:translateY(0)}}';
      document.head.appendChild(s);
    }
    el.innerHTML = renderDropdownContent();
    document.body.appendChild(el);
    setTimeout(() => document.addEventListener('click', _outsideClick), 0);
  }

  // ── Suscripción personal ──────────────────────────────────────
  function subscribeSelf(userId) {
    if (!window.rdpSupabase?.isConfigured) return;
    const client = window.rdpSupabase.getClient();
    _channel = client.channel(`rdp:user:${userId}`)
      .on('broadcast', { event: 'notif' }, ({ payload }) => {
        const tipo = inferTipo(payload.title);
        const item = { titulo: payload.title, cuerpo: payload.body, url: payload.url, tipo, leido: false, created_at: new Date().toISOString() };
        _history.unshift(item);
        // Persistir en BD (receptor = auth.uid() → RLS ok)
        client.from('notifications').insert({
          usuario_id: userId, tipo,
          titulo: payload.title, cuerpo: payload.body,
          referencia_tipo: payload.url || null
        }).select('id').single().then(({ data }) => { if (data?.id) item.id = data.id; });
        if (_dropOpen) refreshDropdown();
        addUnread();
        showToast(payload.title, payload.body, payload.url);
        showBrowserNotif(payload.title, payload.body, payload.url);
      })
      .subscribe();
  }

  // ── Enviar notificación a otro usuario ────────────────────────
  // Supabase requiere subscribe() + estado SUBSCRIBED antes de send().
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
            .catch(() => {}).finally(cleanup);
        }
      });
    });
  }

  // ── Init ──────────────────────────────────────────────────────
  async function init(userId) {
    _userId = userId;
    await registerSW();
    await requestPermission();
    subscribeSelf(userId);
    await loadHistory();
  }

  // ── Helper XSS ───────────────────────────────────────────────
  function esc(s) {
    return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }

  return { init, notify, showToast, showBrowserNotif, clearUnread, toggleDropdown, closeDropdown, markAllRead, requestPermission };
})();

window.rdpPush = rdpPush;
