// server.js
// MVP Sistema de Parqueos Esquipulas - Mock API REST

const express = require('express');
const { Resend } = require('resend');
const app = express();
const PORT = process.env.PORT || 3000;

// Resend config (usa tu API key real en producción)
const RESEND_API_KEY = process.env.RESEND_API_KEY || 're_demo_key';
const resend = new Resend(RESEND_API_KEY);

app.use(express.json());
app.use(express.static('public'));

// Mock Data
let usuarios = [
  { id: 1, nombre: 'Juan', rol: 'visitante', email: 'juan@mail.com' },
  { id: 2, nombre: 'Ana', rol: 'anfitrion', email: 'ana@mail.com' },
  { id: 3, nombre: 'Admin', rol: 'admin', email: 'admin@parqueos.com' }
];
let parqueos = [
  { id: 1, anfitrionId: 2, nombre: 'Parqueo Centro', tipo: 'auto', precio: 30, disponible: true, lat: 14.566, lng: -89.355, direccion: 'Calle Real 1', fotos: ['parqueo1.jpg'] },
  { id: 2, anfitrionId: 2, nombre: 'Parqueo Norte', tipo: 'moto', precio: 15, disponible: true, lat: 14.567, lng: -89.356, direccion: 'Calle Norte 2', fotos: ['parqueo2.jpg'] }
];
let reservas = [
  { id: 1, parqueoId: 1, usuarioId: 1, estado: 'pendiente', fecha: '2026-03-25' }
];
let mensajes = [
  { id: 1, deId: 1, paraId: 2, texto: 'Hola, ¿tiene espacio disponible para mañana?', fecha: '2026-03-25T10:00:00', leido: false },
  { id: 2, deId: 2, paraId: 1, texto: 'Sí, aún hay espacio. ¡Bienvenido!', fecha: '2026-03-25T10:05:00', leido: false }
];

// Endpoints Usuarios
app.post('/api/login', (req, res) => {
  const { email } = req.body;
  const user = usuarios.find(u => u.email === email);
  if (user) return res.json({ success: true, user });
  res.status(401).json({ success: false, message: 'Usuario no encontrado' });
});

app.post('/api/register', (req, res) => {
  const { nombre, email, rol } = req.body;
  const id = usuarios.length + 1;
  const user = { id, nombre, email, rol };
  usuarios.push(user);
  res.json({ success: true, user });
});

// Endpoints Parqueos
app.get('/api/parkings', (req, res) => {
  res.json(parqueos);
});

app.post('/api/parkings', (req, res) => {
  const { anfitrionId, nombre, tipo, precio, direccion, lat, lng } = req.body;
  const id = parqueos.length + 1;
  const nuevo = { id, anfitrionId, nombre, tipo, precio, direccion, lat, lng, disponible: true, fotos: [] };
  parqueos.push(nuevo);
  res.json({ success: true, parqueo: nuevo });
});

app.put('/api/parkings/:id', (req, res) => {
  const { id } = req.params;
  const parqueo = parqueos.find(p => p.id == id);
  if (!parqueo) return res.status(404).json({ success: false });
  Object.assign(parqueo, req.body);
  res.json({ success: true, parqueo });
});

// Endpoints Reservas
app.get('/api/reservations', (req, res) => {
  res.json(reservas);
});

app.post('/api/reservations', (req, res) => {
  const { parqueoId, usuarioId, fecha } = req.body;
  const id = reservas.length + 1;
  const reserva = { id, parqueoId, usuarioId, fecha, estado: 'pendiente' };
  reservas.push(reserva);
  res.json({ success: true, reserva });
});

app.put('/api/reservations/:id', (req, res) => {
  const { id } = req.params;
  const reserva = reservas.find(r => r.id == id);
  if (!reserva) return res.status(404).json({ success: false });
  Object.assign(reserva, req.body);
  res.json({ success: true, reserva });
});

