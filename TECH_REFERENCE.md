# 🏗️ REFERENCIA TÉCNICA - Parqueos Esquipulas

Guía completa de arquitectura, endpoints, y funcionalidades.

---

## 📂 ESTRUCTURA DE ARCHIVOS

```
Parqueo/
├── package.json              # Dependencias (express, jwt, etc)
├── server.js                 # Backend Express (600+ líneas)
│
├── README.md                 # Guía rápida
├── ENTREGA_FINAL.md         # Este documento (Entrega)
├── START.bat                # Script arranque (Windows)
├── ENTREGA.sh               # Script arranque (Unix)
│
├── public/                   # Frontend (todas las páginas)
│   ├── index.html           # Página inicio + rol selector
│   ├── login.html           # Autenticación
│   ├── parkings.html        # Búsqueda + mapa
│   ├── reserve.html         # Crear reserva
│   ├── reservations.html    # Mis reservas (visitante)
│   ├── publish.html         # Publicar parqueo
│   ├── host-dashboard.html  # Dashboard anfitrión
│   ├── messages.html        # Chat
│   ├── reviews.html         # Reseñas
│   ├── admin.html           # Panel admin
│   ├── tutorial.html        # Tutorial (5 modales)
│   ├── app.js               # Funciones globales (JWT, localStorage)
│   ├── styles.css           # Diseño + dark mode
│   ├── manifest.json        # PWA manifest
│   └── offline.html         # Página offline
│
├── src/
│   ├── middleware/
│   │   ├── auth.js          # JWT (generateToken, verifyToken, requireRole)
│   │   └── validation.js    # Input validation (5 funciones)
│   └── repositories/        # Data access layer (ready for MySQL)
│       ├── userRepository.js
│       ├── parkingRepository.js
│       ├── reservationRepository.js
│       └── messageRepository.js
│
├── config/
│   └── database.js          # MySQL pool (optional)
│
└── db/
    └── schema.sql           # Database schema (5 tables)
```

---

## 🔌 API ENDPOINTS (15+)

### AUTENTICACIÓN (Públicos)

```
POST /api/login
  Entrada: { email, password }
  Salida: { user: {id, nombre, email, rol}, token, success }
  Error: 400 si credenciales inválidas, 401 si sin token

POST /api/register
  Entrada: { nombre, email, password, rol }
  Validación: nombre ≥2, email regex, password ≥4
  Nota: rol 'admin' convertido a 'visitante'
  Salida: { user, token, success }
  Error: 400 si validación falla
```

### PARQUEOS (Todos pueden GET, Anfitrión POST/PUT)

```
GET /api/parkings
  Respuesta: Array de parqueos
  Filtros (query): ?tipo=auto&maxPrecio=50&pagina=1

GET /api/parkings/near
  Query: ?lat=14.5&lng=-90.5&radio=5
  Respuesta: Parqueos dentro del radio (Haversine)
  
POST /api/parkings (requireRole: anfitrion)
  Entrada: { nombre, tipo, precio, dirección, lat, lng }
  Validación: tipo enum, precio > 0, lat [-90,90], lng [-180,180]
  Respuesta: { id, ...parqueo }

PUT /api/parkings/:id (requireRole: anfitrion)
  Entrada: { nombre, tipo, precio, disponible }
  
DELETE /api/parkings/:id (requireRole: admin)
  Soft delete (actualiza deleted_at)
```

### RESERVAS (Visitante POST, Anfitrión/Admin GET/PUT)

```
GET /api/reservations?usuarioId=X (requireRole: visitante)
  Respuesta: Mis reservas
  Filtros: ?estado=pendiente

POST /api/reservations (requireRole: visitante)
  Entrada: { parqueoId, fechaInicio, fechaFin }
  Validación: fechaInicio < fechaFin
  Validación: No sobrelapamiento (double-booking check)
  Respuesta: { id, estado: 'pendiente', ...reserva }

PUT /api/reservations/:id (requireRole: anfitrion|admin)
  Entrada: { estado } (pendiente|confirmada|finalizada|cancelada)
  Respuesta: { ...reserva actualizada }
```

