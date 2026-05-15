// SPDX-License-Identifier: LicenseRef-Proprietary
// © 2026 DavexDev — tutorial.js  Onboarding interactivo por rol
(function () {

  var STEPS = {
    visitante: [
      {
        icon: 'bi-p-circle-fill',
        title: 'Bienvenido a RDP S.A.',
        desc: 'La plataforma de parqueos en Esquipulas, Guatemala. Te guiaremos en los pasos principales para que empieces a reservar sin problemas.'
      },
      {
        icon: 'bi-search',
        title: 'Busca un parqueo',
        desc: 'En la sección "Buscar" encontrarás todos los parqueos disponibles. Puedes filtrar por precio, tipo de vehículo y distancia.',
        target: 'a[href="parkings.html"]'
      },
      {
        icon: 'bi-calendar-plus',
        title: 'Reserva tu espacio',
        desc: 'Al abrir un parqueo, selecciona si reservas por hora o por día, elige tus fechas y el método de pago. Al confirmar, recibirás un código de reserva.',
        target: null
      },
      {
        icon: 'bi-calendar-check-fill',
        title: 'Consulta tus reservas',
        desc: 'En "Reservas" ves el estado de cada reserva: pendiente, confirmada o finalizada. Puedes cancelar mientras no haya iniciado.',
        target: 'a[href="reservations.html"]'
      },
      {
        icon: 'bi-chat-dots-fill',
        title: 'Mensajes con el anfitrion',
        desc: 'Cuando el anfitrion acepte tu reserva, el boton "Contactar" se activa. Desde ese momento puedes chatear en tiempo real para coordinar tu llegada.',
        target: 'a[href="messages.html"]'
      }
    ],
    anfitrion: [
      {
        icon: 'bi-shop-fill',
        title: 'Bienvenido, anfitrion',
        desc: 'Desde RDP S.A. gestionas tus parqueos, recibes reservas y te comunicas con tus clientes. Aqui tienes un resumen de las funciones principales.'
      },
      {
        icon: 'bi-plus-circle-fill',
        title: 'Publica un parqueo',
        desc: 'Ve a "Publicar" para registrar un parqueo: nombre, direccion, fotos, tipos de vehiculos admitidos, horarios y tarifas. Quedara en revision hasta que el administrador lo apruebe.',
        target: 'a[href="publish.html"]'
      },
      {
        icon: 'bi-clock-history',
        title: 'Acepta o rechaza reservas',
        desc: 'En "Mi Negocio" aparecen todas las reservas entrantes. Puedes aceptarlas o rechazarlas. Al aceptar, el visitante recibe una notificacion y puede enviarte mensajes.',
        target: 'a[href="host-dashboard.html"]'
      },
      {
        icon: 'bi-chat-dots-fill',
        title: 'Responde a tus clientes',
        desc: 'Los visitantes con reservas confirmadas pueden escribirte. Responde preguntas, confirma ubicacion y coordina la llegada desde el chat en tiempo real.',
        target: 'a[href="messages.html"]'
      },
      {
        icon: 'bi-bar-chart-line-fill',
        title: 'Revisa tus ingresos',
        desc: 'La seccion de metricas muestra ingresos, reservas completadas y calificaciones promedio de cada parqueo. RDP retiene una comision del 17% por reserva confirmada.',
        target: 'a[href="host-dashboard.html"]'
      }
    ],
    admin: [
      {
        icon: 'bi-shield-fill-check',
        title: 'Panel de administracion',
        desc: 'Como administrador tienes acceso total: usuarios, parqueos, reservas, comisiones, mensajes y metricas globales de la plataforma.'
      },
      {
        icon: 'bi-building-check',
        title: 'Aprueba parqueos',
        desc: 'Los parqueos nuevos quedan en estado pendiente hasta tu revision. En Admin puedes aprobarlos o rechazarlos con un motivo que se notifica al anfitrion.',
        target: 'a[href="admin.html"]'
      },
      {
        icon: 'bi-people-fill',
        title: 'Gestiona usuarios',
        desc: 'Consulta todos los usuarios registrados, su rol, actividad y reservas. Puedes iniciar un chat directamente con cualquiera desde la lista de usuarios.',
        target: 'a[href="admin.html"]'
      },
      {
        icon: 'bi-chat-dots-fill',
        title: 'Mensajes sin restriccion',
        desc: 'Desde Mensajes puedes chatear con cualquier usuario de la plataforma. No requieres una reserva confirmada para iniciar conversaciones.',
        target: 'a[href="messages.html"]'
      },
      {
        icon: 'bi-bar-chart-line-fill',
        title: 'Metricas globales',
        desc: 'Las metricas muestran ingresos totales de RDP, comisiones del mes, reservas activas, usuarios nuevos y rendimiento de cada parqueo.',
        target: 'a[href="metrics.html"]'
      }
    ]
  };

  function key(rol) { return 'rdp_tour_v1_' + rol; }
  function isDone(rol) { return !!localStorage.getItem(key(rol)); }
  function markDone(rol) { localStorage.setItem(key(rol), '1'); }

  function highlightEl(selector) {
    if (!selector) return;
    var el = document.querySelector(selector);
    if (el) el.classList.add('rdp-tour-hl');
  }

  function clearHighlight() {
    document.querySelectorAll('.rdp-tour-hl').forEach(function (el) {
      el.classList.remove('rdp-tour-hl');
    });
  }

  function show(rol) {
    var steps = STEPS[rol];
    if (!steps || !steps.length) return;

    // Remove existing overlay if any
    var existing = document.getElementById('rdp-tour-overlay');
    if (existing) existing.remove();

    var overlay = document.createElement('div');
    overlay.id = 'rdp-tour-overlay';

    var card = document.createElement('div');
    card.id = 'rdp-tour-card';
    overlay.appendChild(card);
    document.body.appendChild(overlay);

    var current = 0;

    function render(idx) {
      clearHighlight();
      var step = steps[idx];
      highlightEl(step.target);
      var isLast = idx === steps.length - 1;

      card.innerHTML =
        '<div class="rdp-tour-dots">' +
          steps.map(function (_, i) {
            return '<span class="rdp-tour-dot' + (i === idx ? ' active' : '') + '"></span>';
          }).join('') +
        '</div>' +
        '<div class="rdp-tour-icon"><i class="bi ' + step.icon + '"></i></div>' +
        '<div class="rdp-tour-title">' + step.title + '</div>' +
        '<div class="rdp-tour-desc">' + step.desc + '</div>' +
        '<div class="rdp-tour-actions">' +
          (idx > 0
            ? '<button class="rdp-tour-ghost" id="rdp-tour-prev">Anterior</button>'
            : '<span></span>') +
          '<button class="rdp-tour-skip" id="rdp-tour-skip">Omitir</button>' +
          (isLast
            ? '<button class="rdp-tour-finish" id="rdp-tour-next">Entendido</button>'
            : '<button class="rdp-tour-next" id="rdp-tour-next">Siguiente</button>') +
        '</div>';

      document.getElementById('rdp-tour-skip').onclick = close;
      document.getElementById('rdp-tour-next').onclick = function () {
        if (!isLast) { current++; render(current); } else { close(); }
      };
      var prevBtn = document.getElementById('rdp-tour-prev');
      if (prevBtn) prevBtn.onclick = function () { current--; render(current); };
    }

    function close() {
      clearHighlight();
      markDone(rol);
      overlay.remove();
    }

    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) close();
    });

    render(0);
  }

  function init(rol) {
    if (!rol || isDone(rol)) return;
    function launch() { setTimeout(function () { show(rol); }, 700); }
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
      launch();
    } else {
      window.addEventListener('DOMContentLoaded', launch);
    }
  }

  function reset(rol) {
    if (rol) {
      localStorage.removeItem(key(rol));
    } else {
      ['visitante', 'anfitrion', 'admin'].forEach(function (r) {
        localStorage.removeItem(key(r));
      });
    }
  }

  window.rdpTutorial = { init: init, show: show, reset: reset };
}());