// Métricas mock
app.get('/api/metrics', (req, res) => {
  res.json({
    parqueos: parqueos.length,
    reservas: reservas.length,
    ocupacion: Math.round((reservas.length / (parqueos.length * 2)) * 100),
    tiempoBusqueda: 2 // minutos mock
  });
});

// ========== MENSAJERÍA ==========

// Obtener mensajes de un usuario (por query ?userId=X)
app.get('/api/messages', (req, res) => {
  const userId = Number(req.query.userId);
  if (!userId) return res.status(400).json({ success: false, message: 'userId requerido' });
  const msgs = mensajes.filter(m => m.deId === userId || m.paraId === userId);
  res.json(msgs);
});

// Obtener conversación entre dos usuarios
app.get('/api/messages/conversation', (req, res) => {
  const u1 = Number(req.query.u1);
  const u2 = Number(req.query.u2);
  if (!u1 || !u2) return res.status(400).json({ success: false, message: 'u1 y u2 requeridos' });
  const conv = mensajes.filter(m =>
    (m.deId === u1 && m.paraId === u2) || (m.deId === u2 && m.paraId === u1)
  ).sort((a, b) => new Date(a.fecha) - new Date(b.fecha));
  res.json(conv);
});

// Enviar mensaje (y notificar por email)
app.post('/api/messages', async (req, res) => {
  const { deId, paraId, texto } = req.body;
  if (!deId || !paraId || !texto) return res.status(400).json({ success: false, message: 'Campos requeridos: deId, paraId, texto' });
  const id = mensajes.length + 1;
  const msg = { id, deId, paraId, texto, fecha: new Date().toISOString(), leido: false };
  mensajes.push(msg);

  // Notificar por email al destinatario
  const dest = usuarios.find(u => u.id === paraId);
  const remitente = usuarios.find(u => u.id === deId);
  if (dest && remitente) {
    try {
      await resend.emails.send({
        from: 'Parqueos Esquipulas <onboarding@resend.dev>',
        to: dest.email,
        subject: `Nuevo mensaje de ${remitente.nombre}`,
        html: `<p><b>${remitente.nombre}</b> te envió un mensaje:</p><p>${texto}</p><p><a href="http://localhost:${PORT}/messages.html?userId=${dest.id}&chat=${remitente.id}">Ver conversación</a></p>`
      });
      msg.emailEnviado = true;
    } catch (e) {
      msg.emailEnviado = false;
      msg.emailError = e.message || 'Error al enviar email';
    }
  }

  res.json({ success: true, mensaje: msg });
});

// Marcar mensajes como leídos
app.put('/api/messages/read', (req, res) => {
  const { userId, otroId } = req.body;
  mensajes.forEach(m => {
    if (m.paraId === userId && m.deId === otroId) m.leido = true;
  });
  res.json({ success: true });
});

// ========== PANEL ADMIN ==========

// Obtener todos los usuarios
app.get('/api/admin/users', (req, res) => {
  res.json(usuarios);
});

// Eliminar usuario
app.delete('/api/admin/users/:id', (req, res) => {
  const id = Number(req.params.id);
  const idx = usuarios.findIndex(u => u.id === id);
  if (idx === -1) return res.status(404).json({ success: false });
  usuarios.splice(idx, 1);
  res.json({ success: true });
});

// Obtener todos los parqueos (admin)
app.get('/api/admin/parkings', (req, res) => {
  const result = parqueos.map(p => {
    const anfitrion = usuarios.find(u => u.id === p.anfitrionId);
    return { ...p, anfitrionNombre: anfitrion ? anfitrion.nombre : 'Desconocido' };
  });
  res.json(result);
});

// Eliminar parqueo
app.delete('/api/admin/parkings/:id', (req, res) => {
  const id = Number(req.params.id);
  const idx = parqueos.findIndex(p => p.id === id);
  if (idx === -1) return res.status(404).json({ success: false });
  parqueos.splice(idx, 1);
  res.json({ success: true });
});

