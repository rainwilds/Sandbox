window.addEventListener('load', () => {
    console.log('Load event fired');

    const root = document.documentElement;

    // Add styles for color inputs (not in styles.css)
    const style = document.createElement('style');
    style.textContent = `
        .color-inputs {
            display: flex;
            flex-wrap: wrap;
            gap: 20px;
            margin: 20px 0;
        }
        .color-inputs label {
            display: flex;
            align-items: center;
            gap: 10px;
            font-size: 16px;
        }
    `;
    document.head.appendChild(style);

    function normalizeCssColor(str) {
        str = str.trim();
        if (!str.startsWith('rgb')) return str;
        let isRgba = str.startsWith('rgba');
        let inner = str.slice(isRgba ? 5 : 4, -1).trim();
        let parts = inner.split(/[\s,\/]+/).filter(Boolean);
        if (parts.length < 3) return str;
        let r = parts[0], g = parts[1], b = parts[2], a = parts[3] || '1';
        if (a.endsWith('%')) {
            a = parseFloat(a) / 100;
        }
        return isRgba || parts.length === 4 ? `rgba(${r},${g},${b},${a})` : `rgb(${r},${g},${b})`;
    }

    function blendRgbaWithBackground(rgba, background) {
        const parts = rgba.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
        if (!parts) return rgba;
        const r = parseInt(parts[1]), g = parseInt(parts[2]), b = parseInt(parts[3]);
        const a = parts[4] ? parseFloat(parts[4]) : 1;
        const bg = chroma(background).rgb();
        const blendedR = Math.round(a * r + (1 - a) * bg[0]);
        const blendedG = Math.round(a * g + (1 - a) * bg[1]);
        const blendedB = Math.round(a * b + (1 - a) * bg[2]);
        return `#${((1 << 24) + (blendedR << 16) + (blendedG << 8) + blendedB).toString(16).slice(1).padStart(6, '0')}`;
    }

    function updateSwatchTextColor(swatch, colorValue) {
        try {
            const value = normalizeCssColor(colorValue);
            if (chroma.valid(value)) {
                const color = chroma(value);
                const textColor = color.luminance() > 0.5 ? 'black' : 'white';
                const spans = swatch.querySelectorAll('span');
                spans.forEach(span => span.style.color = textColor);
            }
        } catch (e) {
            console.error(`Error processing color: ${colorValue}`, e);
        }
    }

    function updateColorScales(styles, changedVar = null) {
        const lightPrimary = styles.getPropertyValue('--color-light-scale-1').trim();
        const lightSecondary = styles.getPropertyValue('--color-light-scale-6').trim() || blendRgbaWithBackground(styles.getPropertyValue('--color-accent-opaque-light-secondary').trim(), '#ffffff');
        const darkPrimary = styles.getPropertyValue('--color-dark-scale-1').trim();
        const darkSecondary = styles.getPropertyValue('--color-dark-scale-6').trim() || blendRgbaWithBackground(styles.getPropertyValue('--color-accent-opaque-dark-secondary').trim(), '#000000');

        if ((changedVar === '--color-light-scale-1' || changedVar === '--color-light-scale-6') && lightPrimary && lightSecondary) {
            const startColor = changedVar === '--color-light-scale-6' ? lightSecondary : lightPrimary;
            const endColor = changedVar === '--color-light-scale-6' ? lightPrimary : lightSecondary;
            const lightScale = chroma.scale([startColor, endColor]).mode('lch').colors(6);
            for (let i = 1; i <= 6; i++) {
                root.style.setProperty(`--color-light-scale-${i}`, lightScale[i - 1]);
            }
            console.log('Updated light scale:', lightScale);
        }

        if ((changedVar === '--color-dark-scale-1' || changedVar === '--color-dark-scale-6') && darkPrimary && darkSecondary) {
            const startColor = changedVar === '--color-dark-scale-6' ? darkSecondary : darkPrimary;
            const endColor = changedVar === '--color-dark-scale-6' ? darkPrimary : darkSecondary;
            const darkScale = chroma.scale([startColor, endColor]).mode('lch').colors(6);
            for (let i = 1; i <= 6; i++) {
                root.style.setProperty(`--color-dark-scale-${i}`, darkScale[i - 1]);
            }
            console.log('Updated dark scale:', darkScale);
        }

        document.querySelectorAll('.color-swatch').forEach(swatch => {
            const varName = swatch.dataset.varName;
            const value = styles.getPropertyValue(varName).trim();
            if (value) {
                swatch.classList.remove('color-swatch');
                void swatch.offsetWidth; // Trigger reflow
                swatch.classList.add('color-swatch');
                swatch.style.backgroundColor = `var(${varName})`;
                updateSwatchTextColor(swatch, value);
                swatch.querySelectorAll('span')[1].textContent = value;
            } else {
                console.warn(`No value for ${varName} in swatch update`);
            }
        });
    }

    function initializeColorPalette() {
        const styles = getComputedStyle(root);
        const knownColorVars = [
            '--color-background-light',
            '--color-background-dark',
            '--color-accent-opaque-light-primary',
            '--color-accent-opaque-light-secondary',
            '--color-accent-opaque-dark-primary',
            '--color-accent-opaque-dark-secondary',
            '--color-static-light',
            '--color-static-dark',
            '--color-static-dark-1',
            '--color-static-light-1',
            '--color-static-dark-2',
            '--color-static-light-2',
            '--color-static-dark-4',
            '--color-static-light-4',
            '--color-static-dark-6',
            '--color-static-light-6',
            '--color-static-dark-8',
            '--color-static-light-8',
            '--color-light-scale-1',
            '--color-light-scale-2',
            '--color-light-scale-3',
            '--color-light-scale-4',
            '--color-light-scale-5',
            '--color-light-scale-6',
            '--color-dark-scale-1',
            '--color-dark-scale-2',
            '--color-dark-scale-3',
            '--color-dark-scale-4',
            '--color-dark-scale-5',
            '--color-dark-scale-6'
        ];

        const colorVars = [];
        // Check each known variable explicitly
        knownColorVars.forEach(prop => {
            const value = styles.getPropertyValue(prop).trim();
            if (value) {
                colorVars.push(prop);
            } else {
                console.warn(`No value found for ${prop}`);
            }
        });

        console.log('Detected color variables:', colorVars);

        const groups = {
            'color-background': document.getElementById('color-background'),
            'color-accent-light': document.getElementById('color-accent-light'),
            'color-accent-dark': document.getElementById('color-accent-dark'),
            'color-accent-opaque-light': document.getElementById('color-accent-opaque-light'),
            'color-accent-opaque-dark': document.getElementById('color-accent-opaque-dark'),
            'color-static-light': document.getElementById('color-static-light'),
            'color-static-dark': document.getElementById('color-static-dark')
        };

        colorVars.forEach(varName => {
            let groupKey = '';
            if (varName.includes('background')) {
                groupKey = 'color-background';
            } else if (varName.includes('accent-light') && !varName.includes('opaque')) {
                groupKey = 'color-accent-light';
            } else if (varName.includes('accent-dark') && !varName.includes('opaque')) {
                groupKey = 'color-accent-dark';
            } else if (varName.includes('accent-opaque-light')) {
                groupKey = 'color-accent-opaque-light';
            } else if (varName.includes('accent-opaque-dark')) {
                groupKey = 'color-accent-opaque-dark';
            } else if (varName.includes('static-light')) {
                groupKey = 'color-static-light';
            } else if (varName.includes('static-dark')) {
                groupKey = 'color-static-dark';
            } else if (varName.includes('light-scale')) {
                groupKey = 'color-accent-light';
            } else if (varName.includes('dark-scale')) {
                groupKey = 'color-accent-dark';
            }

            const palette = groups[groupKey];
            if (!palette) {
                console.warn(`No palette found for ${varName}`);
                return;
            }

            const value = styles.getPropertyValue(varName).trim();
            if (!value) {
                console.warn(`Skipping ${varName}, empty value`);
                return;
            }

            const div = document.createElement('div');
            div.className = 'color-swatch';
            div.style.backgroundColor = `var(${varName})`;
            div.dataset.varName = varName;

            const nameSpan = document.createElement('span');
            nameSpan.textContent = varName;

            const valueSpan = document.createElement('span');
            valueSpan.textContent = value;

            div.appendChild(nameSpan);
            div.appendChild(valueSpan);

            updateSwatchTextColor(div, value);
            palette.appendChild(div);
        });

        // Initial scale update
        updateColorScales(styles);
    }

    // Set up color input listeners
    const colorInputs = {
        'light-scale-1': document.getElementById('light-scale-1'),
        'light-scale-6': document.getElementById('light-scale-6'),
        'dark-scale-1': document.getElementById('dark-scale-1'),
        'dark-scale-6': document.getElementById('dark-scale-6')
    };

    Object.entries(colorInputs).forEach(([key, input]) => {
        if (input) {
            input.addEventListener('input', () => {
                const varName = `--color-${key}`;
                root.style.setProperty(varName, input.value);
                console.log(`Updated ${varName} to ${input.value}`);
                updateColorScales(getComputedStyle(root), varName);
            });
        } else {
            console.warn(`Color input for ${key} not found`);
        }
    });

    // Initialize the palette
    initializeColorPalette();
});