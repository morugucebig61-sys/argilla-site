// ═══════════════════════════════════════
// ARGILLA — Main JS (GSAP + Lenis)
// ═══════════════════════════════════════

document.addEventListener('DOMContentLoaded', () => {
    // ─── Lenis Smooth Scroll ───────────────
    const lenis = new Lenis({
        duration: 1.2,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        orientation: 'vertical',
        smoothWheel: true
    });

    function raf(time) {
        lenis.raf(time);
        requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    // Connect Lenis to GSAP ScrollTrigger
    lenis.on('scroll', ScrollTrigger.update);

    gsap.ticker.add((time) => {
        lenis.raf(time * 1000);
    });

    gsap.ticker.lagSmoothing(0);

    // ─── Register GSAP Plugins ─────────────
    gsap.registerPlugin(ScrollTrigger);

    // ─── Navigation Scroll Effect ──────────
    const nav = document.getElementById('nav');
    window.addEventListener('scroll', () => {
        nav.classList.toggle('scrolled', window.scrollY > 60);
    });

    // ─── Mobile Menu Toggle ────────────────
    const burger = document.getElementById('nav-burger');
    const menu = document.querySelector('.nav__menu');

    burger.addEventListener('click', () => {
        menu.classList.toggle('open');
    });

    // Close menu on link click
    document.querySelectorAll('.nav__link').forEach(link => {
        link.addEventListener('click', () => menu.classList.remove('open'));
    });

    // ─── Hero: SplitText-like Animation ────
    // Manual character splitting (no premium SplitText plugin needed)
    const heroTitle = document.getElementById('hero-title');
    if (heroTitle) {
        const text = heroTitle.textContent;
        heroTitle.innerHTML = '';

        // Split into words, then chars
        const words = text.split(' ');
        words.forEach((word, wordIndex) => {
            const wordSpan = document.createElement('span');
            wordSpan.style.display = 'inline-block';
            wordSpan.style.whiteSpace = 'nowrap';

            for (let i = 0; i < word.length; i++) {
                const charSpan = document.createElement('span');
                charSpan.className = 'char';
                charSpan.textContent = word[i];
                wordSpan.appendChild(charSpan);
            }

            heroTitle.appendChild(wordSpan);

            // Add space between words (not after last)
            if (wordIndex < words.length - 1) {
                const space = document.createElement('span');
                space.innerHTML = '&nbsp;';
                space.style.display = 'inline-block';
                heroTitle.appendChild(space);
            }
        });

        // Animate chars
        const chars = heroTitle.querySelectorAll('.char');
        gsap.set(chars, { opacity: 0, y: 40 });

        gsap.to(chars, {
            opacity: 1,
            y: 0,
            duration: 0.6,
            ease: 'power3.out',
            stagger: {
                each: 0.04,
                from: 'start'
            },
            delay: 0.5
        });
    }

    // ─── Hero: Video Zoom on Scroll ────────
    const heroVideo = document.getElementById('hero-video');
    if (heroVideo) {
        // Playlist of possible hero videos — add more files here.
        // The code will cycle through them and restart automatically.
        const heroVideoSources = [
            'img/hero-video.mp4',
            // 'img/hero-video-2.mp4',
            // 'img/hero-video-3.mp4'
        ];
        let currentHeroIndex = 0;

        const hideHeroVideo = () => {
            heroVideo.style.display = 'none';
            heroVideo.pause();
            heroVideo.removeAttribute('src');
            heroVideo.load();
        };

        const setHeroSource = (index) => {
            if (!heroVideoSources[index]) return;
            heroVideo.src = heroVideoSources[index];
            heroVideo.load();
        };

        const playHeroVideo = () => {
            heroVideo.play().catch(() => {
                // Autoplay might be blocked until user interaction.
            });
        };

        heroVideo.addEventListener('error', () => {
            console.warn('Hero video failed to load. Hiding video background.');
            hideHeroVideo();
        });

        heroVideo.addEventListener('ended', () => {
            currentHeroIndex = (currentHeroIndex + 1) % heroVideoSources.length;
            setHeroSource(currentHeroIndex);
            playHeroVideo();
        });

        // If the video pauses unexpectedly (buffering/visibility), try resuming.
        heroVideo.addEventListener('pause', () => {
            if (!heroVideo.ended) {
                setTimeout(playHeroVideo, 200);
            }
        });

        // Initialize.
        setHeroSource(currentHeroIndex);
        playHeroVideo();

        gsap.to(heroVideo, {
            scale: 1.15,
            ease: 'none',
            scrollTrigger: {
                trigger: '.hero',
                start: 'top top',
                end: 'bottom top',
                scrub: 1
            }
        });
    }

    // ─── Hero: Parallax scroll-out ─────────
    gsap.to('.hero__content', {
        y: -80,
        opacity: 0,
        ease: 'none',
        scrollTrigger: {
            trigger: '.hero',
            start: '60% top',
            end: 'bottom top',
            scrub: 1
        }
    });

    // ─── Scroll Indicator Fade ─────────────
    gsap.to('.hero__scroll-indicator', {
        opacity: 0,
        ease: 'none',
        scrollTrigger: {
            trigger: '.hero',
            start: '20% top',
            end: '40% top',
            scrub: 1
        }
    });

    // ─── Universal Reveal Animation ────────
    const revealElements = document.querySelectorAll('.reveal');

    revealElements.forEach((el) => {
        gsap.to(el, {
            opacity: 1,
            y: 0,
            duration: 1,
            ease: 'power2.out',
            scrollTrigger: {
                trigger: el,
                start: 'top 85%',
                end: 'top 60%',
                toggleActions: 'play none none none'
            }
        });
    });

    // ─── About Stats Counter Animation ─────
    const statNumbers = document.querySelectorAll('.about__stat-number');
    statNumbers.forEach(stat => {
        const text = stat.textContent;
        const number = parseInt(text);
        const suffix = text.replace(/[0-9]/g, '');

        gsap.from(stat, {
            textContent: 0,
            duration: 2,
            ease: 'power1.out',
            snap: { textContent: 1 },
            scrollTrigger: {
                trigger: stat,
                start: 'top 85%',
                toggleActions: 'play none none none'
            },
            onUpdate: function () {
                stat.textContent = Math.round(gsap.getProperty(stat, 'textContent')) + suffix;
            }
        });

        // Reset text after GSAP setup
        stat.textContent = text;
    });

    // ─── Gallery Lightbox ──────────────────
    const lightbox = document.getElementById('lightbox');
    const lightboxImage = document.getElementById('lightbox-image');
    const lightboxClose = document.getElementById('lightbox-close');

    document.querySelectorAll('.gallery__item').forEach(item => {
        item.addEventListener('click', () => {
            const img = item.querySelector('img');
            lightboxImage.src = img.src;
            lightboxImage.alt = img.alt;
            lightbox.classList.add('open');
            lenis.stop();
        });
    });

    function closeLightbox() {
        lightbox.classList.remove('open');
        lenis.start();
    }

    lightboxClose.addEventListener('click', closeLightbox);
    lightbox.addEventListener('click', (e) => {
        if (e.target === lightbox) closeLightbox();
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeLightbox();
            // Close cart panel if open
            const cartPanel = document.getElementById('cart-panel');
            if (cartPanel) cartPanel.classList.remove('open');
            lenis.start();
        }
    });

    // ─── Calendar Section GSAP ─────────────
    // Calendar widget entrance animation
    gsap.fromTo('#calendar-widget', {
        scale: 0.95,
        opacity: 0
    }, {
        scale: 1,
        opacity: 1,
        duration: 1,
        ease: 'power2.out',
        scrollTrigger: {
            trigger: '#calendar-widget',
            start: 'top 85%',
            toggleActions: 'play none none none'
        }
    });
});