### MENSAJES (Todos pueden POST/PUT)

```
GET /api/messages/conversation?conUserId=X
  Respuesta: Array de mensajes entre yo y conUserId
  
POST /api/messages (requireRole: visitante|anfitrion)
  Entrada: { deId, paraId, texto }
  Validación: texto 1-1000 caracteres
  Respuesta: { id, leído: false, ...mensaje }

PUT /api/messages/read
  Entrada: { usuarioId }
  Acción: Marca como leído todos los mensajes que recibí de este usuario
  Respuesta: { rowsAffected }
```

### ADMIN (Solo admin)

```
GET /api/admin/users
  Respuesta: [{ id, nombre, email, rol, created_at }, ...]

GET /api/admin/parkings
  Respuesta: [{ id, nombre, tipo, precio, disponible, anfitrion_id }, ...]

GET /api/admin/reservations
  Respuesta: [{ id, parqueoId, usuarioId, estado, ...}, ...]

GET /api/admin/messages
  Respuesta: [{ id, de_id, para_id, texto, leído }, ...]

GET /api/admin/metrics
  Respuesta: { totalUsuarios, totalParqueos, totalReservas, totalMensajes }

DELETE /api/admin/users/:id
  Acción: Elimina usuario
  
DELETE /api/admin/parkings/:id
  Acción: Soft delete de parqueo
```

---

## 🔐 AUTENTICACIÓN JWT

### Flujo

1. **Register/Login** 
   - Usuario entra email + password
   - Server valida credenciales
   - Server genera JWT: `jwt.sign({ id, email, rol }, SECRET, { expiresIn: '7d' })`
   - Client guarda: `localStorage['token']`

2. **Peticiones Autenticadas**
   - Frontend envía: `headers: { Authorization: 'Bearer {token}' }`
   - Middleware extrae token: `const token = req.headers.authorization.split(' ')[1]`
   - Server verifica: `jwt.verify(token, SECRET)`
   - Continúa si válido, retorna 401 si no

3. **Roles**
   - Token contiene: `{ id, email, rol }`
   - Middleware `requireRole('admin')` verifica `req.user.rol`
   - Retorna 403 si rol no coincide

### localStorage Keys

| Key | Value | Propósito |
|-----|-------|-----------|
| `token` | JWT string | Bearer token |
| `parqueo_user` | JSON { id, nombre, email, rol } | User data |
| `theme` | 'light' o 'dark' | Dark mode preference |

### Funciones Helper (app.js)

```javascript
getUser()              // Lee localStorage['parqueo_user']
setUser(user, token)   // Guarda en localStorage + token
getToken()             // Lee localStorage['token']
getHeaders()           // Retorna {Authorization: 'Bearer token', 'Content-Type': 'application/json'}
logout()               // Borra localStorage y redirige a login.html
```

---

## 🎨 FRONTEND - FUNCIONALIDADES POR PÁGINA

### index.html (Inicio)
- Detecta rol del usuario
- Botones dinámicos según rol
- Link a tutorial

### login.html (Autenticación)
- Formularios: login + registro
- Validación cliente
- Guarda user + token en localStorage
- Redirige a index.html

### parkings.html (Búsqueda + Mapa)
- GET /api/parkings (con filtros)
- Slider de precio, selector de tipo
- Mapa Leaflet.js con OpenStreetMap
- Geolocalización automática
- Click en parqueo → redirige a reserve.html

### reserve.html (Crear Reserva)
- Dropdown de parqueos
- Date picker para inicio y fin
- POST /api/reservations con getHeaders()
- Validación de fechas

### reservations.html (Mis Reservas)
- GET /api/reservations?usuarioId=X
- 5 filtros: todas, pendiente, confirmada, finalizada, cancelada
- Tarjetas mostrando: parqueo, usuario, fechas, precio, estado
- Botón contactar → messages.html?contact={id}

### publish.html (Publicar Parqueo)
- Formulario: nombre, tipo, precio, dirección, lat, lng
- POST /api/parkings con getHeaders()
- Validación de inputs
- Success/error toast

