# 🅿️ Parqueos Esquipulas

Sistema de gestión de parqueos para visitantes de la **Basílica de Esquipulas**, Guatemala. Conecta a visitantes que necesitan estacionamiento con anfitriones locales que ofrecen espacios disponibles cerca del templo.

> **Nota:** Este es un MVP de demostración con datos mock. No incluye base de datos ni autenticación real.

## 📸 Características

- **Búsqueda de parqueos** — Filtra por tipo de vehículo (auto/moto) y precio máximo
- **Reservaciones** — Los visitantes reservan espacios con fecha y ven ubicación en Google Maps
- **Publicación de espacios** — Los anfitriones publican sus parqueos con ubicación, precio y tipo
- **Mensajería** — Chat entre visitantes y anfitriones con notificaciones por email (Resend)
- **Panel de administración** — Gestión de usuarios, parqueos, reservas y métricas
- **Métricas** — Ocupación, reservas y estadísticas del sistema
- **PWA** — Instalable como app móvil con Service Worker

## 🛠️ Tech Stack

| Capa | Tecnología |
|------|-----------|
| Backend | Node.js + Express |
| Frontend | HTML5, Bootstrap 5.3, CSS custom, Vanilla JS |
| Email | Resend (modo demo por defecto) |
| PWA | manifest.json + Service Worker |
| Mapa | Google Maps iframe embed |

## 🚀 Instalación

```bash
git clone https://github.com/DavexDev/parqueo.git
cd parqueo
npm install
node server.js
```

Abre **http://localhost:3000** en tu navegador.

## 👤 Cuentas de prueba

| Email | Rol | Nombre |
|-------|-----|--------|
| `juan@mail.com` | Visitante | Juan Pérez |
| `ana@mail.com` | Anfitrión | Ana López |
| `admin@parqueos.com` | Admin | Admin |

## 📁 Estructura

```
├── server.js            # API REST con datos mock
├── package.json
├── .gitignore
├── AGENT.md             # Documentación del proyecto
└── public/
    ├── index.html       # Home con navegación por rol
    ├── parkings.html    # Listado y filtros de parqueos
    ├── reserve.html     # Reservar parqueo + mapa
    ├── publish.html     # Publicar parqueo (anfitrión)
    ├── login.html       # Login / Registro
    ├── messages.html    # Chat entre usuarios
    ├── admin.html       # Panel de administración
    ├── metrics.html     # Métricas públicas
    ├── app.js           # Sesión, navbar, bottom bar
    ├── styles.css       # Tema visual global
    ├── manifest.json    # PWA manifest
    └── service-worker.js
```

## 🔐 Roles y permisos

- **Visitante** — Buscar parqueos, reservar, enviar mensajes a anfitriones
- **Anfitrión** — Publicar parqueos, responder mensajes de visitantes
- **Admin** — Panel completo: gestión de usuarios, parqueos, reservas, métricas y notificaciones por email

## 📧 Email (Resend)

Por defecto usa `re_demo_key` (modo demo, no envía emails reales). Para activar envío real:

```bash
set RESEND_API_KEY=re_tu_api_key_real
node server.js
```

## 📄 Licencia

Proyecto privado. Todos los derechos reservados.