// Obtener todas las reservas (admin, con info enriquecida)
app.get('/api/admin/reservations', (req, res) => {
  const result = reservas.map(r => {
    const user = usuarios.find(u => u.id === r.usuarioId);
    const park = parqueos.find(p => p.id === r.parqueoId);
    return { ...r, usuarioNombre: user ? user.nombre : 'N/A', parqueoNombre: park ? park.nombre : 'N/A' };
  });
  res.json(result);
});

// Cambiar estado de reserva (admin)
app.put('/api/admin/reservations/:id', (req, res) => {
  const id = Number(req.params.id);
  const reserva = reservas.find(r => r.id === id);
  if (!reserva) return res.status(404).json({ success: false });
  Object.assign(reserva, req.body);
  res.json({ success: true, reserva });
});

// Obtener todos los mensajes (admin)
app.get('/api/admin/messages', (req, res) => {
  const result = mensajes.map(m => {
    const de = usuarios.find(u => u.id === m.deId);
    const para = usuarios.find(u => u.id === m.paraId);
    return { ...m, deNombre: de ? de.nombre : 'N/A', paraNombre: para ? para.nombre : 'N/A' };
  });
  res.json(result);
});

// Admin: métricas globales
app.get('/api/admin/metrics', (req, res) => {
  res.json({
    totalUsuarios: usuarios.length,
    totalParqueos: parqueos.length,
    totalReservas: reservas.length,
    totalMensajes: mensajes.length,
    reservasPendientes: reservas.filter(r => r.estado === 'pendiente').length,
    reservasConfirmadas: reservas.filter(r => r.estado === 'confirmada').length,
    reservasFinalizadas: reservas.filter(r => r.estado === 'finalizada').length,
    ocupacion: parqueos.length > 0 ? Math.round((reservas.filter(r => r.estado === 'confirmada').length / parqueos.length) * 100) : 0
  });
});

// ========== NOTIFICACIONES EMAIL ==========

// Enviar notificación de reserva por email
app.post('/api/notify/reservation', async (req, res) => {
  const { reservaId } = req.body;
  const reserva = reservas.find(r => r.id === reservaId);
  if (!reserva) return res.status(404).json({ success: false, message: 'Reserva no encontrada' });
  const user = usuarios.find(u => u.id === reserva.usuarioId);
  const park = parqueos.find(p => p.id === reserva.parqueoId);
  const anf = park ? usuarios.find(u => u.id === park.anfitrionId) : null;

  const results = [];
  // Notificar al visitante
  if (user) {
    try {
      await resend.emails.send({
        from: 'Parqueos Esquipulas <onboarding@resend.dev>',
        to: user.email,
        subject: `Tu reserva en ${park ? park.nombre : 'parqueo'} está ${reserva.estado}`,
        html: `<h2>Parqueos Esquipulas</h2><p>Hola ${user.nombre}, tu reserva para <b>${park ? park.nombre : ''}</b> el día <b>${reserva.fecha}</b> está: <b>${reserva.estado}</b>.</p>`
      });
      results.push({ to: user.email, sent: true });
    } catch (e) {
      results.push({ to: user.email, sent: false, error: e.message });
    }
  }
  // Notificar al anfitrión
  if (anf) {
    try {
      await resend.emails.send({
        from: 'Parqueos Esquipulas <onboarding@resend.dev>',
        to: anf.email,
        subject: `Nueva reserva en tu parqueo: ${park.nombre}`,
        html: `<h2>Parqueos Esquipulas</h2><p>Hola ${anf.nombre}, tienes una nueva reserva en <b>${park.nombre}</b> para el día <b>${reserva.fecha}</b>. Estado: <b>${reserva.estado}</b>.</p>`
      });
      results.push({ to: anf.email, sent: true });
    } catch (e) {
      results.push({ to: anf.email, sent: false, error: e.message });
    }
  }
  res.json({ success: true, results });
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
