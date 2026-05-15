// server.js
// MVP Sistema de Parqueos Esquipulas - Mock API REST

require('dotenv').config();

const express = require('express');
const { Resend } = require('resend');
const { testConnection, hasDatabaseConfig } = require('./config/database');
const { generateToken, verifyToken, requireRole } = require('./src/middleware/auth');
const { validateRegister, validateParking, validateReservation, validateMessage } = require('./src/middleware/validation');
const userRepository = require('./src/repositories/userRepository');
const parkingRepository = require('./src/repositories/parkingRepository');
const reservationRepository = require('./src/repositories/reservationRepository');
const messageRepository = require('./src/repositories/messageRepository');
const app = express();
const PORT = process.env.PORT || 3000;

// Resend config (usa tu API key real en producción)
const RESEND_API_KEY = process.env.RESEND_API_KEY || 're_demo_key';
const resend = new Resend(RESEND_API_KEY);

app.use(express.json());
app.use(express.static('public'));

function sanitizeUser(user) {
  if (!user) return null;
  return {
    id: user.id,
    nombre: user.nombre,
    rol: user.rol,
    email: user.email
  };
}

function getNextMockId(collection) {
  return collection.length ? Math.max(...collection.map(item => item.id)) + 1 : 1;
}

async function findUserByEmail(email) {
  if (hasDatabaseConfig()) {
    return userRepository.findByEmail(email);
  }
  return usuarios.find(u => u.email === email) || null;
}

async function createUserRecord({ nombre, email, rol }) {
  if (hasDatabaseConfig()) {
    return userRepository.createUser({ nombre, email, rol });
  }
  const user = { id: getNextMockId(usuarios), nombre, email, rol };
  usuarios.push(user);
  return user;
}

async function listUserRecords() {
  if (hasDatabaseConfig()) {
    return userRepository.listUsers();
  }
  return usuarios;
}

async function removeUserRecord(id) {
  if (hasDatabaseConfig()) {
    return userRepository.deleteUser(id);
  }
  const idx = usuarios.findIndex(u => u.id === id);
  if (idx === -1) return false;
  usuarios.splice(idx, 1);
  return true;
}

// ---- Parking helpers (DB or mock) ----
async function listParkingRecords() {
  if (hasDatabaseConfig()) return parkingRepository.listParkings();
  return parqueos;
}
async function listParkingsAdminRecords() {
  if (hasDatabaseConfig()) return parkingRepository.listParkingsAdmin();
  return parqueos.map(p => {
    const anfitrion = usuarios.find(u => u.id === p.anfitrionId);
    return { ...p, anfitrionNombre: anfitrion ? anfitrion.nombre : 'Desconocido' };
  });
}
async function createParkingRecord({ anfitrionId, nombre, tipo, precio, direccion, lat, lng }) {
  if (hasDatabaseConfig()) return parkingRepository.createParking({ anfitrionId, nombre, tipo, precio, direccion, lat, lng });
  const nuevo = { id: getNextMockId(parqueos), anfitrionId, nombre, tipo, precio, direccion, lat, lng, disponible: true, fotos: [] };
  parqueos.push(nuevo);
  return nuevo;
}
async function updateParkingRecord(id, fields) {
  if (hasDatabaseConfig()) return parkingRepository.updateParking(id, fields);
  const p = parqueos.find(p => p.id == id);
  if (!p) return null;
  Object.assign(p, fields);
  return p;
}
async function deleteParkingRecord(id) {
  if (hasDatabaseConfig()) return parkingRepository.deleteParking(id);
  const idx = parqueos.findIndex(p => p.id === id);
  if (idx === -1) return false;
  parqueos.splice(idx, 1);
  return true;
}

