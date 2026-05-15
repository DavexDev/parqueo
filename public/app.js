// SPDX-License-Identifier: LicenseRef-Proprietary
// SPDX-FileCopyrightText: 2026 DavexDev
// =============================================================================
// © 2026 DavexDev — Parqueos Esquipulas, Guatemala.
// CODIGO PROPIETARIO — Todos los derechos reservados.
// Queda estrictamente prohibido copiar, modificar, distribuir o usar este
// archivo sin autorizacion escrita previa del autor.
// El acceso a este archivo no otorga ningun derecho de uso ni licencia.
// Ver /terminos.html o archivo LICENSE para condiciones completas.
// =============================================================================
// app.js — Sesión, navbar y helpers globales

function getUser() {
  const raw = localStorage.getItem('parqueo_user');
  return raw ? JSON.parse(raw) : null;
}

function getToken() {
  return localStorage.getItem('token');
}

function setUser(user, token) {
  localStorage.setItem('parqueo_user', JSON.stringify(user));
  if (token) localStorage.setItem('token', token);
}

function getHeaders() {
  const token = getToken();
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
}

function logout() {
  if (window.rdpSupabase?.signOut) window.rdpSupabase.signOut();
  localStorage.removeItem('parqueo_user');
  localStorage.removeItem('token');
  window.location.href = 'login.html';
}

function requireLogin(rolesPermitidos) {
  const user = getUser();
  if (!user) { window.location.href = 'login.html'; return null; }
  if (rolesPermitidos && !rolesPermitidos.includes(user.rol)) {
    window.location.href = 'index.html';
    return null;
  }
  return user;
}

function renderNavbar() {
  const user = getUser();
  const nav = document.querySelector('.navbar-parqueo .container-fluid');
  if (!nav) return;
  const brand = `<a class="navbar-brand" href="index.html"><div class="navbar-brand-logo">R</div>RDP S.A.</a>`;
  if (user) {
    const rolClass = user.rol === 'admin' ? 'badge-admin' : user.rol === 'anfitrion' ? 'badge-anfitrion' : 'badge-visitante';
    nav.innerHTML = `
      ${brand}
      <div class="d-flex align-items-center gap-2">
        <span class="text-white small fw-600" style="max-width:80px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${user.nombre}</span>
        <span class="navbar-badge badge-rol ${rolClass}">${user.rol}</span>
        <button id="rdp-notif-btn" class="btn btn-sm btn-outline-light position-relative" style="border-radius:20px;font-size:0.75rem;padding:0.2rem 0.65rem;" title="Notificaciones" onclick="rdpPush?.toggleDropdown()">
          <i class="bi bi-bell-fill"></i>
          <span id="rdp-notif-badge" style="display:none;position:absolute;top:-4px;right:-4px;background:#ef4444;color:#fff;font-size:.6rem;font-weight:700;border-radius:99px;padding:1px 4px;line-height:1.2;"></span>
        </button>
        <button class="btn btn-sm btn-outline-light" style="border-radius:20px;font-size:0.75rem;padding:0.2rem 0.65rem;" title="Modo oscuro" onclick="toggleDarkMode()"><i class="bi bi-moon-stars"></i></button>
        <button class="btn btn-sm btn-outline-light" style="border-radius:20px;font-size:0.75rem;padding:0.2rem 0.65rem;" onclick="logout()">Salir</button>
      </div>
    `;
    // Inicializar push después de renderizar (async, no bloquea)
    if (window.rdpPush && user.id) {
      window.rdpPush.init(user.id).catch(() => {});
    }
    // Tutorial interactivo de primer uso
    if (window.rdpTutorial) {
      window.rdpTutorial.init(user.rol);
    }
  } else {
    nav.innerHTML = `
      ${brand}
      <a href="login.html" class="btn btn-sm btn-outline-light" style="border-radius:20px;font-size:0.8rem;">Entrar</a>
    `;
  }
}

function renderBottomBar(activePage) {
  const user = getUser();
  if (!user) return;
  const pages = [];
  if (user.rol === 'visitante') {
    pages.push({ href: 'index.html', icon: 'bi-house-door-fill', label: 'Inicio', key: 'home' });
    pages.push({ href: 'parkings.html', icon: 'bi-search', label: 'Buscar', key: 'parkings' });
    pages.push({ href: 'reservations.html', icon: 'bi-calendar-check-fill', label: 'Reservas', key: 'reservas' });
    pages.push({ href: 'messages.html', icon: 'bi-chat-dots-fill', label: 'Mensajes', key: 'messages' });
  } else if (user.rol === 'anfitrion') {
    pages.push({ href: 'index.html', icon: 'bi-house-door-fill', label: 'Inicio', key: 'home' });
    pages.push({ href: 'publish.html', icon: 'bi-plus-circle-fill', label: 'Publicar', key: 'publish' });
    pages.push({ href: 'host-dashboard.html', icon: 'bi-shop-fill', label: 'Mi Negocio', key: 'host' });
    pages.push({ href: 'messages.html', icon: 'bi-chat-dots-fill', label: 'Mensajes', key: 'messages' });
  } else if (user.rol === 'admin') {
    pages.push({ href: 'index.html', icon: 'bi-house-door-fill', label: 'Inicio', key: 'home' });
    pages.push({ href: 'admin.html', icon: 'bi-sliders', label: 'Admin', key: 'admin' });
    pages.push({ href: 'messages.html', icon: 'bi-chat-dots-fill', label: 'Mensajes', key: 'messages' });
    pages.push({ href: 'metrics.html', icon: 'bi-bar-chart-line-fill', label: 'Métricas', key: 'metrics' });
  }
  const bar = document.createElement('div');
  bar.className = 'bottom-bar';
  bar.innerHTML = pages.map(p =>
    `<a href="${p.href}" class="${activePage === p.key ? 'active' : ''}">
      <i class="tab-icon bi ${p.icon}"></i><span>${p.label}</span>
    </a>`
  ).join('');
  document.body.appendChild(bar);
}

