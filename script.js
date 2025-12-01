// CARRUSEL DE TESTIMONIOS
const carousel = document.querySelector('.testimonials-carousel');
const prevBtn = document.querySelector('.carousel-btn.prev');
const nextBtn = document.querySelector('.carousel-btn.next');

if (carousel && prevBtn && nextBtn) {
  const testimonialWidth = carousel.querySelector('.testimonial').offsetWidth + 24; // width + gap

  prevBtn.addEventListener('click', () => {
    carousel.scrollBy({ left: -testimonialWidth, behavior: 'smooth' });
  });

  nextBtn.addEventListener('click', () => {
    carousel.scrollBy({ left: testimonialWidth, behavior: 'smooth' });
  });
}

// CALENDARIO DE CITAS
class AppointmentCalendar {
  constructor() {
    this.currentDate = new Date();
    this.selectedDate = null;
    this.selectedTime = null;
    this.modal = null;
    this.reservationsKey = 'mw_reservations_v1';
    this.init();
  }

  init() {
    this.renderCalendar();
    this.ensureModal();
    this.ensureAdminPanel();
    this.attachEventListeners();
  }

  // --- Persistencia ligera ---
  loadReservations() {
    try {
      const raw = localStorage.getItem(this.reservationsKey);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  saveReservations(list) {
    localStorage.setItem(this.reservationsKey, JSON.stringify(list));
  }

  makeKey(dateObj, timeStr) {
    const y = dateObj.getFullYear();
    const m = String(dateObj.getMonth() + 1).padStart(2, '0');
    const d = String(dateObj.getDate()).padStart(2, '0');
    return `${y}-${m}-${d} ${timeStr}`;
  }

  isSlotAvailable(dateObj, timeStr) {
    const key = this.makeKey(dateObj, timeStr);
    const list = this.loadReservations();
    return !list.some(r => r.key === key);
  }

  addReservation(dateObj, timeStr) {
    const list = this.loadReservations();
    const key = this.makeKey(dateObj, timeStr);
    if (list.some(r => r.key === key)) return false; // ya tomado
    
    // Capturar nombre del usuario si existe
    const nameInput = document.getElementById('bookingName');
    const name = nameInput ? nameInput.value.trim() : '';
    
    list.push({ key, name, createdAt: Date.now() });
    this.saveReservations(list);
    return true;
  }

  ensureModal() {
    if (document.getElementById('bookingModal')) return;
    const modal = document.createElement('div');
    modal.id = 'bookingModal';
    modal.style.position = 'fixed';
    modal.style.inset = '0';
    modal.style.background = 'rgba(0,0,0,0.35)';
    modal.style.display = 'none';
    modal.style.alignItems = 'center';
    modal.style.justifyContent = 'center';

    const card = document.createElement('div');
    card.style.background = '#fff';
    card.style.borderRadius = '16px';
    card.style.padding = '1.4rem';
    card.style.boxShadow = '0 20px 40px rgba(0,0,0,0.12)';
    card.style.width = 'min(92vw, 460px)';

    const title = document.createElement('h3');
    title.textContent = 'Reserva confirmada';
    title.style.margin = '0 0 0.5rem';

    const info = document.createElement('p');
    info.id = 'bookingInfo';
    info.style.margin = '0 0 1rem';

    const actions = document.createElement('div');
    actions.style.display = 'flex';
    actions.style.gap = '0.6rem';
    actions.style.flexWrap = 'wrap';

    const closeBtn = document.createElement('button');
    closeBtn.className = 'btn btn-ghost';
    closeBtn.textContent = 'Cerrar';
    closeBtn.addEventListener('click', () => this.hideModal());

    const icsBtn = document.createElement('button');
    icsBtn.className = 'btn btn-primary';
    icsBtn.textContent = 'Añadir al calendario (.ics)';
    icsBtn.addEventListener('click', () => this.downloadICS());

    actions.appendChild(icsBtn);
    actions.appendChild(closeBtn);

    card.appendChild(title);
    card.appendChild(info);
    card.appendChild(actions);
    modal.appendChild(card);
    document.body.appendChild(modal);
    this.modal = modal;
  }

  showModal(text) {
    const info = document.getElementById('bookingInfo');
    if (info) info.textContent = text;
    if (this.modal) this.modal.style.display = 'flex';
  }

  hideModal() {
    if (this.modal) this.modal.style.display = 'none';
  }

  downloadICS() {
    if (!this.selectedDate || !this.selectedTime) return;
    const [hours, minutes] = this.selectedTime.split(':').map(Number);
    const start = new Date(this.selectedDate);
    start.setHours(hours, minutes, 0, 0);
    const end = new Date(start.getTime() + 50 * 60000); // 50 minutos

    const formatICS = (d) => {
      const pad = (n) => String(n).padStart(2, '0');
      return (
        d.getUTCFullYear() +
        pad(d.getUTCMonth() + 1) +
        pad(d.getUTCDate()) + 'T' +
        pad(d.getUTCHours()) +
        pad(d.getUTCMinutes()) +
        pad(d.getUTCSeconds()) + 'Z'
      );
    };

    const ics = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//MiniWebExpress//ES',
      'BEGIN:VEVENT',
      `UID:${Date.now()}@miniwebexpress.local`,
      `DTSTAMP:${formatICS(new Date())}`,
      `DTSTART:${formatICS(start)}`,
      `DTEND:${formatICS(end)}`,
      'SUMMARY: Sesión con Laura Méndez',
      'DESCRIPTION: Sesión de terapia online',
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\r\n');

    const blob = new Blob([ics], { type: 'text/calendar' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sesion-laura-mendez.ics';
    document.body.appendChild(a);
    a.click();
    URL.revokeObjectURL(url);
    a.remove();
  }

  // --- Panel de administración ligero ---
  ensureAdminPanel() {
    if (document.getElementById('mwAdminPanel')) return;

    const panel = document.createElement('div');
    panel.id = 'mwAdminPanel';
    panel.style.position = 'fixed';
    panel.style.right = '16px';
    panel.style.bottom = '16px';
    panel.style.background = '#ffffff';
    panel.style.border = '1px solid rgba(224,216,204,0.8)';
    panel.style.boxShadow = '0 12px 28px rgba(0,0,0,0.10)';
    panel.style.borderRadius = '12px';
    panel.style.padding = '0.9rem';
    panel.style.width = '280px';
    panel.style.zIndex = '1000';
    panel.style.display = 'none';

    const header = document.createElement('div');
    header.style.display = 'flex';
    header.style.justifyContent = 'space-between';
    header.style.alignItems = 'center';
    const title = document.createElement('strong');
    title.textContent = 'Panel administrador';
    const close = document.createElement('button');
    close.textContent = '×';
    close.style.border = 'none';
    close.style.background = 'transparent';
    close.style.fontSize = '1.2rem';
    close.style.cursor = 'pointer';
    close.addEventListener('click', () => panel.style.display = 'none');
    header.appendChild(title);
    header.appendChild(close);

    const hint = document.createElement('p');
    hint.textContent = 'Usa los botones para gestionar reservas.';
    hint.style.margin = '0.4rem 0 0.8rem';
    hint.style.fontSize = '0.85rem';

    const actions = document.createElement('div');
    actions.style.display = 'grid';
    actions.style.gridTemplateColumns = '1fr';
    actions.style.gap = '0.5rem';

    const listWrap = document.createElement('div');
    listWrap.style.maxHeight = '220px';
    listWrap.style.overflow = 'auto';
    listWrap.style.border = '1px solid rgba(224,216,204,0.6)';
    listWrap.style.borderRadius = '8px';
    listWrap.style.padding = '0.5rem';
    listWrap.style.marginBottom = '0.6rem';
    const listTitle = document.createElement('div');
    listTitle.textContent = 'Reservas:';
    listTitle.style.fontWeight = '600';
    listTitle.style.fontSize = '0.9rem';
    listTitle.style.margin = '0 0 0.4rem';
    const listEl = document.createElement('ul');
    listEl.id = 'mwAdminList';
    listEl.style.listStyle = 'none';
    listEl.style.padding = '0';
    listEl.style.margin = '0';
    listWrap.appendChild(listTitle);
    listWrap.appendChild(listEl);

    const btnExport = document.createElement('button');
    btnExport.className = 'btn btn-ghost';
    btnExport.textContent = 'Exportar CSV';
    btnExport.addEventListener('click', () => window.MWAdmin.exportCSV());

    const btnClear = document.createElement('button');
    btnClear.className = 'btn btn-primary';
    btnClear.textContent = 'Limpiar reservas';
    btnClear.addEventListener('click', () => window.MWAdmin.clearAll());

    const small = document.createElement('p');
    small.textContent = 'Atajo: presiona Alt + M para abrir';
    small.style.fontSize = '0.75rem';
    small.style.color = '#6b7d77';
    small.style.margin = '0.5rem 0 0';

    actions.appendChild(btnExport);
    actions.appendChild(btnClear);

    panel.appendChild(header);
    panel.appendChild(hint);
    panel.appendChild(listWrap);
    panel.appendChild(actions);
    panel.appendChild(small);
    document.body.appendChild(panel);

    // Toggle por teclado + clave simple
    let unlocked = false;
    const askPass = () => {
      const key = prompt('Clave de administrador:');
      // Clave básica, puedes cambiarla aquí
      if (key && key === '4321') {
        unlocked = true;
        return true;
      }
      alert('Clave incorrecta');
      return false;
    };

    window.addEventListener('keydown', (e) => {
      if (e.altKey && e.key.toLowerCase() === 'm') {
        if (!unlocked && !askPass()) return;
        panel.style.display = (panel.style.display === 'none') ? 'block' : 'none';
        if (panel.style.display === 'block') this.renderAdminList();
      }
    });
  }

  renderAdminList() {
    const listEl = document.getElementById('mwAdminList');
    if (!listEl) return;
    const list = this.loadReservations();
    listEl.innerHTML = '';
    if (!list.length) {
      const empty = document.createElement('li');
      empty.textContent = 'Sin reservas registradas';
      empty.style.color = '#6b7d77';
      listEl.appendChild(empty);
      return;
    }
    list.forEach((r) => {
      const li = document.createElement('li');
      const displayName = r.name ? ` - ${r.name}` : '';
      li.textContent = `${r.key}${displayName}`;
      li.style.padding = '0.35rem 0';
      li.style.borderBottom = '1px dashed rgba(224,216,204,0.6)';
      listEl.appendChild(li);
    });
  }

  // Envío básico de correo vía mailto (sin backend)
  sendEmailConfirmation(email) {
    if (!email || !this.selectedDate || !this.selectedTime) return;
    const dateStr = this.selectedDate.toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' });
    const subject = encodeURIComponent('Confirmación de reserva · Laura Méndez');
    const body = encodeURIComponent(`Hola,\n\nTu sesión quedó agendada para el ${dateStr} a las ${this.selectedTime}.\n\nSi necesitas reprogramar, responde a este correo.\n\nGracias,\nLaura Méndez`);
    const link = `mailto:${encodeURIComponent(email)}?subject=${subject}&body=${body}`;
    window.location.href = link;
  }

  renderCalendar() {
    const year = this.currentDate.getFullYear();
    const month = this.currentDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const today = new Date();

    document.getElementById('monthYear').textContent = 
      this.currentDate.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });

    const calendarGrid = document.getElementById('calendar');
    calendarGrid.innerHTML = '';

    // Agregar etiquetas de días
    const dayLabels = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    dayLabels.forEach(label => {
      const labelEl = document.createElement('div');
      labelEl.className = 'day-label';
      labelEl.textContent = label;
      calendarGrid.appendChild(labelEl);
    });

    // Agregar días vacíos
    for (let i = 0; i < firstDay; i++) {
      const emptyEl = document.createElement('div');
      emptyEl.className = 'calendar-day disabled';
      calendarGrid.appendChild(emptyEl);
    }

    // Agregar días del mes
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dayEl = document.createElement('button');
      dayEl.className = 'calendar-day available';
      dayEl.textContent = day;
      dayEl.type = 'button';

      // Marcar hoy
      if (date.toDateString() === today.toDateString()) {
        dayEl.classList.add('today');
      }

      // Deshabilitar días pasados
      if (date < today) {
        dayEl.classList.remove('available');
        dayEl.classList.add('disabled');
        dayEl.disabled = true;
      } else {
        dayEl.addEventListener('click', () => this.selectDate(date, dayEl));
      }

      calendarGrid.appendChild(dayEl);
    }
  }

  selectDate(date, element) {
    // Remover selección anterior
    document.querySelectorAll('.calendar-day.selected').forEach(el => {
      el.classList.remove('selected');
    });

    // Marcar nueva selección
    element.classList.add('selected');
    this.selectedDate = date;
    this.selectedTime = null;
    this.updateTimeSlots();
  }

  updateTimeSlots() {
    const dateStr = this.selectedDate.toLocaleDateString('es-ES', 
      { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    document.getElementById('selectedDate').textContent = `Seleccionado: ${dateStr}`;

    const slotsContainer = document.getElementById('timeSlots');
    slotsContainer.innerHTML = '';

    // Horarios disponibles
    const timeSlots = ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00', '17:00'];
    
    timeSlots.forEach(time => {
      const slot = document.createElement('button');
      slot.className = 'time-slot';
      slot.textContent = time;
      slot.type = 'button';
      // Bloquear si está tomado
      const free = this.isSlotAvailable(this.selectedDate, time);
      if (!free) {
        slot.classList.add('disabled');
        slot.disabled = true;
      } else {
        slot.addEventListener('click', () => this.selectTime(time, slot));
      }
      slotsContainer.appendChild(slot);
    });

    // Mostrar el campo de email cuando se selecciona una fecha
    const emailBox = document.getElementById('emailBox');
    if (emailBox) emailBox.style.display = 'block';

    document.getElementById('confirmBooking').style.display = 'block';
  }

  selectTime(time, element) {
    // Remover selección anterior
    document.querySelectorAll('.time-slot.selected').forEach(el => {
      el.classList.remove('selected');
    });

    // Marcar nueva selección
    element.classList.add('selected');
    this.selectedTime = time;
  }

  attachEventListeners() {
    document.getElementById('prevMonth').addEventListener('click', () => {
      this.currentDate.setMonth(this.currentDate.getMonth() - 1);
      this.renderCalendar();
    });

    document.getElementById('nextMonth').addEventListener('click', () => {
      this.currentDate.setMonth(this.currentDate.getMonth() + 1);
      this.renderCalendar();
    });

    const confirmBtn = document.getElementById('confirmBooking');
    confirmBtn.textContent = 'Confirmar reserva';
    confirmBtn.addEventListener('click', () => {
      if (this.selectedDate && this.selectedTime) {
        // Intentar guardar
        const ok = this.addReservation(this.selectedDate, this.selectedTime);
        if (!ok) {
          this.showModal('Ese horario ya fue reservado. Por favor elige otro.');
          return;
        }
        const dateStr = this.selectedDate.toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' });
        this.showModal(`Tu sesión quedó agendada para el ${dateStr} a las ${this.selectedTime}.`);
        // Actualizar UI para bloquear el slot recién tomado
        this.updateTimeSlots();
        // Tomar email del campo y enviar confirmación si es válido
        const emailInput = document.getElementById('bookingEmail');
        const email = emailInput ? emailInput.value.trim() : '';
        if (email && /.+@.+\..+/.test(email)) {
          this.sendEmailConfirmation(email);
        }
        
          // Refrescar panel si está abierto
          this.renderAdminList();
      }
    });

    // Accesos rápidos para administración mínima (exportar/limpiar)
    window.MWAdmin = {
      exportCSV: () => {
        const list = this.loadReservations();
        const rows = ['fecha_hora,created_at'];
        list.forEach(r => rows.push(`${r.key},${new Date(r.createdAt).toISOString()}`));
        const blob = new Blob([rows.join('\n')], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'reservas.csv';
        document.body.appendChild(a);
        a.click();
        URL.revokeObjectURL(url);
        a.remove();
      },
      clearAll: () => {
        localStorage.removeItem(this.reservationsKey);
        if (this.selectedDate) this.updateTimeSlots();
        alert('Reservas eliminadas');
      }
    };
  }
}

// Inicializar calendario
if (document.getElementById('calendar')) {
  new AppointmentCalendar();
}

// ANIMACIONES AL HACER SCROLL
const observerOptions = {
  threshold: 0.1,
  rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
    }
  });
}, observerOptions);

