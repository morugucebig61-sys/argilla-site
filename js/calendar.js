// ═══════════════════════════════════════
// ARGILLA — Interactive Calendar v4
// Robust: no fancy features that can break
// Multiple events per date
// ═══════════════════════════════════════

(function () {
    'use strict';

    // ─── Event Data (from ArgillaData) ─────
    var events = window.ArgillaData ? ArgillaData.getEvents() : [];

    // ─── Month Names ───────────────────────
    var monthNames = [
        'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
        'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
    ];

    // ─── State ─────────────────────────────
    var currentYear = 2026;
    var currentMonth = 2; // March (0-indexed)
    var selectedDate = null;

    // ─── Helper: get events for a date ─────
    function getEventsForDate(dateStr) {
        return events.filter(function (e) { return e.date === dateStr; });
    }

    // ─── Helper: format date string ────────
    function makeDateStr(year, month, day) {
        return year + '-' + String(month + 1).padStart(2, '0') + '-' + String(day).padStart(2, '0');
    }

    // ─── Render Calendar Grid ──────────────
    function renderCalendar() {
        var grid = document.getElementById('cal-grid');
        var title = document.getElementById('cal-month-title');
        if (!grid || !title) return;

        title.textContent = monthNames[currentMonth] + ' ' + currentYear;

        // First day of month (0=Sun, 1=Mon, ... 6=Sat)
        var firstDayRaw = new Date(currentYear, currentMonth, 1).getDay();
        // Convert to Monday-based (0=Mon, 6=Sun)
        var startOffset = firstDayRaw === 0 ? 6 : firstDayRaw - 1;

        var daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

        var today = new Date();
        var todayStr = makeDateStr(today.getFullYear(), today.getMonth(), today.getDate());

        var html = '';

        // Empty cells before first day
        for (var i = 0; i < startOffset; i++) {
            html += '<div class="calendar__day calendar__day--empty"></div>';
        }

        // Day cells
        for (var day = 1; day <= daysInMonth; day++) {
            var dateStr = makeDateStr(currentYear, currentMonth, day);
            var dayEvents = getEventsForDate(dateStr);
            var hasEvents = dayEvents.length > 0;
            var isToday = dateStr === todayStr;

            var classes = 'calendar__day';
            if (isToday) classes += ' calendar__day--today';
            if (hasEvents) classes += ' calendar__day--event';

            // Weekend check (position in grid)
            var gridPos = (startOffset + day - 1) % 7;
            if (gridPos >= 5) classes += ' calendar__day--weekend';

            html += '<div class="' + classes + '" data-date="' + dateStr + '">';
            html += '<span class="calendar__day-num">' + day + '</span>';
            if (hasEvents) {
                html += '<span class="calendar__day-dot"></span>';
                if (dayEvents.length > 1) {
                    html += '<span class="calendar__day-count">' + dayEvents.length + '</span>';
                }
            }
            html += '</div>';
        }

        // Fill trailing to complete grid row
        var totalCells = startOffset + daysInMonth;
        var remainder = totalCells % 7;
        if (remainder > 0) {
            for (var j = 0; j < 7 - remainder; j++) {
                html += '<div class="calendar__day calendar__day--empty"></div>';
            }
        }

        grid.innerHTML = html;

        // Attach click handlers to event dates
        var eventDays = grid.querySelectorAll('.calendar__day--event');
        for (var k = 0; k < eventDays.length; k++) {
            eventDays[k].addEventListener('click', handleDayClick);
        }

        // GSAP stagger animate days (if gsap available)
        try {
            if (typeof gsap !== 'undefined') {
                var allDays = grid.querySelectorAll('.calendar__day:not(.calendar__day--empty)');
                gsap.fromTo(allDays, { opacity: 0, scale: 0.8 }, {
                    opacity: 1, scale: 1, duration: 0.35,
                    ease: 'back.out(1.2)',
                    stagger: { each: 0.02, from: 'start' }
                });
            }
        } catch (e) { /* animation is non-critical */ }
    }

    // ─── Day Click → Show Schedule Below ───
    function handleDayClick(e) {
        var cell = e.currentTarget;
        var dateStr = cell.getAttribute('data-date');
        var dayEvents = getEventsForDate(dateStr);
        if (dayEvents.length === 0) return;

        // Highlight active cell
        var prev = document.querySelector('.calendar__day.active');
        if (prev) prev.classList.remove('active');
        cell.classList.add('active');
        selectedDate = dateStr;

        showSchedule(dateStr, dayEvents);
    }

    // ─── Show Schedule Card(s) Below Calendar ─
    function showSchedule(dateStr, dayEvents) {
        var card = document.getElementById('event-card');
        if (!card) return;

        var dateObj = new Date(dateStr + 'T00:00:00');
        var dateLabel = dateObj.toLocaleDateString('ru-RU', {
            weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
        });

        // Build events list HTML
        var eventsHTML = '';
        for (var i = 0; i < dayEvents.length; i++) {
            var ev = dayEvents[i];
            eventsHTML += ''
                + '<div class="schedule-event" data-index="' + i + '">'
                + '  <div class="schedule-event__image-wrap">'
                + '    <img src="' + ev.image + '" alt="' + ev.title + '" class="schedule-event__image">'
                + '  </div>'
                + '  <div class="schedule-event__body">'
                + '    <h4 class="schedule-event__title">' + ev.title + '</h4>'
                + '    <p class="schedule-event__desc">' + ev.description + '</p>'
                + '    <div class="schedule-event__meta">'
                + '      <div class="schedule-event__meta-item">'
                + '        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>'
                + '        <span>' + ev.time + '</span>'
                + '      </div>'
                + '      <div class="schedule-event__meta-item">'
                + '        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>'
                + '        <span>' + ev.location + '</span>'
                + '      </div>'
                + '      <div class="schedule-event__meta-item">'
                + '        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>'
                + '        <span>' + ev.slots + ' мест</span>'
                + '      </div>'
                + '    </div>'
                + '    <div class="schedule-event__bottom">'
                + '      <span class="schedule-event__price">' + ev.price + '</span>'
                + '      <button class="btn btn--primary btn--sm schedule-event__cta" data-event-index="' + i + '">Хочу участвовать</button>'
                + '    </div>'
                + '  </div>'
                + '</div>';
        }

        // Replace event card inner content entirely
        card.querySelector('.event-card__inner').innerHTML = ''
            + '<button class="event-card__close" id="event-card-close" aria-label="Закрыть">'
            + '  <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>'
            + '</button>'
            + '<div class="schedule-header">'
            + '  <span class="event-card__label">' + dateLabel + '</span>'
            + '  <h3 class="event-card__title">Расписание на этот день</h3>'
            + '  <p class="schedule-header__count">' + dayEvents.length + ' мероприяти' + (dayEvents.length === 1 ? 'е' : 'я') + '</p>'
            + '</div>'
            + '<div class="schedule-list">' + eventsHTML + '</div>'
            + '<div class="schedule-form-area" id="schedule-form-area" style="display:none;"></div>';

        card.style.display = 'block';

        // Animate in
        try {
            if (typeof gsap !== 'undefined') {
                gsap.fromTo(card, { opacity: 0, y: 30 }, {
                    opacity: 1, y: 0, duration: 0.6, ease: 'power2.out'
                });
                gsap.fromTo(card.querySelectorAll('.schedule-event'), {
                    opacity: 0, y: 20
                }, {
                    opacity: 1, y: 0, duration: 0.5, ease: 'power2.out',
                    stagger: 0.1, delay: 0.2
                });
            }
        } catch (e) { /* animation non-critical */ }

        // Scroll to card
        setTimeout(function () {
            card.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 150);

        // Attach close button
        var closeBtn = document.getElementById('event-card-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', closeSchedule);
        }

        // Attach CTA buttons
        var ctaButtons = card.querySelectorAll('.schedule-event__cta');
        for (var i = 0; i < ctaButtons.length; i++) {
            ctaButtons[i].addEventListener('click', function (e) {
                var idx = parseInt(e.currentTarget.getAttribute('data-event-index'));
                showBookingForm(dayEvents[idx]);
            });
        }
    }

    // ─── Close Schedule ────────────────────
    function closeSchedule() {
        var card = document.getElementById('event-card');
        if (!card) return;

        try {
            if (typeof gsap !== 'undefined') {
                gsap.to(card, {
                    opacity: 0, y: 20, duration: 0.3, ease: 'power2.in',
                    onComplete: function () { card.style.display = 'none'; }
                });
            } else {
                card.style.display = 'none';
            }
        } catch (e) {
            card.style.display = 'none';
        }

        var prev = document.querySelector('.calendar__day.active');
        if (prev) prev.classList.remove('active');
        selectedDate = null;
    }

    // ─── Show Booking Form ─────────────────
    function showBookingForm(ev) {
        var area = document.getElementById('schedule-form-area');
        if (!area) return;

        area.innerHTML = ''
            + '<div class="event-card__form-divider"></div>'
            + '<h4 class="event-card__form-title">Запись на «' + ev.title + '»</h4>'
            + '<form class="form schedule-booking-form" novalidate>'
            + '  <div class="form__row">'
            + '    <div class="form__group">'
            + '      <label class="form__label" for="bf-name">ФИО *</label>'
            + '      <input class="form__input" type="text" id="bf-name" name="name" required placeholder="Иванов Иван Иванович">'
            + '      <span class="form__error" id="bf-name-error"></span>'
            + '    </div>'
            + '    <div class="form__group">'
            + '      <label class="form__label" for="bf-phone">Телефон *</label>'
            + '      <input class="form__input" type="tel" id="bf-phone" name="phone" required placeholder="+7 (___) ___-__-__">'
            + '      <span class="form__error" id="bf-phone-error"></span>'
            + '    </div>'
            + '  </div>'
            + '  <div class="form__group">'
            + '    <label class="form__label" for="bf-email">Email <span class="form__optional">(необязательно)</span></label>'
            + '    <input class="form__input" type="email" id="bf-email" name="email" placeholder="email@example.com">'
            + '    <span class="form__error" id="bf-email-error"></span>'
            + '  </div>'
            + '  <input type="hidden" name="event" value="' + ev.title + '">'
            + '  <input type="hidden" name="date" value="' + ev.date + '">'
            + '  <input type="hidden" name="time" value="' + ev.time + '">'
            + '  <input type="hidden" name="location" value="' + ev.location + '">'
            + '  <button class="btn btn--primary" type="submit">Отправить заявку</button>'
            + '</form>';

        area.style.display = 'block';

        // Animate
        try {
            if (typeof gsap !== 'undefined') {
                gsap.fromTo(area, { opacity: 0, y: 15 }, {
                    opacity: 1, y: 0, duration: 0.5, ease: 'power2.out'
                });
            }
        } catch (e) { /* non-critical */ }

        setTimeout(function () {
            area.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 100);

        // Form submit handler
        var form = area.querySelector('.schedule-booking-form');
        if (form) {
            form.addEventListener('submit', function (e) {
                e.preventDefault();
                handleBookingSubmit(e.target);
            });
        }
    }

    // ─── Booking Form Submit ───────────────
    function handleBookingSubmit(form) {
        var nameInput = form.querySelector('#bf-name');
        var phoneInput = form.querySelector('#bf-phone');
        var emailInput = form.querySelector('#bf-email');
        var valid = true;

        // Name (required)
        if (!nameInput.value.trim()) {
            setError(nameInput, 'bf-name-error', 'Введите ФИО');
            valid = false;
        } else {
            clearError(nameInput, 'bf-name-error');
        }

        // Phone (required)
        var phoneClean = phoneInput.value.replace(/[\s\-\(\)]/g, '');
        if (phoneClean.length < 10) {
            setError(phoneInput, 'bf-phone-error', 'Введите номер телефона');
            valid = false;
        } else {
            clearError(phoneInput, 'bf-phone-error');
        }

        // Email (optional)
        if (emailInput.value.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailInput.value)) {
            setError(emailInput, 'bf-email-error', 'Некорректный email');
            valid = false;
        } else if (emailInput.value.trim()) {
            clearError(emailInput, 'bf-email-error');
        }

        if (valid) {
            var data = new FormData(form);
            console.log('📋 Booking:', Object.fromEntries(data));

            var btn = form.querySelector('button[type="submit"]');
            btn.textContent = '✓ Заявка отправлена!';
            btn.style.background = '#6B9080';
            btn.disabled = true;

            try {
                if (typeof gsap !== 'undefined') {
                    gsap.from(btn, { scale: 0.95, duration: 0.3, ease: 'back.out(2)' });
                }
            } catch (e) { /* non-critical */ }

            setTimeout(function () { closeSchedule(); }, 2500);
        }
    }

    // ─── Error Helpers ─────────────────────
    function setError(input, errorId, msg) {
        input.classList.add('error');
        input.classList.remove('success');
        var el = document.getElementById(errorId);
        if (el) el.textContent = msg;
        try {
            if (typeof gsap !== 'undefined') {
                gsap.fromTo(input, { x: -5 }, { x: 0, duration: 0.4, ease: 'elastic.out(1,0.3)' });
            }
        } catch (e) { /* non-critical */ }
    }

    function clearError(input, errorId) {
        input.classList.remove('error');
        input.classList.add('success');
        var el = document.getElementById(errorId);
        if (el) el.textContent = '';
    }

    // ─── Month Navigation ─────────────────
    function initNav() {
        var prevBtn = document.getElementById('cal-prev');
        var nextBtn = document.getElementById('cal-next');

        if (prevBtn) {
            prevBtn.addEventListener('click', function () {
                currentMonth--;
                if (currentMonth < 0) { currentMonth = 11; currentYear--; }
                renderCalendar();
                closeSchedule();
            });
        }

        if (nextBtn) {
            nextBtn.addEventListener('click', function () {
                currentMonth++;
                if (currentMonth > 11) { currentMonth = 0; currentYear++; }
                renderCalendar();
                closeSchedule();
            });
        }
    }

    // ─── Init ──────────────────────────────
    function init() {
        try {
            renderCalendar();
            initNav();
            console.log('✅ Calendar initialized');
        } catch (e) {
            console.error('Calendar init error:', e);
        }
    }

    // Run on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
