/* --------------------------------------------------------------
   Color Palette Generator – Final Version
   • Alpha step control (0.01–1.00)
   • Even button = 100/7 → 6th alpha = ~0.86
   • All "transparent" → "alpha"
   • No scale-transparent
   • Perfect copy formatting
   • 50 CSS variables
   -------------------------------------------------------------- */
let isInitialized = false;

function setupColorPalette() {
    if (isInitialized) return;
    if (typeof chroma === 'undefined') {
        console.warn('Chroma.js not loaded. Retrying...');
        setTimeout(setupColorPalette, 100);
        return;
    }
    isInitialized = true;

    const root = document.documentElement;
    let alphaStep = 0.1;

    /* ---------- helpers ---------- */
    const roundAlpha = (num) => parseFloat(num.toFixed(2));

    const rgbToHex = (rgb) => {
        if (rgb.startsWith('#')) return rgb;
        const match = rgb.match(/\d+/g);
        if (!match || match.length < 3) return '#ffffff';
        return '#' + match.map(x => parseInt(x).toString(16).padStart(2, '0')).join('');
    };

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

    /* ---------- alpha generator ---------- */
    const generateAlphas = () => {
        const step = parseFloat(alphaStep) || 0.1;
        return Array.from({ length: 6 }, (_, i) => roundAlpha(step * (i + 1)));
    };

    /* ---------- generate alpha series ---------- */
    const generatePerColorAlpha = (baseVar, prefix) => {
        const base = getComputedStyle(root).getPropertyValue(baseVar).trim();
        if (!base || !chroma.valid(base)) return;
        const col = chroma(base);
        generateAlphas().forEach((a, i) => {
            const idx = i + 1;
            const varName = `--${prefix}-alpha-${idx}`;
            root.style.setProperty(varName, col.alpha(a).css());
        });
    };

    const generateAllAlpha = () => {
        generatePerColorAlpha('--color-light-1', 'color-light-1');
        generatePerColorAlpha('--color-light-6', 'color-light-6');
        generatePerColorAlpha('--color-dark-1', 'color-dark-1');
        generatePerColorAlpha('--color-dark-6', 'color-dark-6');

        generateAlphas().forEach((a, i) => {
            const idx = i + 1;
            root.style.setProperty(`--color-black-alpha-${idx}`, `rgba(0,0,0,${a})`);
            root.style.setProperty(`--color-white-alpha-${idx}`, `rgba(255,255,255,${a})`);
        });
    };

    /* ---------- scale interpolation ---------- */
    const updateScales = (changed = null) => {
        const styles = getComputedStyle(root);

        const l1 = styles.getPropertyValue('--color-light-1').trim();
        const l6 = styles.getPropertyValue('--color-light-6').trim();
        if ((changed === '--color-light-1' || changed === '--color-light-6') && l1 && l6 && chroma.valid(l1) && chroma.valid(l6)) {
            try {
                const scale = chroma.scale([l1, l6]).mode('lch').colors(6);
                for (let i = 2; i <= 5; i++) root.style.setProperty(`--color-light-${i}`, scale[i - 1]);
            } catch (e) {
                console.error('Light scale failed:', e);
            }
        }

        const d1 = styles.getPropertyValue('--color-dark-1').trim();
        const d6 = styles.getPropertyValue('--color-dark-6').trim();
        if ((changed === '--color-dark-1' || changed === '--color-dark-6') && d1 && d6 && chroma.valid(d1) && chroma.valid(d6)) {
            try {
                const scale = chroma.scale([d1, d6]).mode('lch').colors(6);
                for (let i = 2; i <= 5; i++) root.style.setProperty(`--color-dark-${i}`, scale[i - 1]);
            } catch (e) {
                console.error('Dark scale failed:', e);
            }
        }

        generateAllAlpha();
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

        // solid
        for (let i = 1; i <= 6; i++) {
            const v = styles.getPropertyValue(`--color-light-${i}`).trim();
            if (paletteGroups.light) paletteGroups.light.appendChild(createSwatch(`--color-light-${i}`, v));
        }
        for (let i = 1; i <= 6; i++) {
            const v = styles.getPropertyValue(`--color-dark-${i}`).trim();
            if (paletteGroups.dark) paletteGroups.dark.appendChild(createSwatch(`--color-dark-${i}`, v));
        }

        // per-color alpha
        const addPerColor = (base, container) => {
            for (let i = 1; i <= 6; i++) {
                const v = styles.getPropertyValue(`--${base}-alpha-${i}`).trim();
                if (container) container.appendChild(createSwatch(`--${base}-alpha-${i}`, v));
            }
        };
        addPerColor('color-light-1', paletteGroups.light1Alpha);
        addPerColor('color-light-6', paletteGroups.light6Alpha);
        addPerColor('color-dark-1', paletteGroups.dark1Alpha);
        addPerColor('color-dark-6', paletteGroups.dark6Alpha);

        // black / white alpha
        for (let i = 1; i <= 6; i++) {
            const vb = styles.getPropertyValue(`--color-black-alpha-${i}`).trim();
            const vw = styles.getPropertyValue(`--color-white-alpha-${i}`).trim();
            if (paletteGroups.blackAlpha) paletteGroups.blackAlpha.appendChild(createSwatch(`--color-black-alpha-${i}`, vb));
            if (paletteGroups.whiteAlpha) paletteGroups.whiteAlpha.appendChild(createSwatch(`--color-white-alpha-${i}`, vw));
        }

        // static
        ['--color-white', '--color-black'].forEach(v => {
            const val = styles.getPropertyValue(v).trim();
            const target = v.includes('white') ? paletteGroups.staticLight : paletteGroups.staticDark;
            if (target) target.appendChild(createSwatch(v, val));
        });
    };

    /* ---------- init ---------- */
    const init = () => {
        const styles = getComputedStyle(root);

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

        paletteGroups = {
            light: document.getElementById('color-accent-light'),
            dark: document.getElementById('color-accent-dark'),
            light1Alpha: document.getElementById('color-light-1-alpha'),
            light6Alpha: document.getElementById('color-light-6-alpha'),
            dark1Alpha: document.getElementById('color-dark-1-alpha'),
            dark6Alpha: document.getElementById('color-dark-6-alpha'),
            blackAlpha: document.getElementById('color-black-alpha'),
            whiteAlpha: document.getElementById('color-white-alpha'),
            staticLight: document.getElementById('color-static-light'),
            staticDark: document.getElementById('color-static-dark')
        };

        // Input listeners
        const colorInputs = {
            'light-1': '--color-light-1',
            'light-6': '--color-light-6',
            'dark-1': '--color-dark-1',
            'dark-6': '--color-dark-6'
        };

        const bodyBgInput = document.getElementById('body-bg');
        if (bodyBgInput) {
            // Set initial value from CSS
            const currentBg = getComputedStyle(document.body).backgroundColor || '#ffffff';
            bodyBgInput.value = rgbToHex(currentBg) || '#ffffff';

            bodyBgInput.addEventListener('input', (e) => {
                document.body.style.backgroundColor = e.target.value;
            });
        }

        Object.entries(colorInputs).forEach(([id, varName]) => {
            const input = document.getElementById(id);
            if (!input) return;
            input.value = styles.getPropertyValue(varName).trim();
            input.addEventListener('input', (e) => {
                root.style.setProperty(varName, e.target.value);
                updateScales(varName);
            });
        });

        // Alpha controls
        const alphaInput = document.getElementById('alpha-step');
        if (alphaInput) {
            alphaInput.value = alphaStep;
            alphaInput.addEventListener('input', () => {
                alphaStep = parseFloat(alphaInput.value) || 0.1;
                if (alphaStep < 0.01) alphaStep = 0.01;
                if (alphaStep > 1) alphaStep = 1;
                updateScales();
            });
        }

        // Text color toggle
        const textToggleBtn = document.getElementById('toggle-text-color');
        if (textToggleBtn) {
            // Detect current mode
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            let isDarkText = prefersDark; // start with white text in dark mode

            const updateTextColor = () => {
                const colorValue = isDarkText
                    ? 'light-dark(black, white)'
                    : 'light-dark(white, black)';
                root.style.setProperty('color', colorValue);
                textToggleBtn.textContent = `Toggle Text: ${isDarkText ? 'White' : 'Black'}`;
            };

            textToggleBtn.addEventListener('click', () => {
                isDarkText = !isDarkText;
                updateTextColor();
            });

            // Initialize
            updateTextColor();
        }

        // Even button: 100/7 → 6th = 0.86
        document.getElementById('alpha-even')?.addEventListener('click', () => {
            alphaStep = 1 / 7;
            if (alphaInput) alphaInput.value = alphaStep.toFixed(4);
            updateScales();
        });

        updateScales();
    };

    /* ---------- copy button – perfectly formatted ---------- */
    document.getElementById('copy-css-vars')?.addEventListener('click', () => {
        const styles = getComputedStyle(root);

        const formatGroup = (title, vars) => {
            const lines = vars.map(v => {
                const val = styles.getPropertyValue(v).trim() || '/* not set */';
                return `${v}: ${val};`;
            }).join('\n');
            return `/* ——— ${title} ——— */\n${lines}\n`;
        };

        const output = [
            formatGroup('SOLID LIGHT SCALE (6)', [
                '--color-light-1', '--color-light-2', '--color-light-3',
                '--color-light-4', '--color-light-5', '--color-light-6'
            ]),
            formatGroup('SOLID DARK SCALE (6)', [
                '--color-dark-1', '--color-dark-2', '--color-dark-3',
                '--color-dark-4', '--color-dark-5', '--color-dark-6'
            ]),
            formatGroup('LIGHT 1 ALPHA (6)', [
                '--color-light-1-alpha-1', '--color-light-1-alpha-2', '--color-light-1-alpha-3',
                '--color-light-1-alpha-4', '--color-light-1-alpha-5', '--color-light-1-alpha-6'
            ]),
            formatGroup('LIGHT 6 ALPHA (6)', [
                '--color-light-6-alpha-1', '--color-light-6-alpha-2', '--color-light-6-alpha-3',
                '--color-light-6-alpha-4', '--color-light-6-alpha-5', '--color-light-6-alpha-6'
            ]),
            formatGroup('DARK 1 ALPHA (6)', [
                '--color-dark-1-alpha-1', '--color-dark-1-alpha-2', '--color-dark-1-alpha-3',
                '--color-dark-1-alpha-4', '--color-dark-1-alpha-5', '--color-dark-1-alpha-6'
            ]),
            formatGroup('DARK 6 ALPHA (6)', [
                '--color-dark-6-alpha-1', '--color-dark-6-alpha-2', '--color-dark-6-alpha-3',
                '--color-dark-6-alpha-4', '--color-dark-6-alpha-5', '--color-dark-6-alpha-6'
            ]),
            formatGroup('BLACK ALPHA (6)', [
                '--color-black-alpha-1', '--color-black-alpha-2', '--color-black-alpha-3',
                '--color-black-alpha-4', '--color-black-alpha-5', '--color-black-alpha-6'
            ]),
            formatGroup('WHITE ALPHA (6)', [
                '--color-white-alpha-1', '--color-white-alpha-2', '--color-white-alpha-3',
                '--color-white-alpha-4', '--color-white-alpha-5', '--color-white-alpha-6'
            ]),
            formatGroup('STATIC COLORS (2)', ['--color-white', '--color-black'])
        ].join('\n');

        navigator.clipboard.writeText(output).then(() => {
            alert('CSS variables copied (body background excluded)');
        });
    });

    /* ---------- wait for CSS + DOM ---------- */
    const waitForCssAndDom = (cb, timeout = 5000) => {
        let cssLoaded = false;
        let domReady = false;
        const start = Date.now();

        const check = () => {
            if (cssLoaded && domReady) { cb(); return; }

            if (!cssLoaded) {
                const found = Array.from(document.styleSheets).some(s =>
                    s.href && s.href.includes('styles.css')
                );
                if (found) cssLoaded = true;
            }

            if (!domReady) {
                const ids = [
                    'color-accent-light', 'color-accent-dark',
                    'color-light-1-alpha', 'color-light-6-alpha',
                    'color-dark-1-alpha', 'color-dark-6-alpha',
                    'color-black-alpha', 'color-white-alpha',
                    'color-static-light', 'color-static-dark',
                    'light-1', 'light-6', 'dark-1', 'dark-6',
                    'alpha-step', 'alpha-even', 'copy-css-vars'
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