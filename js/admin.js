// ═══════════════════════════════════════
// ARGILLA — Admin Panel Logic
// CRUD for products, events, promo codes
// ═══════════════════════════════════════

document.addEventListener('DOMContentLoaded', () => {
    // ─── Category Labels ───────────────────
    const categoryLabels = {
        brooch: 'Броши',
        earrings: 'Серьги',
        rings: 'Кольца',
        sets: 'Наборы'
    };

    // ─── Tab Switching ─────────────────────
    const tabButtons = document.querySelectorAll('.sidebar__link[data-tab]');
    const tabPanels = document.querySelectorAll('.tab-panel');

    tabButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            tabButtons.forEach(b => b.classList.remove('active'));
            tabPanels.forEach(p => p.classList.remove('active'));
            btn.classList.add('active');
            document.getElementById('panel-' + btn.dataset.tab).classList.add('active');
            // Close mobile sidebar
            document.getElementById('sidebar').classList.remove('open');
        });
    });

    // Mobile menu toggle
    const mobileBtn = document.getElementById('mobile-menu-btn');
    if (mobileBtn) {
        mobileBtn.addEventListener('click', () => {
            document.getElementById('sidebar').classList.toggle('open');
        });
    }

    // ─── Modal Helpers ─────────────────────
    const modalOverlay = document.getElementById('modal-overlay');
    const modalTitle = document.getElementById('modal-title');
    const modalBody = document.getElementById('modal-body');
    const modalFooter = document.getElementById('modal-footer');
    const modalCloseBtn = document.getElementById('modal-close');

    function openModal(title, bodyHTML, footerHTML) {
        modalTitle.textContent = title;
        modalBody.innerHTML = bodyHTML;
        modalFooter.innerHTML = footerHTML;
        modalOverlay.classList.add('open');
    }

    function closeModal() {
        modalOverlay.classList.remove('open');
    }

    modalCloseBtn.addEventListener('click', closeModal);
    modalOverlay.addEventListener('click', (e) => {
        if (e.target === modalOverlay) closeModal();
    });
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeModal();
    });

    // ─── Toast ─────────────────────────────
    const toastEl = document.getElementById('toast');
    let toastTimeout;

    function toast(message, type = 'success') {
        clearTimeout(toastTimeout);
        toastEl.className = 'toast toast--' + type;
        toastEl.textContent = message;
        // Force reflow
        toastEl.offsetHeight;
        toastEl.classList.add('show');
        toastTimeout = setTimeout(() => {
            toastEl.classList.remove('show');
        }, 3000);
    }

    // ═══════════════════════════════════════
    // PRODUCTS
    // ═══════════════════════════════════════

    function renderProductStats() {
        const products = ArgillaData.getProducts();
        const stats = document.getElementById('products-stats');
        const total = products.length;
        const withDiscount = products.filter(p => p.discount).length;
        const avgPrice = total ? Math.round(products.reduce((s, p) => s + p.price, 0) / total) : 0;

        stats.innerHTML = `
            <div class="stat-card">
                <div class="stat-card__label">Всего товаров</div>
                <div class="stat-card__value">${total}</div>
            </div>
            <div class="stat-card">
                <div class="stat-card__label">Со скидкой</div>
                <div class="stat-card__value">${withDiscount}</div>
            </div>
            <div class="stat-card">
                <div class="stat-card__label">Средняя цена</div>
                <div class="stat-card__value">${avgPrice.toLocaleString('ru-RU')} ₽</div>
            </div>
        `;
    }

    function renderProductsTable() {
        const products = ArgillaData.getProducts();
        const tbody = document.getElementById('products-tbody');

        if (products.length === 0) {
            tbody.innerHTML = `<tr><td colspan="6"><div class="empty-state"><p>Нет товаров</p><button class="btn btn--primary btn--sm" onclick="document.getElementById('btn-add-product').click()">Добавить первый товар</button></div></td></tr>`;
            return;
        }

        tbody.innerHTML = products.map(p => `
            <tr>
                <td><img src="${p.images[0] || ''}" alt="" class="table__thumb"></td>
                <td>
                    <div class="table__name">${p.name}</div>
                    <div class="table__sub">${(p.description || '').substring(0, 50)}…</div>
                </td>
                <td><span class="table__badge table__badge--${p.category}">${categoryLabels[p.category] || p.category}</span></td>
                <td>
                    <span class="table__price">${p.price.toLocaleString('ru-RU')} ₽</span>
                    ${p.oldPrice ? `<span class="table__old-price">${p.oldPrice.toLocaleString('ru-RU')} ₽</span>` : ''}
                </td>
                <td>${p.discount || '—'}</td>
                <td>
                    <div class="table__actions">
                        <button class="btn btn--ghost btn--icon" title="Редактировать" data-edit-product="${p.id}">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                        </button>
                        <button class="btn btn--danger btn--icon" title="Удалить" data-delete-product="${p.id}">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');

        // Attach handlers
        tbody.querySelectorAll('[data-edit-product]').forEach(btn => {
            btn.addEventListener('click', () => openProductForm(btn.dataset.editProduct));
        });
        tbody.querySelectorAll('[data-delete-product]').forEach(btn => {
            btn.addEventListener('click', () => confirmDeleteProduct(btn.dataset.deleteProduct));
        });
    }

    function getProductFormHTML(product) {
        const p = product || { id: '', category: 'brooch', name: '', description: '', images: [], price: '', oldPrice: '', discount: '' };
        const imagesItems = (p.images || []).map((img, i) =>
            `<span class="images-list__item"><img src="${img}" alt=""><span>${img.split('/').pop()}</span><button type="button" class="images-list__remove" data-remove-img="${i}">×</button></span>`
        ).join('');

        return `
            <form id="product-form">
                <input type="hidden" name="id" value="${p.id}">
                <div class="form-group">
                    <label class="form-label">Название</label>
                    <input class="form-input" name="name" value="${p.name}" placeholder="Брошь «Пион»" required>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label class="form-label">Категория</label>
                        <select class="form-select" name="category">
                            <option value="brooch" ${p.category === 'brooch' ? 'selected' : ''}>Броши</option>
                            <option value="earrings" ${p.category === 'earrings' ? 'selected' : ''}>Серьги</option>
                            <option value="rings" ${p.category === 'rings' ? 'selected' : ''}>Кольца</option>
                            <option value="sets" ${p.category === 'sets' ? 'selected' : ''}>Наборы</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Цена (₽)</label>
                        <input class="form-input" name="price" type="number" value="${p.price || ''}" placeholder="3200" required>
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label class="form-label">Старая цена (₽)</label>
                        <input class="form-input" name="oldPrice" type="number" value="${p.oldPrice || ''}" placeholder="Оставьте пустым, если нет">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Скидка</label>
                        <input class="form-input" name="discount" value="${p.discount || ''}" placeholder="-15%">
                    </div>
                </div>
                <div class="form-group">
                    <label class="form-label">Описание</label>
                    <textarea class="form-textarea" name="description" placeholder="Описание товара…">${p.description || ''}</textarea>
                </div>
                <div class="form-group">
                    <label class="form-label">Изображения</label>
                    <div class="images-list" id="product-images-list">${imagesItems}</div>
                    <div class="images-add">
                        <input class="form-input" id="new-image-path" placeholder="img/filename.png">
                        <button type="button" class="btn btn--secondary btn--sm" id="btn-add-image">Добавить</button>
                    </div>
                    <p class="form-help">Укажите путь к изображению относительно корня сайта</p>
                </div>
            </form>
        `;
    }

    // Temp storage for images being edited
    let editingImages = [];

    function openProductForm(productId) {
        const products = ArgillaData.getProducts();
        const product = productId ? products.find(p => p.id === productId) : null;
        const isEdit = !!product;

        editingImages = product ? [...product.images] : [];

        openModal(
            isEdit ? 'Редактировать товар' : 'Новый товар',
            getProductFormHTML(product),
            `<button class="btn btn--secondary" id="modal-cancel">Отмена</button>
             <button class="btn btn--primary" id="modal-save">Сохранить</button>`
        );

        // Setup images management
        setupImageHandlers();

        // Cancel
        document.getElementById('modal-cancel').addEventListener('click', closeModal);

        // Save
        document.getElementById('modal-save').addEventListener('click', () => {
            const form = document.getElementById('product-form');
            const name = form.querySelector('[name="name"]').value.trim();
            const price = parseInt(form.querySelector('[name="price"]').value);

            if (!name) { toast('Введите название', 'error'); return; }
            if (!price || price <= 0) { toast('Введите корректную цену', 'error'); return; }

            const oldPriceVal = form.querySelector('[name="oldPrice"]').value;
            const discountVal = form.querySelector('[name="discount"]').value.trim();

            const data = {
                id: form.querySelector('[name="id"]').value || ArgillaData.generateId('p'),
                category: form.querySelector('[name="category"]').value,
                name: name,
                description: form.querySelector('[name="description"]').value.trim(),
                images: editingImages.length > 0 ? editingImages : ['img/hero-brooch.png'],
                price: price,
                oldPrice: oldPriceVal ? parseInt(oldPriceVal) : null,
                discount: discountVal || null
            };

            const allProducts = ArgillaData.getProducts();
            if (isEdit) {
                const idx = allProducts.findIndex(p => p.id === data.id);
                if (idx !== -1) allProducts[idx] = data;
            } else {
                allProducts.push(data);
            }

            ArgillaData.saveProducts(allProducts);
            closeModal();
            refreshProducts();
            toast(isEdit ? 'Товар обновлён' : 'Товар добавлен');
        });
    }

    function setupImageHandlers() {
        // Remove image buttons
        document.querySelectorAll('[data-remove-img]').forEach(btn => {
            btn.addEventListener('click', () => {
                const idx = parseInt(btn.dataset.removeImg);
                editingImages.splice(idx, 1);
                reRenderImages();
            });
        });

        // Add image button
        const addImgBtn = document.getElementById('btn-add-image');
        const newImgInput = document.getElementById('new-image-path');
        if (addImgBtn) {
            addImgBtn.addEventListener('click', () => {
                const val = newImgInput.value.trim();
                if (val) {
                    editingImages.push(val);
                    newImgInput.value = '';
                    reRenderImages();
                }
            });
        }
    }

    function reRenderImages() {
        const list = document.getElementById('product-images-list');
        list.innerHTML = editingImages.map((img, i) =>
            `<span class="images-list__item"><img src="${img}" alt=""><span>${img.split('/').pop()}</span><button type="button" class="images-list__remove" data-remove-img="${i}">×</button></span>`
        ).join('');
        setupImageHandlers();
    }

    function confirmDeleteProduct(id) {
        const products = ArgillaData.getProducts();
        const product = products.find(p => p.id === id);
        if (!product) return;

        openModal(
            'Удалить товар?',
            `<p class="confirm-text">Вы уверены, что хотите удалить <strong>${product.name}</strong>? Это действие нельзя отменить.</p>`,
            `<button class="btn btn--secondary" id="modal-cancel">Отмена</button>
             <button class="btn btn--primary" style="background:var(--danger)" id="modal-confirm-delete">Удалить</button>`
        );

        document.getElementById('modal-cancel').addEventListener('click', closeModal);
        document.getElementById('modal-confirm-delete').addEventListener('click', () => {
            const updated = products.filter(p => p.id !== id);
            ArgillaData.saveProducts(updated);
            closeModal();
            refreshProducts();
            toast('Товар удалён');
        });
    }

    function refreshProducts() {
        renderProductStats();
        renderProductsTable();
    }

    document.getElementById('btn-add-product').addEventListener('click', () => openProductForm(null));

    // ═══════════════════════════════════════
    // EVENTS (Master Classes)
    // ═══════════════════════════════════════

    function renderEventStats() {
        const events = ArgillaData.getEvents();
        const stats = document.getElementById('events-stats');
        const total = events.length;
        const totalSlots = events.reduce((s, e) => s + (e.slots || 0), 0);
        const uniqueDates = [...new Set(events.map(e => e.date))].length;

        stats.innerHTML = `
            <div class="stat-card">
                <div class="stat-card__label">Всего МК</div>
                <div class="stat-card__value">${total}</div>
            </div>
            <div class="stat-card">
                <div class="stat-card__label">Дат в расписании</div>
                <div class="stat-card__value">${uniqueDates}</div>
            </div>
            <div class="stat-card">
                <div class="stat-card__label">Всего мест</div>
                <div class="stat-card__value">${totalSlots}</div>
            </div>
        `;
    }

    function renderEventsTable() {
        const events = ArgillaData.getEvents();
        const tbody = document.getElementById('events-tbody');

        if (events.length === 0) {
            tbody.innerHTML = `<tr><td colspan="8"><div class="empty-state"><p>Нет мастер-классов</p><button class="btn btn--primary btn--sm" onclick="document.getElementById('btn-add-event').click()">Добавить первый МК</button></div></td></tr>`;
            return;
        }

        tbody.innerHTML = events.map(e => {
            const dateObj = new Date(e.date + 'T00:00:00');
            const dateFormatted = dateObj.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
            return `
            <tr>
                <td><img src="${e.image || ''}" alt="" class="table__thumb"></td>
                <td>
                    <div class="table__name">${e.title}</div>
                    <div class="table__sub">${(e.description || '').substring(0, 40)}…</div>
                </td>
                <td>${dateFormatted}</td>
                <td>${e.time || ''}</td>
                <td><div class="table__sub">${e.location || ''}</div></td>
                <td>${e.slots || 0}</td>
                <td><span class="table__price">${e.price || ''}</span></td>
                <td>
                    <div class="table__actions">
                        <button class="btn btn--ghost btn--icon" title="Редактировать" data-edit-event="${e.id}">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                        </button>
                        <button class="btn btn--danger btn--icon" title="Удалить" data-delete-event="${e.id}">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
                        </button>
                    </div>
                </td>
            </tr>
            `;
        }).join('');

        // Attach handlers
        tbody.querySelectorAll('[data-edit-event]').forEach(btn => {
            btn.addEventListener('click', () => openEventForm(btn.dataset.editEvent));
        });
        tbody.querySelectorAll('[data-delete-event]').forEach(btn => {
            btn.addEventListener('click', () => confirmDeleteEvent(btn.dataset.deleteEvent));
        });
    }

    function getEventFormHTML(ev) {
        const e = ev || { id: '', date: '', title: '', description: '', image: '', time: '', location: '', slots: '', price: '' };
        return `
            <form id="event-form">
                <input type="hidden" name="id" value="${e.id}">
                <div class="form-group">
                    <label class="form-label">Название</label>
                    <input class="form-input" name="title" value="${e.title}" placeholder="МК «Весенний букет»" required>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label class="form-label">Дата</label>
                        <input class="form-input" name="date" type="date" value="${e.date}" required>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Время</label>
                        <input class="form-input" name="time" value="${e.time}" placeholder="14:00 — 17:00">
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label class="form-label">Кол-во мест</label>
                        <input class="form-input" name="slots" type="number" value="${e.slots || ''}" placeholder="8">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Цена</label>
                        <input class="form-input" name="price" value="${e.price}" placeholder="2 800 ₽">
                    </div>
                </div>
                <div class="form-group">
                    <label class="form-label">Место проведения</label>
                    <input class="form-input" name="location" value="${e.location}" placeholder="ул. Творческая, 12, Студия ARGILLA">
                </div>
                <div class="form-group">
                    <label class="form-label">Описание</label>
                    <textarea class="form-textarea" name="description" placeholder="Описание мастер-класса…">${e.description || ''}</textarea>
                </div>
                <div class="form-group">
                    <label class="form-label">Изображение</label>
                    <input class="form-input" name="image" value="${e.image}" placeholder="img/hero-brooch.png">
                    <p class="form-help">Путь к изображению относительно корня сайта</p>
                </div>
            </form>
        `;
    }

    function openEventForm(eventId) {
        const events = ArgillaData.getEvents();
        const ev = eventId ? events.find(e => e.id === eventId) : null;
        const isEdit = !!ev;

        openModal(
            isEdit ? 'Редактировать МК' : 'Новый мастер-класс',
            getEventFormHTML(ev),
            `<button class="btn btn--secondary" id="modal-cancel">Отмена</button>
             <button class="btn btn--primary" id="modal-save">Сохранить</button>`
        );

        document.getElementById('modal-cancel').addEventListener('click', closeModal);
        document.getElementById('modal-save').addEventListener('click', () => {
            const form = document.getElementById('event-form');
            const title = form.querySelector('[name="title"]').value.trim();
            const date = form.querySelector('[name="date"]').value;

            if (!title) { toast('Введите название', 'error'); return; }
            if (!date) { toast('Выберите дату', 'error'); return; }

            const data = {
                id: form.querySelector('[name="id"]').value || ArgillaData.generateId('e'),
                date: date,
                title: title,
                description: form.querySelector('[name="description"]').value.trim(),
                image: form.querySelector('[name="image"]').value.trim() || 'img/hero-brooch.png',
                time: form.querySelector('[name="time"]').value.trim(),
                location: form.querySelector('[name="location"]').value.trim(),
                slots: parseInt(form.querySelector('[name="slots"]').value) || 0,
                price: form.querySelector('[name="price"]').value.trim()
            };

            const allEvents = ArgillaData.getEvents();
            if (isEdit) {
                const idx = allEvents.findIndex(e => e.id === data.id);
                if (idx !== -1) allEvents[idx] = data;
            } else {
                allEvents.push(data);
            }

            ArgillaData.saveEvents(allEvents);
            closeModal();
            refreshEvents();
            toast(isEdit ? 'МК обновлён' : 'МК добавлен');
        });
    }

    function confirmDeleteEvent(id) {
        const events = ArgillaData.getEvents();
        const ev = events.find(e => e.id === id);
        if (!ev) return;

        openModal(
            'Удалить мастер-класс?',
            `<p class="confirm-text">Вы уверены, что хотите удалить <strong>${ev.title}</strong>?</p>`,
            `<button class="btn btn--secondary" id="modal-cancel">Отмена</button>
             <button class="btn btn--primary" style="background:var(--danger)" id="modal-confirm-delete">Удалить</button>`
        );

        document.getElementById('modal-cancel').addEventListener('click', closeModal);
        document.getElementById('modal-confirm-delete').addEventListener('click', () => {
            const updated = events.filter(e => e.id !== id);
            ArgillaData.saveEvents(updated);
            closeModal();
            refreshEvents();
            toast('МК удалён');
        });
    }

    function refreshEvents() {
        renderEventStats();
        renderEventsTable();
    }

    document.getElementById('btn-add-event').addEventListener('click', () => openEventForm(null));

    // ═══════════════════════════════════════
    // PROMO CODES
    // ═══════════════════════════════════════

    function renderPromoStats() {
        const promos = ArgillaData.getPromoCodes();
        const stats = document.getElementById('promos-stats');
        const total = promos.length;
        const percent = promos.filter(p => p.type === 'percent').length;
        const fixed = promos.filter(p => p.type === 'fixed').length;

        stats.innerHTML = `
            <div class="stat-card">
                <div class="stat-card__label">Всего промокодов</div>
                <div class="stat-card__value">${total}</div>
            </div>
            <div class="stat-card">
                <div class="stat-card__label">Процентных</div>
                <div class="stat-card__value">${percent}</div>
            </div>
            <div class="stat-card">
                <div class="stat-card__label">Фиксированных</div>
                <div class="stat-card__value">${fixed}</div>
            </div>
        `;
    }

    function renderPromosTable() {
        const promos = ArgillaData.getPromoCodes();
        const tbody = document.getElementById('promos-tbody');

        if (promos.length === 0) {
            tbody.innerHTML = `<tr><td colspan="4"><div class="empty-state"><p>Нет промокодов</p><button class="btn btn--primary btn--sm" onclick="document.getElementById('btn-add-promo').click()">Добавить первый промокод</button></div></td></tr>`;
            return;
        }

        tbody.innerHTML = promos.map(p => `
            <tr>
                <td><span class="table__name" style="font-family:monospace;letter-spacing:0.1em">${p.code}</span></td>
                <td><span class="table__badge table__badge--${p.type}">${p.type === 'percent' ? 'Процент' : 'Фиксированная'}</span></td>
                <td><span class="table__price">${p.type === 'percent' ? p.value + '%' : p.value + ' ₽'}</span></td>
                <td>
                    <div class="table__actions">
                        <button class="btn btn--ghost btn--icon" title="Редактировать" data-edit-promo="${p.id}">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                        </button>
                        <button class="btn btn--danger btn--icon" title="Удалить" data-delete-promo="${p.id}">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');

        tbody.querySelectorAll('[data-edit-promo]').forEach(btn => {
            btn.addEventListener('click', () => openPromoForm(btn.dataset.editPromo));
        });
        tbody.querySelectorAll('[data-delete-promo]').forEach(btn => {
            btn.addEventListener('click', () => confirmDeletePromo(btn.dataset.deletePromo));
        });
    }

    function getPromoFormHTML(promo) {
        const p = promo || { id: '', code: '', type: 'percent', value: '', label: '' };
        return `
            <form id="promo-form">
                <input type="hidden" name="id" value="${p.id}">
                <div class="form-group">
                    <label class="form-label">Код промокода</label>
                    <input class="form-input" name="code" value="${p.code}" placeholder="SPRING15" style="text-transform:uppercase" required>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label class="form-label">Тип скидки</label>
                        <select class="form-select" name="type" id="promo-type-select">
                            <option value="percent" ${p.type === 'percent' ? 'selected' : ''}>Процент (%)</option>
                            <option value="fixed" ${p.type === 'fixed' ? 'selected' : ''}>Фиксированная (₽)</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Значение</label>
                        <input class="form-input" name="value" type="number" value="${p.value || ''}" placeholder="15" required>
                    </div>
                </div>
            </form>
        `;
    }

    function openPromoForm(promoId) {
        const promos = ArgillaData.getPromoCodes();
        const promo = promoId ? promos.find(p => p.id === promoId) : null;
        const isEdit = !!promo;

        openModal(
            isEdit ? 'Редактировать промокод' : 'Новый промокод',
            getPromoFormHTML(promo),
            `<button class="btn btn--secondary" id="modal-cancel">Отмена</button>
             <button class="btn btn--primary" id="modal-save">Сохранить</button>`
        );

        document.getElementById('modal-cancel').addEventListener('click', closeModal);
        document.getElementById('modal-save').addEventListener('click', () => {
            const form = document.getElementById('promo-form');
            const code = form.querySelector('[name="code"]').value.trim().toUpperCase();
            const value = parseInt(form.querySelector('[name="value"]').value);
            const type = form.querySelector('[name="type"]').value;

            if (!code) { toast('Введите код', 'error'); return; }
            if (!value || value <= 0) { toast('Введите значение скидки', 'error'); return; }

            const label = type === 'percent' ? value + '%' : value + ' ₽';

            const data = {
                id: form.querySelector('[name="id"]').value || ArgillaData.generateId('promo'),
                code: code,
                type: type,
                value: value,
                label: label
            };

            const allPromos = ArgillaData.getPromoCodes();

            // Check for duplicate codes (excluding current one being edited)
            const duplicate = allPromos.find(p => p.code === data.code && p.id !== data.id);
            if (duplicate) { toast('Промокод с таким кодом уже существует', 'error'); return; }

            if (isEdit) {
                const idx = allPromos.findIndex(p => p.id === data.id);
                if (idx !== -1) allPromos[idx] = data;
            } else {
                allPromos.push(data);
            }

            ArgillaData.savePromoCodes(allPromos);
            closeModal();
            refreshPromos();
            toast(isEdit ? 'Промокод обновлён' : 'Промокод добавлен');
        });
    }

    function confirmDeletePromo(id) {
        const promos = ArgillaData.getPromoCodes();
        const promo = promos.find(p => p.id === id);
        if (!promo) return;

        openModal(
            'Удалить промокод?',
            `<p class="confirm-text">Вы уверены, что хотите удалить промокод <strong>${promo.code}</strong>?</p>`,
            `<button class="btn btn--secondary" id="modal-cancel">Отмена</button>
             <button class="btn btn--primary" style="background:var(--danger)" id="modal-confirm-delete">Удалить</button>`
        );

        document.getElementById('modal-cancel').addEventListener('click', closeModal);
        document.getElementById('modal-confirm-delete').addEventListener('click', () => {
            const updated = promos.filter(p => p.id !== id);
            ArgillaData.savePromoCodes(updated);
            closeModal();
            refreshPromos();
            toast('Промокод удалён');
        });
    }

    function refreshPromos() {
        renderPromoStats();
        renderPromosTable();
    }

    document.getElementById('btn-add-promo').addEventListener('click', () => openPromoForm(null));

    // ═══════════════════════════════════════
    // EXPORT / IMPORT / RESET
    // ═══════════════════════════════════════

    // Export
    document.getElementById('btn-export').addEventListener('click', () => {
        const json = ArgillaData.exportData();
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'argilla-data-' + new Date().toISOString().split('T')[0] + '.json';
        a.click();
        URL.revokeObjectURL(url);
        toast('Данные экспортированы');
    });

    // Import
    const importFile = document.getElementById('import-file');
    document.getElementById('btn-import').addEventListener('click', () => {
        importFile.click();
    });

    importFile.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (ev) => {
            const success = ArgillaData.importData(ev.target.result);
            if (success) {
                refreshAll();
                toast('Данные импортированы');
            } else {
                toast('Ошибка импорта — неверный формат файла', 'error');
            }
        };
        reader.readAsText(file);
        importFile.value = '';
    });

    // Reset
    document.getElementById('btn-reset').addEventListener('click', () => {
        openModal(
            'Сбросить данные?',
            `<p class="confirm-text">Все изменения будут потеряны. Данные вернутся к исходным значениям. Это действие нельзя отменить.</p>`,
            `<button class="btn btn--secondary" id="modal-cancel">Отмена</button>
             <button class="btn btn--primary" style="background:var(--danger)" id="modal-confirm-delete">Сбросить</button>`
        );

        document.getElementById('modal-cancel').addEventListener('click', closeModal);
        document.getElementById('modal-confirm-delete').addEventListener('click', () => {
            ArgillaData.resetAll();
            closeModal();
            refreshAll();
            toast('Данные сброшены к дефолту');
        });
    });

    // ─── Refresh All ───────────────────────
    function refreshAll() {
        refreshProducts();
        refreshEvents();
        refreshPromos();
    }

    // ─── Initial Render ────────────────────
    refreshAll();
    console.log('✅ Admin panel initialized');
});
