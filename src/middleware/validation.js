// src/middleware/validation.js

function validateRegister(req, res, next) {
  const { nombre, email, rol, password } = req.body;
  
  if (!nombre || typeof nombre !== 'string' || nombre.trim().length < 2) {
    return res.status(400).json({ success: false, message: 'Nombre debe tener al menos 2 caracteres' });
  }
  
  if (!email || !isValidEmail(email)) {
    return res.status(400).json({ success: false, message: 'Email inválido' });
  }
  
  if (!password || password.length < 4) {
    return res.status(400).json({ success: false, message: 'Contraseña debe tener al menos 4 caracteres' });
  }
  
  if (rol && !['visitante', 'anfitrion', 'admin'].includes(rol)) {
    return res.status(400).json({ success: false, message: 'Rol inválido' });
  }
  
  next();
}

function validateParking(req, res, next) {
  const { nombre, tipo, precio, direccion, lat, lng } = req.body;
  
  if (!nombre || typeof nombre !== 'string' || nombre.trim().length < 3) {
    return res.status(400).json({ success: false, message: 'Nombre del parqueo debe tener al menos 3 caracteres' });
  }
  
  if (!tipo || !['auto', 'moto', 'bicicleta', 'ambos'].includes(tipo)) {
    return res.status(400).json({ success: false, message: 'Tipo debe ser: auto, moto, bicicleta o ambos' });
  }
  
  if (precio == null || typeof parseFloat(precio) !== 'number' || parseFloat(precio) < 0) {
    return res.status(400).json({ success: false, message: 'Precio debe ser un número positivo' });
  }
  
  if (lat != null && (typeof parseFloat(lat) !== 'number' || parseFloat(lat) < -90 || parseFloat(lat) > 90)) {
    return res.status(400).json({ success: false, message: 'Latitud inválida (-90 a 90)' });
  }
  
  if (lng != null && (typeof parseFloat(lng) !== 'number' || parseFloat(lng) < -180 || parseFloat(lng) > 180)) {
    return res.status(400).json({ success: false, message: 'Longitud inválida (-180 a 180)' });
  }
  
  next();
}

function validateReservation(req, res, next) {
  const { parqueoId, usuarioId, fecha, fechaInicio, fechaFin } = req.body;
  
  if (!parqueoId || typeof parqueoId !== 'number') {
    return res.status(400).json({ success: false, message: 'parqueoId debe ser un número' });
  }
  
  if (!usuarioId || typeof usuarioId !== 'number') {
    return res.status(400).json({ success: false, message: 'usuarioId debe ser un número' });
  }
  
  const hasDate = fecha || (fechaInicio && fechaFin);
  if (!hasDate) {
    return res.status(400).json({ success: false, message: 'Debe proporcionar fecha o (fechaInicio y fechaFin)' });
  }
  
  if (fechaInicio && fechaFin && new Date(fechaInicio) >= new Date(fechaFin)) {
    return res.status(400).json({ success: false, message: 'fechaInicio debe ser anterior a fechaFin' });
  }
  
  next();
}

function validateMessage(req, res, next) {
  const { deId, paraId, texto } = req.body;
  
  if (!deId || typeof deId !== 'number') {
    return res.status(400).json({ success: false, message: 'deId debe ser un número' });
  }
  
  if (!paraId || typeof paraId !== 'number') {
    return res.status(400).json({ success: false, message: 'paraId debe ser un número' });
  }
  
  if (!texto || typeof texto !== 'string' || texto.trim().length === 0) {
    return res.status(400).json({ success: false, message: 'Texto del mensaje no puede estar vacío' });
  }
  
  if (texto.length > 1000) {
    return res.status(400).json({ success: false, message: 'Texto no puede exceder 1000 caracteres' });
  }
  
  next();
}

function isValidEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(String(email).toLowerCase());
}

module.exports = { validateRegister, validateParking, validateReservation, validateMessage };