// Observar elementos con animación
document.addEventListener('DOMContentLoaded', () => {
  const animatedElements = document.querySelectorAll('.fade-in, .slide-in-left, .slide-in-right, .scale-in');
  animatedElements.forEach(el => observer.observe(el));

  // FAQ ACCORDION
  const faqItems = document.querySelectorAll('.faq-item');
  faqItems.forEach(item => {
    const question = item.querySelector('.faq-question');
    question.addEventListener('click', () => {
      const isActive = item.classList.contains('active');
      
      // Cerrar todos
      faqItems.forEach(i => i.classList.remove('active'));
      
      // Abrir el clickeado si estaba cerrado
      if (!isActive) {
        item.classList.add('active');
      }
    });
  });

  // CONTADOR DE ESTADÍSTICAS
  const statsSection = document.querySelector('.stats-section');
  let hasAnimated = false;

  const statsObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting && !hasAnimated) {
        hasAnimated = true;
        const statNumbers = document.querySelectorAll('.stat-number');
        
        statNumbers.forEach(stat => {
          const target = parseInt(stat.getAttribute('data-target'));
          const duration = 2000;
          const increment = target / (duration / 16);
          let current = 0;

          const updateCounter = () => {
            current += increment;
            if (current < target) {
              stat.textContent = Math.floor(current);
              requestAnimationFrame(updateCounter);
            } else {
              stat.textContent = target;
            }
          };

          updateCounter();
        });
      }
    });
  }, { threshold: 0.3 });

  if (statsSection) {
    statsObserver.observe(statsSection);
  }

  // MENÚ MÓVIL
  const menuBtn = document.getElementById('mobileMenuToggle');
  const menuWrapper = document.getElementById('navWrapper');
  const menuLinks = document.querySelectorAll('.nav a');
  
  console.log('Inicializando menú móvil...', { menuBtn, menuWrapper, linksCount: menuLinks.length });
  
  if (menuBtn && menuWrapper) {
    menuBtn.addEventListener('click', function(e) {
      console.log('Click en botón menú');
      const isOpen = menuWrapper.classList.contains('active');
      console.log('Estado actual:', isOpen ? 'abierto' : 'cerrado');
      
      if (isOpen) {
        menuBtn.classList.remove('active');
        menuWrapper.classList.remove('active');
        document.body.style.overflow = '';
        console.log('Menú cerrado');
      } else {
        menuBtn.classList.add('active');
        menuWrapper.classList.add('active');
        document.body.style.overflow = 'hidden';
        console.log('Menú abierto');
      }
    });
    
    menuLinks.forEach(function(link) {
      link.addEventListener('click', function() {
        console.log('Click en enlace del menú');
        menuBtn.classList.remove('active');
        menuWrapper.classList.remove('active');
        document.body.style.overflow = '';
      });
    });
    
    menuWrapper.addEventListener('click', function(e) {
      if (e.target === menuWrapper) {
        console.log('Click en fondo del menú');
        menuBtn.classList.remove('active');
        menuWrapper.classList.remove('active');
        document.body.style.overflow = '';
      }
    });
    
    console.log('Menú móvil inicializado correctamente');
  } else {
    console.error('NO se encontraron elementos del menú!');
  }

  // TEMA OSCURO/CLARO
  const themeToggle = document.getElementById('themeToggle');
  const themeIcon = document.getElementById('themeIcon');
  
  console.log('Inicializando tema oscuro...', { themeToggle, themeIcon });
  
  // Cargar tema guardado
  const savedTheme = localStorage.getItem('theme') || 'light';
  document.documentElement.setAttribute('data-theme', savedTheme);
  if (themeIcon) themeIcon.textContent = savedTheme === 'dark' ? '☀️' : '🌙';

  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      console.log('Click en botón de tema');
      const currentTheme = document.documentElement.getAttribute('data-theme');
      const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
      
      document.documentElement.setAttribute('data-theme', newTheme);
      localStorage.setItem('theme', newTheme);
      themeIcon.textContent = newTheme === 'dark' ? '☀️' : '🌙';
      console.log('Tema cambiado a:', newTheme);
    });
    console.log('Tema oscuro inicializado correctamente');
  } else {
    console.error('NO se encontró botón de tema!');
  }
});
