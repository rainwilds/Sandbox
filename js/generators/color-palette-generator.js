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
        } catch (_) {}
    };

    /* ---------- generate transparent series ---------- */
    const generateTransparent = (baseVar, prefix, index) => {
        const base = getComputedStyle(root).getPropertyValue(baseVar).trim();
        if (!base || !chroma.valid(base)) return;
        const col = chroma(base);
        const alphas = [0.1, 0.2, 0.3, 0.4, 0.5, 0.6];
        const alpha = alphas[index - 1];
        const varName = `--${prefix}-${index}`;
        root.style.setProperty(varName, col.alpha(alpha).css());
    };

    const generateAllTransparent = () => {
        for (let i = 1; i <= 6; i++) {
            generateTransparent(`--color-light-${i}`, 'color-light-transparent', i);
            generateTransparent(`--color-dark-${i}`, 'color-dark-transparent', i);
        }
        const alphas = [0.1, 0.2, 0.3, 0.4, 0.5, 0.6];
        alphas.forEach((a, i) => {
            const idx = i + 1;
            root.style.setProperty(`--color-black-transparent-${idx}`, `rgba(0, 0, 0, ${a})`);
            root.style.setProperty(`--color-white-transparent-${idx}`, `rgba(255, 255, 255, ${a})`);
        });
    };

    /* ---------- scale interpolation ---------- */
    const updateScales = (changed = null) => {
        const styles = getComputedStyle(root);

        const l1 = styles.getPropertyValue('--color-light-1').trim();
        const l6 = styles.getPropertyValue('--color-light-6').trim();
        if ((changed === '--color-light-1' || changed === '--color-light-6') && l1 && l6) {
            const scale = chroma.scale([l1, l6]).mode('lch').colors(6);
            for (let i = 2; i <= 5; i++) root.style.setProperty(`--color-light-${i}`, scale[i - 1]);
        }

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
    let paletteGroups = null;

    const clearPalettes = () => {
        if (!paletteGroups) return;
        Object.values(paletteGroups).forEach(p => p && (p.innerHTML = ''));
    };

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
        if (!paletteGroups) return;
        const styles = getComputedStyle(root);
        clearPalettes();

        for (let i = 1; i <= 6; i++) {
            const v = styles.getPropertyValue(`--color-light-${i}`).trim();
            if (paletteGroups.light) paletteGroups.light.appendChild(createSwatch(`--color-light-${i}`, v));
        }
        for (let i = 1; i <= 6; i++) {
            const v = styles.getPropertyValue(`--color-dark-${i}`).trim();
            if (paletteGroups.dark) paletteGroups.dark.appendChild(createSwatch(`--color-dark-${i}`, v));
        }
        for (let i = 1; i <= 6; i++) {
            const v = styles.getPropertyValue(`--color-light-transparent-${i}`).trim();
            if (paletteGroups.lightTrans) paletteGroups.lightTrans.appendChild(createSwatch(`--color-light-transparent-${i}`, v));
        }
        for (let i = 1; i <= 6; i++) {
            const v = styles.getPropertyValue(`--color-dark-transparent-${i}`).trim();
            if (paletteGroups.darkTrans) paletteGroups.darkTrans.appendChild(createSwatch(`--color-dark-transparent-${i}`, v));
        }
        for (let i = 1; i <= 6; i++) {
            const v = styles.getPropertyValue(`--color-black-transparent-${i}`).trim();
            if (paletteGroups.blackTrans) paletteGroups.blackTrans.appendChild(createSwatch(`--color-black-transparent-${i}`, v));
        }
        for (let i = 1; i <= 6; i++) {
            const v = styles.getPropertyValue(`--color-white-transparent-${i}`).trim();
            if (paletteGroups.whiteTrans) paletteGroups.whiteTrans.appendChild(createSwatch(`--color-white-transparent-${i}`, v));
        }
        ['--color-white', '--color-black'].forEach(v => {
            const val = styles.getPropertyValue(v).trim();
            const target = v.includes('white') ? paletteGroups.staticLight : paletteGroups.staticDark;
            if (target) target.appendChild(createSwatch(v, val));
        });
    };

    /* ---------- init ---------- */
    const init = () => {
        const styles = getComputedStyle(root);

        // Fallbacks
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

        // Create paletteGroups AFTER DOM is ready
        paletteGroups = {
            light: document.getElementById('color-accent-light'),
            dark: document.getElementById('color-accent-dark'),
            lightTrans: document.getElementById('color-light-transparent'),
            darkTrans: document.getElementById('color-dark-transparent'),
            blackTrans: document.getElementById('color-black-transparent'),
            whiteTrans: document.getElementById('color-white-transparent'),
            staticLight: document.getElementById('color-static-light'),
            staticDark: document.getElementById('color-static-dark')
        };

        // Init inputs
        ['light-1', 'light-6', 'dark-1', 'dark-6'].forEach(id => {
            const input = document.getElementById(id);
            if (input) {
                const varName = `--color-${id.replace(/-\d$/, '')}-${id.match(/\d+$/)[0]}`;
                input.value = styles.getPropertyValue(varName).trim();
            }
        });

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
            ...Array.from({length:6}, (_,i) => `--color-light-${i+1}`),
            ...Array.from({length:6}, (_,i) => `--color-dark-${i+1}`),
            ...Array.from({length:6}, (_,i) => `--color-light-transparent-${i+1}`),
            ...Array.from({length:6}, (_,i) => `--color-dark-transparent-${i+1}`),
            ...Array.from({length:6}, (_,i) => `--color-black-transparent-${i+1}`),
            ...Array.from({length:6}, (_,i) => `--color-white-transparent-${i+1}`),
            '--color-white', '--color-black'
        ];
        const txt = vars.map(v => `${v}: ${styles.getPropertyValue(v).trim()};`).join('\n');
        navigator.clipboard.writeText(txt).then(() => alert('CSS variables copied!'));
    });

    /* ---------- wait for CSS + DOM ---------- */
    const waitForCssAndDom = (cb, timeout = 10000) => {
        let cssLoaded = false;
        let domReady = false;
        const start = Date.now();

        const check = () => {
            if (cssLoaded && domReady) {
                cb();
                return;
            }

            if (!cssLoaded) {
                const found = Array.from(document.styleSheets).some(s =>
                    s.href && s.href.includes('styles.css')
                );
                if (found) cssLoaded = true;
            }

            if (!domReady) {
                const ids = [
                    'color-accent-light', 'color-accent-dark',
                    'color-light-transparent', 'color-dark-transparent',
                    'color-black-transparent', 'color-white-transparent',
                    'color-static-light', 'color-static-dark'
                ];
                domReady = ids.every(id => document.getElementById(id));
            }

            if (!cssLoaded || !domReady) {
                if (Date.now() - start > timeout) {
                    console.warn('Timeout, proceeding...');
                    cb();
                } else {
                    setTimeout(check, 50);
                }
            }
        };

        check();
    };

    waitForCssAndDom(init);
}

/* -------------------------------------------------------------- */
window.removeEventListener('load', setupColorPalette);
window.addEventListener('load', setupColorPalette);