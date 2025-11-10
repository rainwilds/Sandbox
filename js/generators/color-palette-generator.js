/* --------------------------------------------------------------
   Color palette generator – new naming scheme
   -------------------------------------------------------------- */
let isInitialized = false;

function setupColorPalette() {
    if (isInitialized) return;
    isInitialized = true;

    const root = document.documentElement;

    /* ---------- helpers ---------- */
    const normalizeCssColor = str => {
        str = str.trim();
        if (!str.startsWith('rgb')) return str;
        const isRgba = str.startsWith('rgba');
        const inner = str.slice(isRgba ? 5 : 4, -1).trim();
        const parts = inner.split(/[\s,\/]+/).filter(Boolean);
        if (parts.length < 3) return str;
        const [r, g, b, a = '1'] = parts;
        return isRgba || parts.length === 4
            ? `rgba(${r},${g},${b},${a})`
            : `rgb(${r},${g},${b})`;
    };

    const updateSwatchText = (swatch, value) => {
        try {
            const c = chroma(normalizeCssColor(value));
            const text = c.luminance() > 0.5 ? 'black' : 'white';
            swatch.querySelectorAll('span').forEach(s => s.style.color = text);
        } catch (_) { }
    };

    /* ---------- generate transparent series ---------- */
    const generateTransparent = (baseVar, prefix, index) => {
        const base = getComputedStyle(root).getPropertyValue(baseVar).trim();
        if (!base) return;
        const col = chroma(base);
        const alphas = [0.1, 0.2, 0.3, 0.4, 0.5, 0.6];
        const alpha = alphas[index - 1];
        const varName = `--${prefix}-${index}`;
        root.style.setProperty(varName, col.alpha(alpha).css());
    };

    const generateAllTransparent = () => {
        // light
        for (let i = 1; i <= 6; i++) {
            generateTransparent(`--color-light-${i}`, 'color-light-transparent', i);
        }
        // dark
        for (let i = 1; i <= 6; i++) {
            generateTransparent(`--color-dark-${i}`, 'color-dark-transparent', i);
        }
        // black & white (use full array)
        const fullAlphas = [0.1, 0.2, 0.3, 0.4, 0.5, 0.6];
        fullAlphas.forEach((a, i) => {
            const idx = i + 1;
            const black = chroma('black').alpha(a).css();
            const white = chroma('white').alpha(a).css();
            root.style.setProperty(`--color-black-transparent-${idx}`, black);
            root.style.setProperty(`--color-white-transparent-${idx}`, white);
        });
    };

    /* ---------- scale interpolation ---------- */
    const updateScales = (changed = null) => {
        const styles = getComputedStyle(root);

        // ---- light scale ----
        const l1 = styles.getPropertyValue('--color-light-1').trim();
        const l6 = styles.getPropertyValue('--color-light-6').trim();
        if ((changed === '--color-light-1' || changed === '--color-light-6') && l1 && l6) {
            const scale = chroma.scale([l1, l6]).mode('lch').colors(6);
            for (let i = 2; i <= 5; i++) root.style.setProperty(`--color-light-${i}`, scale[i - 1]);
        }

        // ---- dark scale ----
        const d1 = styles.getPropertyValue('--color-dark-1').trim();
        const d6 = styles.getPropertyValue('--color-dark-6').trim();
        if ((changed === '--color-dark-1' || changed === '--color-dark-6') && d1 && d6) {
            const scale = chroma.scale([d1, d6]).mode('lch').colors(6);
            for (let i = 2; i <= 5; i++) root.style.setProperty(`--color-dark-${i}`, scale[i - 1]);
        }

        generateAllTransparent();
        refreshSwatches();
    };

    /* ---------- swatch rendering ---------- */
    const paletteGroups = {
        light: document.getElementById('color-accent-light'),          // solid light
        dark: document.getElementById('color-accent-dark'),           // solid dark
        lightTrans: document.getElementById('color-light-transparent'),
        darkTrans: document.getElementById('color-dark-transparent'),
        blackTrans: document.getElementById('color-black-transparent'),
        whiteTrans: document.getElementById('color-white-transparent'),
        staticLight: document.getElementById('color-static-light'),
        staticDark: document.getElementById('color-static-dark')
    };

    const clearPalettes = () => Object.values(paletteGroups).forEach(p => p && (p.innerHTML = ''));

    const createSwatch = (varName, value) => {
        const div = document.createElement('div');
        div.className = 'color-swatch';
        div.style.backgroundColor = `var(${varName})`;
        div.dataset.varName = varName;

        const name = document.createElement('span');
        name.textContent = varName;
        const val = document.createElement('span');
        val.textContent = value;

        div.append(name, val);
        updateSwatchText(div, value);
        return div;
    };

    const refreshSwatches = () => {
        const styles = getComputedStyle(root);
        clearPalettes();

        // solid light
        for (let i = 1; i <= 6; i++) {
            const v = styles.getPropertyValue(`--color-light-${i}`).trim();
            paletteGroups.light.appendChild(createSwatch(`--color-light-${i}`, v));
        }
        // solid dark
        for (let i = 1; i <= 6; i++) {
            const v = styles.getPropertyValue(`--color-dark-${i}`).trim();
            paletteGroups.dark.appendChild(createSwatch(`--color-dark-${i}`, v));
        }
        // transparent light
        for (let i = 1; i <= 6; i++) {
            const v = styles.getPropertyValue(`--color-light-transparent-${i}`).trim();
            paletteGroups.lightTrans.appendChild(createSwatch(`--color-light-transparent-${i}`, v));
        }
        // transparent dark
        for (let i = 1; i <= 6; i++) {
            const v = styles.getPropertyValue(`--color-dark-transparent-${i}`).trim();
            paletteGroups.darkTrans.appendChild(createSwatch(`--color-dark-transparent-${i}`, v));
        }
        // black transparent
        for (let i = 1; i <= 6; i++) {
            const v = styles.getPropertyValue(`--color-black-transparent-${i}`).trim();
            paletteGroups.blackTrans.appendChild(createSwatch(`--color-black-transparent-${i}`, v));
        }
        // white transparent
        for (let i = 1; i <= 6; i++) {
            const v = styles.getPropertyValue(`--color-white-transparent-${i}`).trim();
            paletteGroups.whiteTrans.appendChild(createSwatch(`--color-white-transparent-${i}`, v));
        }
        // static
        ['--color-white', '--color-black'].forEach(v => {
            const val = styles.getPropertyValue(v).trim();
            const target = v.includes('white') ? paletteGroups.staticLight : paletteGroups.staticDark;
            target.appendChild(createSwatch(v, val));
        });
    };

    /* ---------- initialise ---------- */
    const init = () => {
        const styles = getComputedStyle(root);

        // set fallback values if nothing is defined in CSS
        const defaults = {
            '--color-light-1': '#b839f7',
            '--color-light-6': '#bfd0df',
            '--color-dark-1': '#34251d',
            '--color-dark-6': '#051524',
            '--color-white': 'white',
            '--color-black': 'black'
        };
        Object.entries(defaults).forEach(([k, v]) => {
            if (!styles.getPropertyValue(k).trim()) root.style.setProperty(k, v);
        });

        // initialise inputs
        ['light-1', 'light-6', 'dark-1', 'dark-6'].forEach(id => {
            const input = document.getElementById(id);
            const varName = `--color-${id.replace(/-\d$/, '')}-${id.match(/\d+$/)[0]}`;
            input.value = styles.getPropertyValue(varName).trim();
        });

        // first scale + transparent generation
        updateScales();
    };

    /* ---------- input listeners ---------- */
    ['light-1', 'light-6', 'dark-1', 'dark-6'].forEach(id => {
        const input = document.getElementById(id);
        if (!input) return;
        const varName = `--color-${id.replace(/-\d$/, '')}-${id.match(/\d+$/)[0]}`;
        input.addEventListener('input', () => {
            root.style.setProperty(varName, input.value);
            updateScales(varName);
        });
    });

    /* ---------- copy button ---------- */
    document.getElementById('copy-css-vars')?.addEventListener('click', () => {
        const styles = getComputedStyle(root);
        const vars = [
            ...Array.from({ length: 6 }, (_, i) => `--color-light-${i + 1}`),
            ...Array.from({ length: 6 }, (_, i) => `--color-dark-${i + 1}`),
            ...Array.from({ length: 6 }, (_, i) => `--color-light-transparent-${i + 1}`),
            ...Array.from({ length: 6 }, (_, i) => `--color-dark-transparent-${i + 1}`),
            ...Array.from({ length: 6 }, (_, i) => `--color-black-transparent-${i + 1}`),
            ...Array.from({ length: 6 }, (_, i) => `--color-white-transparent-${i + 1}`),
            '--color-white', '--color-black'
        ];
        const txt = vars.map(v => `${v}: ${styles.getPropertyValue(v).trim()};`).join('\n');
        navigator.clipboard.writeText(txt).then(() => alert('CSS variables copied!'));
    });

    /* ---------- start ---------- */
    const waitForCss = (href, cb, timeout = 10000) => {
        const start = Date.now();
        const poll = () => {
            const found = Array.from(document.styleSheets).some(s => s.href && s.href.includes(href));
            if (found) return cb();
            if (Date.now() - start > timeout) return cb();
            setTimeout(poll, 100);
        };
        poll();
    };

    waitForCss('styles.css', init);
}

/* -------------------------------------------------------------- */
window.removeEventListener('load', setupColorPalette);
window.addEventListener('load', setupColorPalette);