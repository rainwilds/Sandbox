/* --------------------------------------------------------------
   Color palette generator – formatted copy + clean alpha
   -------------------------------------------------------------- */
let isInitialized = false;

function setupColorPalette() {
    if (isInitialized) return;
    isInitialized = true;

    const root = document.documentElement;
    let alphaStep = 0.1;

    /* ---------- helpers ---------- */
    const roundAlpha = (num) => parseFloat(num.toFixed(2));

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

    /* ---------- alpha generator ---------- */
    const generateAlphas = () => {
        const step = parseFloat(alphaStep) || 0.1;
        return Array.from({length: 6}, (_, i) => roundAlpha(step * (i + 1)));
    };

    /* ---------- generate transparent series ---------- */
    const generatePerColorTransparent = (baseVar, prefix) => {
        const base = getComputedStyle(root).getPropertyValue(baseVar).trim();
        if (!base || !chroma.valid(base)) return;
        const col = chroma(base);
        generateAlphas().forEach((a, i) => {
            const idx = i + 1;
            const varName = `--${prefix}-transparent-${idx}`;
            root.style.setProperty(varName, col.alpha(a).css());
        });
    };

    const generateScaleTransparent = (baseVar, prefix) => {
        const base = getComputedStyle(root).getPropertyValue(baseVar).trim();
        if (!base || !chroma.valid(base)) return;
        const col = chroma(base);
        generateAlphas().forEach((a, i) => {
            const idx = i + 1;
            const varName = `--${prefix}-transparent-${idx}`;
            root.style.setProperty(varName, col.alpha(a).css());
        });
    };

    const generateAllTransparent = () => {
        generatePerColorTransparent('--color-light-1', 'color-light-1');
        generatePerColorTransparent('--color-light-6', 'color-light-6');
        generatePerColorTransparent('--color-dark-1',  'color-dark-1');
        generatePerColorTransparent('--color-dark-6',  'color-dark-6');

        for (let i = 1; i <= 6; i++) {
            generateScaleTransparent(`--color-light-${i}`, 'color-light');
            generateScaleTransparent(`--color-dark-${i}`,  'color-dark');
        }

        generateAlphas().forEach((a, i) => {
            const idx = i + 1;
            root.style.setProperty(`--color-black-transparent-${idx}`, `rgba(0,0,0,${a})`);
            root.style.setProperty(`--color-white-transparent-${idx}`, `rgba(255,255,255,${a})`);
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

        const addPerColor = (base, container) => {
            for (let i = 1; i <= 6; i++) {
                const v = styles.getPropertyValue(`--${base}-transparent-${i}`).trim();
                if (container) container.appendChild(createSwatch(`--${base}-transparent-${i}`, v));
            }
        };
        addPerColor('color-light-1', paletteGroups.light1Trans);
        addPerColor('color-light-6', paletteGroups.light6Trans);
        addPerColor('color-dark-1',  paletteGroups.dark1Trans);
        addPerColor('color-dark-6',  paletteGroups.dark6Trans);

        for (let i = 1; i <= 6; i++) {
            const v = styles.getPropertyValue(`--color-light-transparent-${i}`).trim();
            if (paletteGroups.lightTrans) paletteGroups.lightTrans.appendChild(createSwatch(`--color-light-transparent-${i}`, v));
        }
        for (let i = 1; i <= 6; i++) {
            const v = styles.getPropertyValue(`--color-dark-transparent-${i}`).trim();
            if (paletteGroups.darkTrans) paletteGroups.darkTrans.appendChild(createSwatch(`--color-dark-transparent-${i}`, v));
        }

        for (let i = 1; i <= 6; i++) {
            const vb = styles.getPropertyValue(`--color-black-transparent-${i}`).trim();
            const vw = styles.getPropertyValue(`--color-white-transparent-${i}`).trim();
            if (paletteGroups.blackTrans) paletteGroups.blackTrans.appendChild(createSwatch(`--color-black-transparent-${i}`, vb));
            if (paletteGroups.whiteTrans) paletteGroups.whiteTrans.appendChild(createSwatch(`--color-white-transparent-${i}`, vw));
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

        const defaults = {
            '--color-light-1': '#b839f7',
            '--color-light-6': '#bfd0df',
            '--color-dark-1' : '#34251d',
            '--color-dark-6' : '#051524',
            '--color-white'  : 'white',
            '--color-black'  : 'black'
        };
        Object.entries(defaults).forEach(([k, v]) => {
            if (!styles.getPropertyValue(k).trim()) root.style.setProperty(k, v);
        });

        paletteGroups = {
            light:       document.getElementById('color-accent-light'),
            dark:        document.getElementById('color-accent-dark'),
            light1Trans: document.getElementById('color-light-1-transparent'),
            light6Trans: document.getElementById('color-light-6-transparent'),
            dark1Trans:  document.getElementById('color-dark-1-transparent'),
            dark6Trans:  document.getElementById('color-dark-6-transparent'),
            lightTrans:  document.getElementById('color-light-transparent'),
            darkTrans:   document.getElementById('color-dark-transparent'),
            blackTrans:  document.getElementById('color-black-transparent'),
            whiteTrans:  document.getElementById('color-white-transparent'),
            staticLight: document.getElementById('color-static-light'),
            staticDark:  document.getElementById('color-static-dark')
        };

        ['light-1', 'light-6', 'dark-1', 'dark-6'].forEach(id => {
            const input = document.getElementById(id);
            if (input) {
                const varName = `--color-${id.replace(/-\d$/, '')}-${id.match(/\d+$/)[0]}`;
                input.value = styles.getPropertyValue(varName).trim();
            }
        });

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

        document.getElementById('alpha-even')?.addEventListener('click', () => {
            alphaStep = 1 / 6;
            if (alphaInput) alphaInput.value = alphaStep.toFixed(4);
            updateScales();
        });

        updateScales();
    };

    /* ---------- copy button – perfectly formatted ---------- */
    document.getElementById('copy-css-vars')?.addEventListener('click', () => {
        const styles = getComputedStyle(root);
        const alphas = generateAlphas();

        const formatGroup = (title, vars) => {
            const lines = vars.map(v => {
                const val = styles.getPropertyValue(v).trim();
                return `--${v.replace(/^--/, '')}: ${val};`;
            }).join('\n');
            return `/* ——— ${title} ——— */\n${lines}\n`;
        };

        const output = [
            formatGroup('SOLID LIGHT SCALE (6)', Array.from({length:6}, (_,i) => `color-light-${i+1}`)),
            formatGroup('SOLID DARK SCALE (6)', Array.from({length:6}, (_,i) => `color-dark-${i+1}`)),
            formatGroup('LIGHT 1 TRANSPARENT (6)', Array.from({length:6}, (_,i) => `color-light-1-transparent-${i+1}`)),
            formatGroup('LIGHT 6 TRANSPARENT (6)', Array.from({length:6}, (_,i) => `color-light-6-transparent-${i+1}`)),
            formatGroup('DARK 1 TRANSPARENT (6)', Array.from({length:6}, (_,i) => `color-dark-1-transparent-${i+1}`)),
            formatGroup('DARK 6 TRANSPARENT (6)', Array.from({length:6}, (_,i) => `color-dark-6-transparent-${i+1}`)),
            formatGroup('LIGHT TRANSPARENT (6)', Array.from({length:6}, (_,i) => `color-light-transparent-${i+1}`)),
            formatGroup('DARK TRANSPARENT (6)', Array.from({length:6}, (_,i) => `color-dark-transparent-${i+1}`)),
            formatGroup('BLACK TRANSPARENT (6)', Array.from({length:6}, (_,i) => `color-black-transparent-${i+1}`)),
            formatGroup('WHITE TRANSPARENT (6)', Array.from({length:6}, (_,i) => `color-white-transparent-${i+1}`)),
            formatGroup('STATIC COLORS (2)', ['color-white', 'color-black'])
        ].join('\n');

        navigator.clipboard.writeText(output).then(() => {
            alert('CSS variables copied with perfect formatting!');
        });
    });

    /* ---------- wait for CSS + DOM ---------- */
    const waitForCssAndDom = (cb, timeout = 10000) => {
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
                    'color-accent-light','color-accent-dark',
                    'color-light-1-transparent','color-light-6-transparent',
                    'color-dark-1-transparent','color-dark-6-transparent',
                    'color-light-transparent','color-dark-transparent',
                    'color-black-transparent','color-white-transparent',
                    'color-static-light','color-static-dark',
                    'alpha-step','alpha-even','copy-css-vars'
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