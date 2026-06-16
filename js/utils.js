/* ==========================================================================
   StudySnap AI - Shared Safety Helpers
   ========================================================================== */

const studySnapUtils = {
    safeJsonParse(value, fallback) {
        if (!value) return fallback;
        try {
            const parsed = JSON.parse(value);
            return parsed ?? fallback;
        } catch (error) {
            return fallback;
        }
    },

    escapeHtml(value) {
        return String(value ?? '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    },

    normalizeJsonResponse(response) {
        return String(response ?? '')
            .replace(/```json/gi, '')
            .replace(/```/g, '')
            .trim();
    },

    /* Safe localStorage wrapper — avoids SecurityError in private/incognito mode */
    safeStorage: {
        getItem(key, fallback = null) {
            try {
                return localStorage.getItem(key) ?? fallback;
            } catch (e) {
                return fallback;
            }
        },
        setItem(key, value) {
            try {
                localStorage.setItem(key, value);
                return true;
            } catch (e) {
                return false;
            }
        },
        removeItem(key) {
            try {
                localStorage.removeItem(key);
                return true;
            } catch (e) {
                return false;
            }
        }
    },

    /* Exploding Typography — characters fly in from scattered positions */
    explodeText(el, options = {}) {
        const text = el.textContent;
        const {
            scatterRadius = 180,
            duration = 700,
            stagger = 35,
            particles = 16,
            particleColor = '#ffd700'
        } = options;

        const computed = window.getComputedStyle(el);
        const bgImage = computed.backgroundImage;
        const isGradient = bgImage !== 'none'
            && (computed.backgroundClip === 'text'
                || computed.webkitBackgroundClip === 'text'
                || computed.webkitTextFillColor === 'transparent');

        if (isGradient) {
            /* For gradient text (background-clip), use overlay approach */
            const wrapper = document.createElement('span');
            wrapper.style.cssText = 'position:relative;display:inline-block;';
            el.parentNode.insertBefore(wrapper, el);
            wrapper.appendChild(el);
            el.style.opacity = '0';
            el.style.position = 'relative';
            el.style.zIndex = '1';

            const overlay = document.createElement('span');
            overlay.style.cssText = 'position:absolute;inset:0;display:flex;white-space:nowrap;z-index:2;';
            wrapper.appendChild(overlay);

            const chars = [...text];
            const spans = chars.map((ch, i) => {
                const span = document.createElement('span');
                span.textContent = ch === ' ' ? '\u00A0' : ch;
                span.style.cssText = `display:inline-block;transition:all ${duration}ms cubic-bezier(0.22, 1.2, 0.36, 1) ${i * stagger}ms;opacity:0;`;
                const angle = Math.random() * Math.PI * 2;
                const radius = scatterRadius * (0.4 + Math.random() * 0.6);
                span.style.transform = `translate(${Math.cos(angle) * radius}px, ${Math.sin(angle) * radius}px) scale(0.2) rotate(${(Math.random() - 0.5) * 60}deg)`;
                overlay.appendChild(span);
                return span;
            });

            requestAnimationFrame(() => {
                spans.forEach(span => {
                    span.style.opacity = '1';
                    span.style.transform = 'translate(0, 0) scale(1) rotate(0deg)';
                });
            });

            setTimeout(() => {
                el.style.opacity = '1';
                overlay.remove();
                wrapper.replaceWith(el);
            }, duration + chars.length * stagger + 200);
        } else {
            /* For plain text (like splash), replace in-place */
            el.textContent = '';
            el.style.position = 'relative';
            el.style.display = 'inline-block';

            const chars = [...text];
            const spans = chars.map((ch, i) => {
                const span = document.createElement('span');
                span.textContent = ch === ' ' ? '\u00A0' : ch;
                span.style.display = 'inline-block';
                span.style.transition = `all ${duration}ms cubic-bezier(0.22, 1.2, 0.36, 1) ${i * stagger}ms`;
                span.style.opacity = '0';
                const angle = Math.random() * Math.PI * 2;
                const radius = scatterRadius * (0.4 + Math.random() * 0.6);
                span.style.transform = `translate(${Math.cos(angle) * radius}px, ${Math.sin(angle) * radius}px) scale(0.2) rotate(${(Math.random() - 0.5) * 60}deg)`;
                el.appendChild(span);
                return span;
            });

            requestAnimationFrame(() => {
                spans.forEach(span => {
                    span.style.opacity = '1';
                    span.style.transform = 'translate(0, 0) scale(1) rotate(0deg)';
                });
            });
        }

        /* Particle burst from element center */
        if (particles > 0) {
            const rect = el.getBoundingClientRect();
            const cx = rect.left + rect.width / 2;
            const cy = rect.top + rect.height / 2;
            for (let i = 0; i < particles; i++) {
                const p = document.createElement('div');
                const size = 3 + Math.random() * 5;
                const angle = Math.random() * Math.PI * 2;
                const dist = 60 + Math.random() * 140;
                p.style.cssText = `position:fixed;left:${cx}px;top:${cy}px;width:${size}px;height:${size}px;border-radius:${Math.random() > 0.5 ? '50%' : '2px'};background:${particleColor};pointer-events:none;z-index:10000;opacity:1;transition:all ${600 + Math.random() * 400}ms cubic-bezier(0.25,0.46,0.45,0.94)`;
                document.body.appendChild(p);
                requestAnimationFrame(() => {
                    p.style.transform = `translate(${Math.cos(angle) * dist}px, ${Math.sin(angle) * dist}px) rotate(${Math.random() * 360}deg)`;
                    p.style.opacity = '0';
                });
                setTimeout(() => p.remove(), 1200);
            }
        }
    }
};
