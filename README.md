# Parqueos Esquipulas

**RDP S.A.** — Sistema de reserva de parqueos para Esquipulas, Guatemala.  
Plataforma completa con Supabase, autenticación real, RLS y despliegue en Vercel.

**Produccion:** https://parqueo-beryl.vercel.app

---

## Inicio Rápido (2 pasos)

### 1. Instalar
```bash
npm install
```

### 2. Ejecutar
```bash
npm start
# O: node server.js
```

Abre → **http://localhost:3000** 

---

## Usuarios de Prueba

| Email | Contrasena | Rol |
|-------|-----------|-----|
| `admin@rdp.gt` | `Test1234!` | Admin |
| `roberto.mendez@test.gt` | `Test1234!` | Anfitrion |
| `ana.fuentes@test.gt` | `Test1234!` | Anfitrion |
| `juan.ortiz@test.gt` | `Test1234!` | Visitante |
| `maria.lopez@test.gt` | `Test1234!` | Visitante |

> Ejecutar `db/seed.sql` en el SQL Editor de Supabase antes de usar estas cuentas.

---

## Lo que Funciona (Demo Completa)

### Visitante
- Buscar parqueos (filtros: tipo, precio, radio)
- Mapa interactivo con ubicación actual
- Reservar parqueos
- Ver historial de reservas (con filtros)
- Chatear con anfitriones
- Dejar reseñas 

### Anfitrión 
- Publicar parqueos
- Dashboard con ingresos totales
- Ver y confirmar reservas
- Chatear con visitantes
- Ver reseñas de sus parqueos

### Admin
- Dashboard con 4 métricas
- Gestionar usuarios
- Gestionar parqueos
- Gestionar reservas
- Monitorear mensajes
- Panel completo funcional

### General
- **Autenticación JWT** (email + password)
- **3 Roles** con permisos
- **Responsive design** (mobile, tablet, desktop)
- **Dark mode** toggle 
- **Tutorial interactivo** (5 modales)
- **Validación de entrada**
- **Manejo de errores**

---

## Demo Flow (5 minutos)

### 1. Tutorial (1 min)
```
Inicio → "Ver Tutorial" → Lee las 5 guías
```

### 2. Visitante (1.5 min)
```
Login: juan@mail.com / 1234
 → Buscar parqueo
 → Ver en mapa
 → Reservar
 → Ver en "Mis Reservas"
```

### 3. Anfitrión (1.5 min)
```
Login: ana@mail.com / 1234
 → "Mi Negocio" → Ver ganancias
 → "Reservas" → Confirmar reserva
 → "Mensajes" → Chatear
```

### 4. Admin (1 min)
```
Login: admin@parqueos.com / 1234
 → Ver dashboard
 → Gestionar usuarios/parqueos/reservas
```

---

## Estructura Clave

```
public/
├── index.html # Inicio
├── login.html # Auth (email + password)
├── parkings.html # Búsqueda + mapa 
├── reserve.html # Crear reserva
├── reservations.html # Mis reservas
├── publish.html # Publicar parqueo
├── host-dashboard.html # Dashboard anfitrión 
├── messages.html # Chat 
├── reviews.html # Reseñas 
├── admin.html # Panel admin 
├── tutorial.html # Guía interactiva 
├── app.js # Auth helpers
└── styles.css # Diseño + dark mode

server.js # Express API (15+ endpoints)
src/middleware/ # Auth JWT, validación
```

---

## API (15+ Endpoints)

Todo funciona con mock data — sin base de datos:

```
POST /api/login # Autenticación
POST /api/register # Nuevo usuario
GET /api/parkings # Listar parqueos
GET /api/parkings/near # Búsqueda por radio
POST /api/parkings # Crear (anfitrión)
GET /api/reservations # Mis reservas
POST /api/reservations # Crear reserva
PUT /api/reservations/:id # Cambiar estado
GET /api/messages/conversation # Chat
POST /api/messages # Enviar mensaje
GET /api/admin/users # Todos usuarios
GET /api/admin/parkings # Todos parqueos
GET /api/admin/reservations # Todas reservas
GET /api/admin/messages # Todos mensajes
GET /api/admin/metrics # Dashboard
```

---

## Features Premium

