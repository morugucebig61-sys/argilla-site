// ═══════════════════════════════════════
// ARGILLA — Shop v2 (Data-Driven)
// Product cards with Swiper galleries,
// descriptions, prices, discounts
// ═══════════════════════════════════════

document.addEventListener('DOMContentLoaded', () => {
    // ─── Product Data (from ArgillaData) ───
    const products = window.ArgillaData ? ArgillaData.getProducts() : [];

    // Make products accessible globally for cart
    window.__argillaProducts = products;

    // ─── Render Product Cards ──────────────
    const shopGrid = document.getElementById('shop-grid');

    function renderProducts(filter = 'all') {
        shopGrid.innerHTML = '';

        const filtered = filter === 'all' ? products : products.filter(p => p.category === filter);

        filtered.forEach((product, index) => {
            const card = document.createElement('div');
            card.className = 'product-card reveal';
            card.dataset.category = product.category;
            card.dataset.id = product.id;

            // Build slides HTML
            const slides = product.images.map(img =>
                `<div class="swiper-slide"><img src="${img}" alt="${product.name}" loading="lazy"></div>`
            ).join('');

            // Build price HTML
            let priceHTML = `<span class="product-card__price">${product.price.toLocaleString('ru-RU')} ₽</span>`;
            if (product.oldPrice) {
                priceHTML += `<span class="product-card__old-price">${product.oldPrice.toLocaleString('ru-RU')} ₽</span>`;
            }

            // Badge
            const badgeHTML = product.discount
                ? `<span class="product-card__badge">${product.discount}</span>`
                : '';

            card.innerHTML = `
        <div class="product-card__slider">
          ${badgeHTML}
          <div class="swiper swiper-product-${product.id}">
            <div class="swiper-wrapper">${slides}</div>
            <div class="swiper-pagination"></div>
          </div>
        </div>
        <div class="product-card__body">
          <h3 class="product-card__name">${product.name}</h3>
          <p class="product-card__desc">${product.description}</p>
          <div class="product-card__price-row">${priceHTML}</div>
          <button class="product-card__cart-btn" data-product-id="${product.id}">В корзину</button>
        </div>
      `;

            shopGrid.appendChild(card);

            // Initialize Swiper for this card
            setTimeout(() => {
                new Swiper(`.swiper-product-${product.id}`, {
                    loop: product.images.length > 1,
                    pagination: {
                        el: `.swiper-product-${product.id} .swiper-pagination`,
                        clickable: true
                    },
                    grabCursor: true,
                    speed: 400
                });
            }, 50);

            // Animate in
            gsap.fromTo(card, {
                opacity: 0,
                y: 40
            }, {
                opacity: 1,
                y: 0,
                duration: 0.6,
                ease: 'power2.out',
                delay: index * 0.1,
                scrollTrigger: {
                    trigger: card,
                    start: 'top 90%',
                    toggleActions: 'play none none none'
                }
            });
        });

        // Attach cart button handlers
        shopGrid.querySelectorAll('.product-card__cart-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const productId = btn.dataset.productId;
                const product = products.find(p => p.id === productId);
                if (product && window.__argillaCart) {
                    window.__argillaCart.addItem(product);

                    // Visual feedback
                    const original = btn.textContent;
                    btn.textContent = '✓ Добавлено';
                    btn.style.background = '#6B9080';
                    btn.style.color = '#fff';
                    gsap.from(btn, { scale: 0.9, duration: 0.3, ease: 'back.out(2)' });

                    setTimeout(() => {
                        btn.textContent = original;
                        btn.style.background = '';
                        btn.style.color = '';
                    }, 1200);
                }
            });
        });
    }

    // ─── Filter Logic ──────────────────────
    const filterButtons = document.querySelectorAll('.shop__filter');

    filterButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            filterButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            renderProducts(btn.dataset.filter);
        });
    });

    // ─── Initial Render ────────────────────
    renderProducts();
});