### host-dashboard.html (Dashboard Anfitrión)
- 3 Tabs:
  1. **Mis Parqueos** - Listar, ver ratings (mock), editar
  2. **Reservas Recibidas** - Confirmar/rechazar
  3. **Calendario** - Placeholder
- Tarjeta de ingresos (cálculo de reservas confirmadas)
- Stats: total parqueos, reservas pendientes

### messages.html (Chat)
- GET /api/messages/conversation
- Lista de contactos
- Historial de mensajes
- Input para enviar
- PUT /api/messages/read para marcar leído

### reviews.html (Reseñas)
- Selector 5 estrellas interactivo
- Textarea para review (max 500 chars)
- Checkbox "Recomendado"
- Almacena en localStorage['reviews']
- Muestra 5 reviews mock

### admin.html (Panel Admin)
- 4 Tabs:
  1. **Usuarios** - Listar, eliminar
  2. **Parqueos** - Listar, eliminar
  3. **Reservas** - Dropdown estado
  4. **Mensajes** - Mostrar conversaciones
- Dashboard con 4 métricas
- Validación de admin (check rol)

### tutorial.html (Guía)
- 5 Modales (Visitante, Anfitrión, Mensajes, Mapa, Admin)
- Paso a paso con Next/Prev buttons
- Estilos por rol (colores específicos)

---

## 💾 MOCK DATA (En Memoria)

```javascript
// server.js líneas 183-200

users = [
  { id: 1, nombre: 'Juan', email: 'juan@mail.com', 
    password_hash: 'hashed_1234', rol: 'visitante' },
  { id: 2, nombre: 'Ana', email: 'ana@mail.com', 
    password_hash: 'hashed_1234', rol: 'anfitrion' },
  { id: 3, nombre: 'Admin', email: 'admin@parqueos.com', 
    password_hash: 'hashed_1234', rol: 'admin' }
];

parkings = [
  { id: 1, anfitrion_id: 2, nombre: 'Parqueo Céntrico',
    tipo: 'auto', precio: 25, lat: 14.55, lng: -90.50 },
  { id: 2, anfitrion_id: 2, nombre: 'Parqueo Seguro',
    tipo: 'ambos', precio: 15, lat: 14.56, lng: -90.51 }
];

reservations = [
  { id: 1, parqueo_id: 1, usuario_id: 1, 
    estado: 'pendiente' }
];

messages = [
  { id: 1, de_id: 1, para_id: 2, texto: 'Hola Ana...' },
  { id: 2, de_id: 2, para_id: 1, texto: 'Hola Juan...' }
];
```

### localStorage Mock Data (reviews)

```javascript
// reviews.html genera 5 reviews mock automáticamente
{
  id: 1, parkingId: 1, rating: 5, 
  text: 'Excelente parqueo', author: 'Juan', 
  date: '2024-05-15'
}
```

---

## ✅ VALIDACIONES

### Servidor (src/middleware/validation.js)

```javascript
validateRegister:
  - nombre: min length 2
  - email: regex /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  - password: min length 4

validateParking:
  - tipo: enum ['auto', 'moto', 'bicicleta', 'ambos']
  - precio: > 0
  - lat: número entre -90 y 90
  - lng: número entre -180 y 180

validateReservation:
  - fechaInicio < fechaFin

validateMessage:
  - texto: 1-1000 caracteres
```

### Cliente (HTML)
- HTML5 input validation
- JavaScript checks antes de POST
- Toast error messages

---

## 🎨 DISEÑO - VARIABLES CSS

### Light Mode (Default)
```css
--primary: #1565c0          /* Azul */
--accent: #00c853           /* Verde */
--bg: #f0f2f5               /* Gris claro */
--card-bg: #ffffff          /* Blanco */
--text: #212529             /* Negro */
--text-muted: #6c757d       /* Gris oscuro */
```

### Dark Mode (body.dark-mode)
```css
--bg: #1a1a1a               /* Negro */
--card-bg: #2d2d2d          /* Gris oscuro */
--text: #e0e0e0             /* Blanco sucio */
--text-muted: #9e9e9e       /* Gris claro */
```