function toggleDarkMode() {
  document.body.classList.toggle('dark-mode');
  localStorage.setItem('darkMode', document.body.classList.contains('dark-mode'));
}

// Cargar dark mode setting al iniciar
if (localStorage.getItem('darkMode') === 'true') {
  document.body.classList.add('dark-mode');
}

// ── Mensajes amigables ────────────────────────────────────────────────────────
// Uso: rdpAlert('Texto', 'success'|'error'|'warning'|'info')
//      await rdpConfirm('¿Seguro?', 'Confirmar', 'Cancelar')
function rdpAlert(msg, tipo = 'info') {
  const cfg = {
    success: { icon: 'bi-check-circle-fill',         color: '#16a34a', bg: '#f0fdf4' },
    error:   { icon: 'bi-x-circle-fill',             color: '#dc2626', bg: '#fef2f2' },
    warning: { icon: 'bi-exclamation-triangle-fill', color: '#d97706', bg: '#fffbeb' },
    info:    { icon: 'bi-info-circle-fill',           color: '#0F172A', bg: '#f8fafc' }
  };
  const { icon, color } = cfg[tipo] || cfg.info;
  document.getElementById('rdp-alert-overlay')?.remove();
  if (!document.getElementById('rdp-alert-style')) {
    const s = document.createElement('style');
    s.id = 'rdp-alert-style';
    s.textContent = '@keyframes rdpAlertIn{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}';
    document.head.appendChild(s);
  }
  const el = document.createElement('div');
  el.id = 'rdp-alert-overlay';
  el.style.cssText = 'position:fixed;inset:0;z-index:10000;display:flex;align-items:flex-end;justify-content:center;padding:1rem;pointer-events:none;';
  el.innerHTML = `
    <div style="pointer-events:auto;background:#fff;border-radius:16px;padding:1rem 1.1rem;width:100%;max-width:400px;box-shadow:0 8px 32px rgba(15,23,42,.18);animation:rdpAlertIn .22s ease;border-left:4px solid ${color};display:flex;align-items:flex-start;gap:.75rem;">
      <i class="bi ${icon}" style="font-size:1.2rem;color:${color};flex-shrink:0;margin-top:.1rem;"></i>
      <span style="flex:1;font-size:.87rem;color:#1e293b;line-height:1.5;">${msg}</span>
      <button onclick="document.getElementById('rdp-alert-overlay')?.remove()" style="background:none;border:none;cursor:pointer;color:#94a3b8;font-size:1rem;padding:0;flex-shrink:0;line-height:1;"><i class="bi bi-x-lg"></i></button>
    </div>`;
  document.body.appendChild(el);
  const delay = tipo === 'error' ? 6000 : tipo === 'success' ? 3500 : 5000;
  setTimeout(() => document.getElementById('rdp-alert-overlay')?.remove(), delay);
}

function rdpConfirm(msg, confirmText = 'Confirmar', cancelText = 'Cancelar') {
  return new Promise((resolve) => {
    document.getElementById('rdp-confirm-overlay')?.remove();
    const el = document.createElement('div');
    el.id = 'rdp-confirm-overlay';
    el.style.cssText = 'position:fixed;inset:0;z-index:10001;background:rgba(15,23,42,.45);backdrop-filter:blur(3px);display:flex;align-items:flex-end;justify-content:center;padding:1rem;';
    el.innerHTML = `
      <div style="background:#fff;border-radius:20px;padding:1.4rem 1.25rem 1.1rem;width:100%;max-width:400px;box-shadow:0 8px 32px rgba(15,23,42,.18);animation:rdpAlertIn .22s ease;">
        <p style="margin:0 0 1.2rem;font-size:.9rem;color:#1e293b;line-height:1.5;">${msg}</p>
        <div style="display:flex;gap:.6rem;">
          <button id="rdp-confirm-cancel" style="flex:1;padding:.6rem;border-radius:10px;border:1.5px solid #e2e8f0;background:#fff;font-size:.84rem;cursor:pointer;font-weight:600;color:#64748b;">${cancelText}</button>
          <button id="rdp-confirm-ok" style="flex:1;padding:.6rem;border-radius:10px;border:none;background:#0F172A;color:#fff;font-size:.84rem;cursor:pointer;font-weight:700;">${confirmText}</button>
        </div>
      </div>`;
    document.body.appendChild(el);
    document.getElementById('rdp-confirm-ok').onclick     = () => { el.remove(); resolve(true);  };
    document.getElementById('rdp-confirm-cancel').onclick = () => { el.remove(); resolve(false); };
  });
}
