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
