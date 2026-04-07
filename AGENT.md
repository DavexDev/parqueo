# AGENT.md

## Contexto y Alcance del Proyecto: MVP Sistema de Parqueos Esquipulas

### 1. Contexto Real
- **Ciudad:** Esquipulas
- **Punto crítico:** Basílica de Esquipulas
- **Problemas detectados:**
  - Alta demanda temporal (fines de semana, festividades)
  - Infraestructura insuficiente (pocos parqueos públicos, calles estrechas)
  - Desorden y tráfico por búsqueda de espacio
  - Falta de información y visibilidad sobre disponibilidad
- **Insight clave:** El problema no es la falta total de espacio, sino la falta de organización y visibilidad.

### 2. Propuesta de Valor
- **Para visitantes:** "Llega con parqueo asegurado"
- **Para anfitriones:** "Gana dinero con tu espacio vacío"
- **Para la ciudad:** "Menos tráfico y caos"

### 3. Alcance del MVP (Previsualización)
- **Enfoque:** Mobile-first, web app tipo PWA, demo con mock data
- **Módulos incluidos:**
  1. Usuarios (registro/login, roles: visitante/anfitrión)
  2. Parqueos (crear, editar, activar/desactivar)
  3. Búsqueda de parqueos (listado, filtros: tipo, precio, cercanía)
  4. Reservas (crear, validar disponibilidad, estados: pendiente, confirmada, finalizada)
  5. Ubicación (Google Maps embed o link a coordenadas)
- **Exclusiones:**
  - Persistencia real (no base de datos, solo mock data)
  - Módulo de confianza (calificaciones, verificación)
  - Pagos en línea
  - Soporte desktop

### 4. Arquitectura Técnica
- **Frontend:** HTML, CSS (Bootstrap o puro), JS, mobile-first, PWA
- **Backend:** Node.js + Express (un solo archivo: server.js, endpoints REST simulados)
- **Base de datos:** Mock data en memoria (sin MySQL real)

### 5. Flujos Principales
- **Visitante:**
  - Entra a la web
  - Busca parqueo, filtra, selecciona
  - Reserva y contacta anfitrión
  - Llega directo al lugar
- **Anfitrión:**
  - Se registra
  - Publica espacio
  - Recibe reservas
  - Prepara lugar y cobra

### 6. Riesgos y Limitaciones
- **Confianza:** No se valida existencia real del parqueo (solo demo)
- **Conectividad:** App ligera, pero sin optimización avanzada offline
- **Adopción:** No se incluye estrategia de onboarding real
- **Competencia informal:** El MVP busca mostrar organización y reserva previa como ventaja

### 7. Métricas Clave (Mock)
- Número de parqueos registrados
- Número de reservas
- % de ocupación
- Tiempo promedio de búsqueda

### 8. Estrategia de Validación
- Fase 1: Reclutar casas conocidas, publicar en redes
- Fase 2: MVP web funcional (este prototipo)
- Fase 3: Optimización y mejoras UX

### 9. Nota Importante
Este repositorio es solo para previsualización y validación de la idea. El proyecto real, con lógica de negocio y datos reales, será privado y de propiedad exclusiva del autor.

---

**Contacto:** Para dudas o colaboración, contactar al propietario del proyecto.
