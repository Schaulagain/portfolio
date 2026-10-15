// Matrix rain behind the terminal. Throttled, pauses when hidden or scrolled away,
// and picks its colours up from the current theme (--rain, --rain-fade).

const GLYPHS = 'アァカサタナハマヤャラワガザダバパイィキシチニヒミリヰギジヂビピウゥクスツヌフムユュルグズブヅプエェケセテネヘメレヱゲゼデベペオォコソトノホモヨョロヲゴゾドボポヴッン0123456789ABCDEF<>/{}$#';
const FONT_SIZE = 16;
const FRAME_MS = 50;

export function createMatrix(canvas, watchEl) {
    const ctx = canvas.getContext('2d');
    let drops = [];
    let colors = {};
    let enabled = false;
    let visible = true;
    let raf = 0;
    let last = 0;

    const readColors = () => {
        const css = getComputedStyle(document.documentElement);
        colors = { rain: css.getPropertyValue('--rain').trim(), fade: css.getPropertyValue('--rain-fade').trim() };
    };

    const resize = () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        const columns = Math.ceil(canvas.width / FONT_SIZE);
        // Keep existing columns, start new ones at random heights so they don't fall in a line.
        drops = Array.from({ length: columns }, (_, i) => drops[i] ?? Math.floor(Math.random() * -50));
    };

    const frame = (t) => {
        raf = requestAnimationFrame(frame);
        if (t - last < FRAME_MS) return;
        last = t;
        ctx.fillStyle = colors.fade;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = colors.rain;
        ctx.font = `${FONT_SIZE}px "JetBrains Mono", monospace`;
        for (let i = 0; i < drops.length; i++) {
            const y = drops[i] * FONT_SIZE;
            if (y > 0) ctx.fillText(GLYPHS[Math.floor(Math.random() * GLYPHS.length)], i * FONT_SIZE, y);
            if (y > canvas.height && Math.random() > 0.975) drops[i] = 0;
            drops[i]++;
        }
    };

    const sync = () => {
        const shouldRun = enabled && visible && !document.hidden;
        if (shouldRun && !raf) raf = requestAnimationFrame(frame);
        if (!shouldRun && raf) { cancelAnimationFrame(raf); raf = 0; }
        canvas.classList.toggle('on', enabled);
    };

    window.addEventListener('resize', resize);
    document.addEventListener('visibilitychange', sync);
    if (watchEl && 'IntersectionObserver' in window) {
        new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; sync(); }).observe(watchEl);
    }
    resize();
    readColors();

    return {
        get enabled() { return enabled; },
        set(on) {
            enabled = on;
            if (!on) ctx.clearRect(0, 0, canvas.width, canvas.height);
            sync();
        },
        refreshColors() {
            readColors();
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        },
    };
}