// ---- Reservation helpers (DB or mock) ----
async function checkReservationConflict(parqueoId, fechaInicio, fechaFin) {
  if (hasDatabaseConfig()) return reservationRepository.checkConflict(parqueoId, fechaInicio, fechaFin);
  // Mock: no conflict detection (accept all)
  return false;
}
async function listReservationRecords(usuarioId) {
  if (hasDatabaseConfig()) return reservationRepository.listReservations(usuarioId);
  if (usuarioId) return reservas.filter(r => r.usuarioId === usuarioId);
  return reservas;
}
async function listReservationsAdminRecords() {
  if (hasDatabaseConfig()) return reservationRepository.listReservationsAdmin();
  return reservas.map(r => {
    const user = usuarios.find(u => u.id === r.usuarioId);
    const park = parqueos.find(p => p.id === r.parqueoId);
    return { ...r, usuarioNombre: user ? user.nombre : 'N/A', parqueoNombre: park ? park.nombre : 'N/A' };
  });
}
async function createReservationRecord({ parqueoId, usuarioId, fecha, fechaInicio, fechaFin }) {
  if (hasDatabaseConfig()) {
    const inicio = fechaInicio || fecha;
    const fin = fechaFin || fecha;
    return reservationRepository.createReservation({ parqueoId, usuarioId, fechaInicio: inicio, fechaFin: fin });
  }
  const reserva = { id: getNextMockId(reservas), parqueoId, usuarioId, fecha, fechaInicio, fechaFin, estado: 'pendiente' };
  reservas.push(reserva);
  return reserva;
}
async function updateReservationStatusRecord(id, estado) {
  if (hasDatabaseConfig()) return reservationRepository.updateReservationStatus(id, estado);
  const r = reservas.find(r => r.id == id);
  if (!r) return null;
  Object.assign(r, { estado });
  return r;
}
async function updateReservationRecord(id, fields) {
  if (hasDatabaseConfig()) {
    if (fields.estado) return reservationRepository.updateReservationStatus(id, fields.estado);
    return null;
  }
  const r = reservas.find(r => r.id == id);
  if (!r) return null;
  Object.assign(r, fields);
  return r;
}

// ---- Message helpers (DB or mock) ----
async function getMessagesByUserRecord(userId) {
  if (hasDatabaseConfig()) return messageRepository.getMessagesByUser(userId);
  return mensajes.filter(m => m.deId === userId || m.paraId === userId);
}
async function getConversationRecord(u1, u2) {
  if (hasDatabaseConfig()) return messageRepository.getConversation(u1, u2);
  return mensajes.filter(m =>
    (m.deId === u1 && m.paraId === u2) || (m.deId === u2 && m.paraId === u1)
  ).sort((a, b) => new Date(a.fecha) - new Date(b.fecha));
}
async function createMessageRecord({ deId, paraId, texto }) {
  if (hasDatabaseConfig()) return messageRepository.createMessage({ deId, paraId, texto });
  const msg = { id: getNextMockId(mensajes), deId, paraId, texto, fecha: new Date().toISOString(), leido: false };
  mensajes.push(msg);
  return msg;
}
async function markReadRecord(userId, otroId) {
  if (hasDatabaseConfig()) return messageRepository.markRead(userId, otroId);
  mensajes.forEach(m => { if (m.paraId === userId && m.deId === otroId) m.leido = true; });
}
async function listMessagesAdminRecords() {
  if (hasDatabaseConfig()) return messageRepository.listMessagesAdmin();
  return mensajes.map(m => {
    const de = usuarios.find(u => u.id === m.deId);
    const para = usuarios.find(u => u.id === m.paraId);
    return { ...m, deNombre: de ? de.nombre : 'N/A', paraNombre: para ? para.nombre : 'N/A' };
  });
}

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
app.post('/api/login', async (req, res) => {
  const email = req.body.email?.trim().toLowerCase();
  if (!email) {
    return res.status(400).json({ success: false, message: 'Email requerido' });
  }

  const user = await findUserByEmail(email);
  if (user) {
    const token = generateToken(user);
    return res.json({ success: true, user: sanitizeUser(user), token });
  }
  res.status(401).json({ success: false, message: 'Usuario no encontrado' });
});

app.post('/api/register', validateRegister, async (req, res) => {
  const nombre = req.body.nombre?.trim();
  const email = req.body.email?.trim().toLowerCase();
  let rol = req.body.rol?.trim() || 'visitante';

  if (!nombre || !email) {
    return res.status(400).json({ success: false, message: 'Nombre y email son requeridos' });
  }

  // Prevent registration as admin
  if (rol === 'admin') {
    rol = 'visitante';
  }

  const existingUser = await findUserByEmail(email);
  if (existingUser) {
    return res.status(409).json({ success: false, message: 'El correo ya está registrado' });
  }

  const user = await createUserRecord({ nombre, email, rol });
  const token = generateToken(user);
  res.json({ success: true, user: sanitizeUser(user), token });
});

