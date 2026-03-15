// ═══════════════════════════════════════
// ARGILLA — Smart Form Validation
// ═══════════════════════════════════════

document.addEventListener('DOMContentLoaded', () => {
    const corporateForm = document.getElementById('corporate-form');

    if (!corporateForm) return;

    // ─── Real-time Validation on Blur ──────
    const inputs = corporateForm.querySelectorAll('.form__input');
    inputs.forEach(input => {
        input.addEventListener('blur', () => validateField(input));
        input.addEventListener('input', () => {
            // Clear error state on typing
            if (input.classList.contains('error')) {
                input.classList.remove('error');
                const errorEl = input.parentElement.querySelector('.form__error');
                if (errorEl) errorEl.textContent = '';
            }
        });
    });

    // ─── Form Submit ───────────────────────
    corporateForm.addEventListener('submit', (e) => {
        e.preventDefault();
        let isValid = true;

        // Validate all required fields
        const name = document.getElementById('corp-name');
        const phone = document.getElementById('corp-phone');
        const guests = document.getElementById('corp-guests');
        const date = document.getElementById('corp-date');

        if (!validateRequired(name, 'corp-name-error', 'Введите ваше имя')) isValid = false;
        if (!validatePhone(phone, 'corp-phone-error')) isValid = false;
        if (!validateGuests(guests, 'corp-guests-error')) isValid = false;
        if (!validateRequired(date, 'corp-date-error', 'Выберите дату')) isValid = false;

        if (isValid) {
            const formData = new FormData(corporateForm);
            const data = Object.fromEntries(formData);
            console.log('📋 Corporate Request Submitted:', data);

            // Success feedback
            const btn = corporateForm.querySelector('button[type="submit"]');
            btn.textContent = '✓ Заявка отправлена!';
            btn.style.background = '#6B9080';
            btn.disabled = true;

            gsap.from(btn, {
                scale: 0.95,
                duration: 0.3,
                ease: 'back.out(2)'
            });

            // Reset form after delay
            setTimeout(() => {
                corporateForm.reset();
                btn.textContent = 'Отправить заявку';
                btn.style.background = '';
                btn.disabled = false;
                inputs.forEach(input => {
                    input.classList.remove('success', 'error');
                });
            }, 3000);
        }
    });

    // ─── Validation Helpers ────────────────
    function validateField(input) {
        switch (input.id) {
            case 'corp-name':
                validateRequired(input, 'corp-name-error', 'Введите ваше имя');
                break;
            case 'corp-phone':
                validatePhone(input, 'corp-phone-error');
                break;
            case 'corp-guests':
                validateGuests(input, 'corp-guests-error');
                break;
            case 'corp-date':
                validateRequired(input, 'corp-date-error', 'Выберите дату');
                break;
        }
    }

    function validateRequired(input, errorId, message) {
        if (!input.value.trim()) {
            showError(input, errorId, message);
            return false;
        }
        clearError(input, errorId);
        return true;
    }

    function validatePhone(input, errorId) {
        if (!input.value.trim()) {
            showError(input, errorId, 'Введите номер телефона');
            return false;
        }
        const phoneRegex = /^[\+]?[0-9\s\-\(\)]{10,}$/;
        if (!phoneRegex.test(input.value)) {
            showError(input, errorId, 'Введите корректный номер');
            return false;
        }
        clearError(input, errorId);
        return true;
    }

    function validateGuests(input, errorId) {
        if (!input.value) return true; // optional
        const val = parseInt(input.value);
        if (val < 5 || val > 30) {
            showError(input, errorId, 'От 5 до 30 человек');
            return false;
        }
        clearError(input, errorId);
        return true;
    }

    function showError(input, errorId, message) {
        input.classList.add('error');
        input.classList.remove('success');
        const errorEl = document.getElementById(errorId);
        if (errorEl) errorEl.textContent = message;

        gsap.fromTo(input, { x: -4 }, {
            x: 0,
            duration: 0.4,
            ease: 'elastic.out(1, 0.3)'
        });
    }

    function clearError(input, errorId) {
        input.classList.remove('error');
        input.classList.add('success');
        const errorEl = document.getElementById(errorId);
        if (errorEl) errorEl.textContent = '';
    }
});
