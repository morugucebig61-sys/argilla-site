// ═══════════════════════════════════════
// ARGILLA — Shopping Cart
// Sidebar cart with promo codes
// ═══════════════════════════════════════

document.addEventListener('DOMContentLoaded', () => {
    // ─── Promo Codes (from ArgillaData) ────
    const promoCodes = window.ArgillaData ? ArgillaData.getPromoCodesMap() : {};

    // ─── Cart State ────────────────────────
    let cartItems = []; // { product, qty }
    let appliedPromo = null;

    // ─── DOM Elements ──────────────────────
    const cartPanel = document.getElementById('cart-panel');
    const cartOverlay = document.getElementById('cart-overlay');
    const cartClose = document.getElementById('cart-close');
    const cartToggle = document.getElementById('cart-toggle');
    const cartBadge = document.getElementById('cart-badge');
    const cartItemsEl = document.getElementById('cart-items');
    const cartEmpty = document.getElementById('cart-empty');
    const cartFooter = document.getElementById('cart-footer');
    const cartTotal = document.getElementById('cart-total');
    const cartDiscount = document.getElementById('cart-discount');
    const cartDiscountAmount = document.getElementById('cart-discount-amount');
    const promoInput = document.getElementById('promo-input');
    const promoApply = document.getElementById('promo-apply');
    const cartCheckout = document.getElementById('cart-checkout');

    // ─── Cart API (exposed globally) ───────
    const cart = {
        addItem(product) {
            const existing = cartItems.find(item => item.product.id === product.id);
            if (existing) {
                existing.qty++;
            } else {
                cartItems.push({ product, qty: 1 });
            }
            renderCart();
            openCart();
        },

        removeItem(productId) {
            cartItems = cartItems.filter(item => item.product.id !== productId);
            renderCart();
        },

        getTotal() {
            return cartItems.reduce((sum, item) => sum + item.product.price * item.qty, 0);
        },

        getDiscount() {
            if (!appliedPromo) return 0;
            const total = this.getTotal();
            if (appliedPromo.type === 'percent') {
                return Math.round(total * appliedPromo.value / 100);
            }
            return Math.min(appliedPromo.value, total);
        }
    };

    window.__argillaCart = cart;

    // ─── Render Cart ───────────────────────
    function renderCart() {
        // Update badge
        const totalItems = cartItems.reduce((sum, item) => sum + item.qty, 0);
        if (totalItems > 0) {
            cartBadge.textContent = totalItems;
            cartBadge.style.display = 'flex';
        } else {
            cartBadge.style.display = 'none';
        }

        // Render items
        // First, remove old cart-item elements (keep empty placeholder)
        cartItemsEl.querySelectorAll('.cart-item').forEach(el => el.remove());

        if (cartItems.length === 0) {
            cartEmpty.style.display = 'flex';
            cartFooter.style.display = 'none';
            return;
        }

        cartEmpty.style.display = 'none';
        cartFooter.style.display = 'block';

        cartItems.forEach(item => {
            const el = document.createElement('div');
            el.className = 'cart-item';

            let pricesHTML = `<span class="cart-item__price">${item.product.price.toLocaleString('ru-RU')} ₽</span>`;
            if (item.product.oldPrice) {
                pricesHTML += `<span class="cart-item__old-price">${item.product.oldPrice.toLocaleString('ru-RU')} ₽</span>`;
            }

            el.innerHTML = `
        <img src="${item.product.images[0]}" alt="${item.product.name}" class="cart-item__image">
        <div class="cart-item__info">
          <div class="cart-item__name">${item.product.name}${item.qty > 1 ? ` × ${item.qty}` : ''}</div>
          <div class="cart-item__prices">${pricesHTML}</div>
        </div>
        <button class="cart-item__remove" data-id="${item.product.id}" aria-label="Удалить">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
        </button>
      `;

            cartItemsEl.appendChild(el);

            // Animate
            gsap.from(el, { opacity: 0, x: 20, duration: 0.3, ease: 'power2.out' });
        });

        // Remove handlers
        cartItemsEl.querySelectorAll('.cart-item__remove').forEach(btn => {
            btn.addEventListener('click', () => {
                cart.removeItem(btn.dataset.id);
            });
        });

        // Update totals
        updateTotals();
    }

    function updateTotals() {
        const total = cart.getTotal();
        const discount = cart.getDiscount();
        const finalTotal = total - discount;

        if (discount > 0) {
            cartDiscount.style.display = 'flex';
            cartDiscountAmount.textContent = `−${discount.toLocaleString('ru-RU')} ₽`;
        } else {
            cartDiscount.style.display = 'none';
        }

        cartTotal.textContent = `${finalTotal.toLocaleString('ru-RU')} ₽`;
    }

    // ─── Open / Close Cart ─────────────────
    function openCart() {
        cartPanel.classList.add('open');
    }

    function closeCart() {
        cartPanel.classList.remove('open');
    }

    cartToggle.addEventListener('click', () => {
        cartPanel.classList.contains('open') ? closeCart() : openCart();
    });

    cartClose.addEventListener('click', closeCart);
    cartOverlay.addEventListener('click', closeCart);

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && cartPanel.classList.contains('open')) {
            closeCart();
        }
    });

    // ─── Promo Code ────────────────────────
    promoApply.addEventListener('click', () => {
        const code = promoInput.value.trim().toUpperCase();
        const promo = promoCodes[code];

        if (promo) {
            appliedPromo = promo;
            promoInput.classList.remove('error');
            promoInput.classList.add('success');
            promoInput.value = `✓ ${code} (−${promo.label})`;
            promoInput.disabled = true;
            promoApply.textContent = '✓';
            promoApply.disabled = true;
            updateTotals();

            gsap.from(promoInput, { scale: 0.95, duration: 0.3, ease: 'back.out(2)' });
        } else {
            promoInput.classList.add('error');
            gsap.fromTo(promoInput, { x: -4 }, { x: 0, duration: 0.4, ease: 'elastic.out(1, 0.3)' });
        }
    });

    promoInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            promoApply.click();
        }
    });

    // ─── Checkout ──────────────────────────
    cartCheckout.addEventListener('click', () => {
        const total = cart.getTotal() - cart.getDiscount();
        console.log('🛒 Checkout:', {
            items: cartItems.map(i => ({ name: i.product.name, qty: i.qty, price: i.product.price })),
            promo: appliedPromo ? promoInput.value : null,
            total
        });

        cartCheckout.textContent = '✓ Заказ оформлен!';
        cartCheckout.style.background = '#6B9080';
        cartCheckout.disabled = true;

        gsap.from(cartCheckout, { scale: 0.95, duration: 0.3, ease: 'back.out(2)' });

        setTimeout(() => {
            cartItems = [];
            appliedPromo = null;
            promoInput.value = '';
            promoInput.disabled = false;
            promoInput.classList.remove('success', 'error');
            promoApply.textContent = 'Применить';
            promoApply.disabled = false;
            cartCheckout.textContent = 'Оформить заказ';
            cartCheckout.style.background = '';
            cartCheckout.disabled = false;
            renderCart();
            closeCart();
        }, 2000);
    });
});
