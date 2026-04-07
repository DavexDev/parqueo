// app.js — Sesión, navbar y helpers globales

function getUser() {
  const raw = localStorage.getItem('parqueo_user');
  return raw ? JSON.parse(raw) : null;
}

function setUser(user) {
  localStorage.setItem('parqueo_user', JSON.stringify(user));
}

function logout() {
  localStorage.removeItem('parqueo_user');
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
  if (user) {
    const rolClass = user.rol === 'admin' ? 'badge-admin' : user.rol === 'anfitrion' ? 'badge-anfitrion' : 'badge-visitante';
    nav.innerHTML = `
      <a class="navbar-brand text-white fw-bold" href="index.html">🅿️ Parqueos</a>
      <div class="d-flex align-items-center gap-2">
        <span class="text-white small">${user.nombre}</span>
        <span class="badge badge-rol ${rolClass}">${user.rol}</span>
        <button class="btn btn-sm btn-outline-light" style="border-radius:20px;font-size:0.75rem;padding:0.2rem 0.65rem;" onclick="logout()">Salir</button>
      </div>
    `;
  } else {
    nav.innerHTML = `
      <a class="navbar-brand text-white fw-bold" href="index.html">🅿️ Parqueos</a>
      <a href="login.html" class="btn btn-sm btn-outline-light" style="border-radius:20px;font-size:0.8rem;">Entrar</a>
    `;
  }
}

function renderBottomBar(activePage) {
  const user = getUser();
  if (!user) return;
  const pages = [];
  if (user.rol === 'visitante') {
    pages.push({ href: 'index.html', icon: '🏠', label: 'Inicio', key: 'home' });
    pages.push({ href: 'parkings.html', icon: '🔍', label: 'Buscar', key: 'parkings' });
    pages.push({ href: 'messages.html', icon: '💬', label: 'Mensajes', key: 'messages' });
  } else if (user.rol === 'anfitrion') {
    pages.push({ href: 'index.html', icon: '🏠', label: 'Inicio', key: 'home' });
    pages.push({ href: 'publish.html', icon: '➕', label: 'Publicar', key: 'publish' });
    pages.push({ href: 'messages.html', icon: '💬', label: 'Mensajes', key: 'messages' });
    pages.push({ href: 'parkings.html', icon: '🔍', label: 'Parqueos', key: 'parkings' });
  } else if (user.rol === 'admin') {
    pages.push({ href: 'index.html', icon: '🏠', label: 'Inicio', key: 'home' });
    pages.push({ href: 'admin.html', icon: '⚙️', label: 'Admin', key: 'admin' });
    pages.push({ href: 'parkings.html', icon: '🔍', label: 'Parqueos', key: 'parkings' });
    pages.push({ href: 'metrics.html', icon: '📊', label: 'Métricas', key: 'metrics' });
  }
  const bar = document.createElement('div');
  bar.className = 'bottom-bar';
  bar.innerHTML = pages.map(p =>
    `<a href="${p.href}" class="${activePage === p.key ? 'active' : ''}">
      <span class="tab-icon">${p.icon}</span>${p.label}
    </a>`
  ).join('');
  document.body.appendChild(bar);
}