### Colores de Roles
```css
--visitante: #1565c0         /* Azul */
--anfitrion: #f57c00         /* Naranja */
--admin: #d32f2f             /* Rojo */
```

---

## 🔄 FUNCIONES PRINCIPALES

### Backend (server.js)

```javascript
// Autenticación
generateToken(user)                    // JWT 7-day token
verifyToken(req, res, next)           // Middleware
requireRole(rol)                      // Middleware role check
findUserByEmail(email)                // Search user
createUserRecord(nombre, email, rol)  // Insert user

// Parqueos
listParkingRecords()                  // GET all
findParkingById(id)                   // GET one
createParkingRecord(data)             // POST
updateParkingRecord(id, data)         // PUT
checkReservationConflict(id, ini, fin) // Double-booking check
calculateDistance(lat1, lng1, lat2, lng2) // Haversine

// Reservas
listReservationRecords()              // GET all
updateReservationStatus(id, estado)   // PUT estado

// Mensajes
getMessagesByUser(userId)             // GET user's conversations
getConversation(user1, user2)         // GET chat history
```

### Frontend (app.js)

```javascript
getUser()                             // Get user from localStorage
setUser(user, token)                  // Save user + token
getToken()                            // Get JWT token
getHeaders()                          // Get headers con Authorization
logout()                              // Clear session
requireLogin(rolesPermitidos)         // Check auth + role
renderNavbar()                        // Draw navbar con user info
renderBottomBar(activePage)           // Draw bottom navigation
toggleDarkMode()                      // Toggle dark mode
```

---

## 🧪 TESTING (Manual)

### Test 1: Login Flow
```bash
curl -X POST http://localhost:3000/api/login \
  -H "Content-Type: application/json" \
  -d '{"email":"juan@mail.com","password":"1234"}'
# Response: { user, token, success: true }
```

### Test 2: Protected Endpoint
```bash
TOKEN="<response token>"
curl -X GET http://localhost:3000/api/reservations?usuarioId=1 \
  -H "Authorization: Bearer $TOKEN"
# Response: [{ id, parqueo_id, ... }]
```

### Test 3: Role Check
```bash
# With visitante token (should work)
curl -X GET http://localhost:3000/api/admin/users \
  -H "Authorization: Bearer $VISITANTE_TOKEN"
# Response: 403 Forbidden
```

---

## 📦 DEPENDENCIAS

```json
{
  "dependencies": {
    "express": "^5.x",
    "jsonwebtoken": "^9.0.2",
    "dotenv": "^16.x",
    "mysql2": "^3.x",
    "cors": "^2.x",
    "body-parser": "^1.x",
    "resend": "^x.x"
  }
}
```

---

## 🚀 DEPLOY (Próximos Pasos)

### Heroku
```bash
heroku login
heroku create app-name
git push heroku main
heroku config:set JWT_SECRET=your_secret
```

### Railway
```bash
railway init
railway add nodejs
railway up
```

### Con MySQL
```bash
heroku addons:create jawsdb:kitefin
# Copia DB_URL a config vars
```

---

## 🐛 DEBUGGING

### Ver logs servidor
```bash
node server.js
# Todos los logs van a console
```

### Ver logs cliente
```
F12 → Console tab
```

### Verificar token
```javascript
// En console
localStorage.getItem('token')
localStorage.getItem('parqueo_user')
```

### Problemas comunes

| Error | Causa | Solución |
|-------|-------|----------|
| 401 Unauthorized | Token inválido/expirado | Relogin |
| 403 Forbidden | Rol insuficiente | Usar usuario correcto |
| 400 Bad Request | Validación falla | Revisar campos requeridos |
| CORS error | Frontend distinto que API | Usar localhost:3000 |
| localStorage undefined | Modo privado | Abrir en modo normal |

---

## 📚 REFERENCIAS

- **Express**: https://expressjs.com
- **JWT**: https://jwt.io
- **Bootstrap**: https://getbootstrap.com
- **Leaflet**: https://leafletjs.com
- **localStorage**: https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage

---

**Última actualización**: Mayo 2026  
**Versión**: 1.0 MVP  
**Autor**: GitHub Copilot