// Endpoints Parqueos
app.get('/api/parkings', async (req, res) => {
  const list = await listParkingRecords();
  res.json(list);
});

// Búsqueda por proximidad geográfica
app.get('/api/parkings/near', async (req, res) => {
  const userLat = parseFloat(req.query.lat);
  const userLng = parseFloat(req.query.lng);
  const radiusKm = parseFloat(req.query.radius) || 5; // radio por defecto 5km

  if (isNaN(userLat) || isNaN(userLng)) {
    return res.status(400).json({ success: false, message: 'lat y lng son requeridos y deben ser números' });
  }

  const list = await listParkingRecords();
  const nearby = list
    .filter(p => p.lat && p.lng)
    .map(p => ({
      ...p,
      distance: calculateDistance(userLat, userLng, p.lat, p.lng)
    }))
    .filter(p => p.distance <= radiusKm)
    .sort((a, b) => a.distance - b.distance);

  res.json(nearby);
});

// Helper: calcular distancia en km (Haversine)
function calculateDistance(lat1, lng1, lat2, lng2) {
  const R = 6371; // Radio tierra en km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

app.post('/api/parkings', verifyToken, validateParking, async (req, res) => {
  if (req.user.rol !== 'anfitrion' && req.user.rol !== 'admin') {
    return res.status(403).json({ success: false, message: 'Solo anfitriones pueden publicar parqueos' });
  }
  const { anfitrionId, nombre, tipo, precio, direccion, lat, lng } = req.body;
  if (!anfitrionId || !nombre || !tipo || precio == null) {
    return res.status(400).json({ success: false, message: 'Campos requeridos: anfitrionId, nombre, tipo, precio' });
  }
  const parqueo = await createParkingRecord({ anfitrionId, nombre, tipo, precio, direccion, lat, lng });
  res.json({ success: true, parqueo });
});

app.put('/api/parkings/:id', verifyToken, async (req, res) => {
  if (req.user.rol !== 'anfitrion' && req.user.rol !== 'admin') {
    return res.status(403).json({ success: false, message: 'Sin autorización para editar parqueos' });
  }
  const id = Number(req.params.id);
  const parqueo = await updateParkingRecord(id, req.body);
  if (!parqueo) return res.status(404).json({ success: false });
  res.json({ success: true, parqueo });
});

// Endpoints Reservas
app.get('/api/reservations', async (req, res) => {
  const usuarioId = req.query.usuarioId ? Number(req.query.usuarioId) : null;
  const list = await listReservationRecords(usuarioId);
  res.json(list);
});

app.post('/api/reservations', verifyToken, validateReservation, async (req, res) => {
  const { parqueoId, usuarioId, fecha, fechaInicio, fechaFin } = req.body;
  if (!parqueoId || !usuarioId) {
    return res.status(400).json({ success: false, message: 'Campos requeridos: parqueoId, usuarioId' });
  }
  const inicio = fechaInicio || fecha;
  const fin = fechaFin || fecha;
  const conflict = await checkReservationConflict(parqueoId, inicio, fin);
  if (conflict) {
    return res.status(409).json({ success: false, message: 'El parqueo ya tiene una reserva en ese horario' });
  }
  const reserva = await createReservationRecord({ parqueoId, usuarioId, fecha, fechaInicio: inicio, fechaFin: fin });
  res.json({ success: true, reserva });
});

app.put('/api/reservations/:id', verifyToken, async (req, res) => {
  const id = Number(req.params.id);
  const reserva = await updateReservationRecord(id, req.body);
  if (!reserva) return res.status(404).json({ success: false });
  res.json({ success: true, reserva });
});

// Stats públicos para la home
app.get('/api/stats', (req, res) => {
  res.json({
    success: true,
    stats: {
      totalParqueos: parqueos.length,
      totalReservas: reservas.length,
      disponibles: parqueos.filter(p => p.disponible).length
    }
  });
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
app.get('/api/messages', async (req, res) => {
  const userId = Number(req.query.userId);
  if (!userId) return res.status(400).json({ success: false, message: 'userId requerido' });
  const msgs = await getMessagesByUserRecord(userId);
  res.json(msgs);
});

// Obtener conversación entre dos usuarios
app.get('/api/messages/conversation', async (req, res) => {
  const u1 = Number(req.query.u1);
  const u2 = Number(req.query.u2);
  if (!u1 || !u2) return res.status(400).json({ success: false, message: 'u1 y u2 requeridos' });
  const conv = await getConversationRecord(u1, u2);
  res.json(conv);
});

// Enviar mensaje (y notificar por email)
app.post('/api/messages', verifyToken, validateMessage, async (req, res) => {
  const { deId, paraId, texto } = req.body;
  if (!deId || !paraId || !texto) return res.status(400).json({ success: false, message: 'Campos requeridos: deId, paraId, texto' });
  const msg = await createMessageRecord({ deId, paraId, texto });

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
      if (hasDatabaseConfig()) await messageRepository.updateEmailStatus(msg.id, true, null);
    } catch (e) {
      msg.emailEnviado = false;
      msg.emailError = e.message || 'Error al enviar email';
      if (hasDatabaseConfig()) await messageRepository.updateEmailStatus(msg.id, false, msg.emailError);
    }
  }

  res.json({ success: true, mensaje: msg });
});

// Marcar mensajes como leídos
app.put('/api/messages/read', verifyToken, async (req, res) => {
  const { userId, otroId } = req.body;
  await markReadRecord(userId, otroId);
  res.json({ success: true });
});

// ========== PANEL ADMIN ==========

// Obtener todos los usuarios
app.get('/api/admin/users', verifyToken, requireRole('admin'), async (req, res) => {
  const users = await listUserRecords();
  res.json(users.map(sanitizeUser));
});

// Eliminar usuario
app.delete('/api/admin/users/:id', verifyToken, requireRole('admin'), async (req, res) => {
  const id = Number(req.params.id);
  const deleted = await removeUserRecord(id);
  if (!deleted) return res.status(404).json({ success: false });
  res.json({ success: true });
});

// Obtener todos los parqueos (admin)
app.get('/api/admin/parkings', verifyToken, requireRole('admin'), async (req, res) => {
  const result = await listParkingsAdminRecords();
  res.json(result);
});

// Eliminar parqueo
app.delete('/api/admin/parkings/:id', verifyToken, requireRole('admin'), async (req, res) => {
  const id = Number(req.params.id);
  const deleted = await deleteParkingRecord(id);
  if (!deleted) return res.status(404).json({ success: false });
  res.json({ success: true });
});

// Obtener todas las reservas (admin, con info enriquecida)
app.get('/api/admin/reservations', verifyToken, requireRole('admin'), async (req, res) => {
  const result = await listReservationsAdminRecords();
  res.json(result);
});

// Cambiar estado de reserva (admin)
app.put('/api/admin/reservations/:id', verifyToken, requireRole('admin'), async (req, res) => {
  const id = Number(req.params.id);
  const reserva = await updateReservationStatusRecord(id, req.body.estado);
  if (!reserva) return res.status(404).json({ success: false });
  res.json({ success: true, reserva });
});

// Obtener todos los mensajes (admin)
app.get('/api/admin/messages', verifyToken, requireRole('admin'), async (req, res) => {
  const result = await listMessagesAdminRecords();
  res.json(result);
});

// Admin: métricas globales
app.get('/api/admin/metrics', verifyToken, requireRole('admin'), (req, res) => {
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

async function startServer() {
  if (hasDatabaseConfig()) {
    try {
      await testConnection();
      console.log('MySQL conectado correctamente.');
    } catch (error) {
      console.error('No se pudo conectar a MySQL:', error.message);
      console.error('El servidor continuará con datos mock mientras migramos los endpoints.');
    }
  } else {
    console.log('MySQL no configurado. El servidor usará datos mock por ahora.');
  }

  app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
  });
}

if (require.main === module) {
  startServer();
}

module.exports = app;