| Feature | Estado |
|---------|--------|
| Autenticacion JWT | OK |
| 3 Roles RBAC | OK |
| Mapa Leaflet.js | OK |
| Dark Mode | OK |
| Tutorial modal | OK |
| Dashboard anfitrion | OK |
| Resenas 5 estrellas | OK |
| Responsive mobile | OK |
| PWA ready | OK |
| Supabase RLS | OK |

---

## Datos Mock

- **2 parqueos** (uno de Ana)
- **3 usuarios** (Juan, Ana, Admin)
- **1 reserva** de ejemplo
- **2 mensajes** en conversación
- **5 reseñas** en localStorage

Todo generado automáticamente al iniciar.

---

## Stack

- **Backend**: Node.js 18+, Express 5.x, Vercel Serverless
- **Base de datos**: Supabase (PostgreSQL + RLS)
- **Auth**: Supabase Auth + JWT
- **Frontend**: HTML5, CSS3, Bootstrap 5.3, Vanilla JS
- **Mapas**: Leaflet.js + OpenStreetMap
- **Iconos**: Bootstrap Icons
- **Push**: Firebase Cloud Messaging
- **PWA**: manifest.json, Service Worker

---

## Highlights

- Sin dependencias externas de terceros innecesarias
- Base de datos real con Supabase y Row Level Security
- Clean code (repositories pattern, middlewares)
- CORS configurado
- Validacion completa (email, roles, input)
- Error handling (respuestas HTTP especificas)
- JWT expirable (7 dias)
- Role-based access (requireRole middleware)

---

## Para Agregar MySQL

1. Crear base de datos:
```sql
source db/schema.sql;
```

2. Configurar `.env`:
```
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=xxxxx
DB_NAME=parqueos
DB_POOL_SIZE=5
```

3. Server cargará datos reales automáticamente

---

## Demo Responsivo

- Abre en **Chrome/Firefox**
- Presiona **F12** → **Toggle device toolbar**
- Prueba en:
 - iPhone (375px)
 - iPad (768px)
 - Desktop (1920px)

Todo se adapta automáticamente.

---

## Seguridad

- JWT con expiracion
- Contrasena obligatoria
- Row Level Security en Supabase (patch_v3)
- Trigger anti-escalada de roles
- Rate limiting en API (60 req/min por IP, 10 en /auth)
- HTTP security headers (CSP, X-Frame-Options, HSTS, etc.)
- Firma del servidor oculta (X-Powered-By eliminado)

---

## Caso de Uso Real

```
1. Usuario nuevo entra → tutorial
2. Se registra como visitante
3. Busca parqueos cerca de la Basílica
4. Reserva uno con mapa interactivo
5. Chateia con anfitrión para coordinar
6. Deja reseña de 5 estrellas
7. Anfitrión recibe notificación
8. Admin ve reportes en dashboard
```

**Todo funciona ahora sin internet externo.** 

---

## Resumen

| Métrica | Valor |
|---------|-------|
| Páginas | 11 |
| Endpoints | 15+ |
| Usuarios mock | 3 |
| Roles | 3 |
| Líneas código | ~3000 |
| Tiempo setup | < 1 min |
| Status | DEMO LISTA |

---

## Incluido

- Frontend completo (HTML, CSS, JS)
- Backend API (Express 5.x + Vercel)
- Autenticacion real (Supabase Auth)
- Base de datos Supabase con RLS
- Seed de datos de prueba (`db/seed.sql`)
- Paginas legales (terminos, privacidad, cookies)
- Diseno responsive + dark mode
- Tutorial interactivo
- Licencia propietaria

---

**Listo para:** Presentación, demo, investor pitch, evaluación cliente 
**Tiempo demo:** 5-10 minutos 
**Setup time:** 1 minuto 
**Estado:** **100% Funcional**

---

## Licencia

Codigo propietario — Copyright (c) 2026 RDP S.A.  
Todos los derechos reservados. Ver archivo [LICENSE](LICENSE) para condiciones de uso.

Queda prohibida la copia, distribucion, modificacion o uso no autorizado de este
software sin autorizacion escrita previa de RDP S.A.

---

RDP S.A. — Parqueos Esquipulas, Guatemala | Mayo 2026
