let isInitialized = false;

function setupColorPalette() {
    if (isInitialized) {
        console.log('Color palette already initialized, skipping');
        return;
    }
    isInitialized = true;

    console.log('Load event fired');

    const root = document.documentElement;

    const modes = ['hsl', 'lab', 'hcl', 'rgb', 'hsv', 'hsi'];

    // Add styles for color inputs, swatches, and copy button only if not already present
    if (!document.querySelector('style[data-color-setup]')) {
        const style = document.createElement('style');
        style.setAttribute('data-color-setup', 'true');
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
            .color-inputs input[type="color"] {
                padding: 0;
                height: 50px;
            }
            .color-inputs button {
                font-size: 16px;
            }
            .color-swatch span {
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
            }
        `;
        document.head.appendChild(style);
    }

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

    function generateOpaqueScales(styles) {
        // Generate opaque light scales with alpha 0.2 for LCH (no mode suffix)
        for (let i = 1; i <= 6; i++) {
            let solidColor = styles.getPropertyValue(`--color-light-scale-${i}`).trim();
            if (!solidColor) solidColor = root.style.getPropertyValue(`--color-light-scale-${i}`).trim();
            if (solidColor && chroma.valid(solidColor)) {
                const opaqueColor = chroma(solidColor).alpha(0.2).css();
                root.style.setProperty(`--color-accent-opaque-light-scale-${i}`, opaqueColor);
            }
        }

        // Generate opaque dark scales with alpha 0.5 for LCH (no mode suffix)
        for (let i = 1; i <= 6; i++) {
            let solidColor = styles.getPropertyValue(`--color-dark-scale-${i}`).trim();
            if (!solidColor) solidColor = root.style.getPropertyValue(`--color-dark-scale-${i}`).trim();
            if (solidColor && chroma.valid(solidColor)) {
                const opaqueColor = chroma(solidColor).alpha(0.5).css();
                root.style.setProperty(`--color-accent-opaque-dark-scale-${i}`, opaqueColor);
            }
        }

        // Generate for other modes
        modes.forEach(mode => {
            // Light
            for (let i = 1; i <= 6; i++) {
                let solidColor = styles.getPropertyValue(`--color-light-scale-${mode}-${i}`).trim();
                if (!solidColor) solidColor = root.style.getPropertyValue(`--color-light-scale-${mode}-${i}`).trim();
                if (solidColor && chroma.valid(solidColor)) {
                    const opaqueColor = chroma(solidColor).alpha(0.2).css();
                    root.style.setProperty(`--color-accent-opaque-light-scale-${mode}-${i}`, opaqueColor);
                }
            }
            // Dark
            for (let i = 1; i <= 6; i++) {
                let solidColor = styles.getPropertyValue(`--color-dark-scale-${mode}-${i}`).trim();
                if (!solidColor) solidColor = root.style.getPropertyValue(`--color-dark-scale-${mode}-${i}`).trim();
                if (solidColor && chroma.valid(solidColor)) {
                    const opaqueColor = chroma(solidColor).alpha(0.5).css();
                    root.style.setProperty(`--color-accent-opaque-dark-scale-${mode}-${i}`, opaqueColor);
                }
            }
        });
    }

    function updateColorScales(styles) {
        const lightPrimary = styles.getPropertyValue('--color-light-scale-1').trim() || '#cacdd6';
        const lightSecondary = styles.getPropertyValue('--color-light-scale-6').trim() || '#f8f7f7';
        const darkPrimary = styles.getPropertyValue('--color-dark-scale-1').trim() || '#868eaa';
        const darkSecondary = styles.getPropertyValue('--color-dark-scale-6').trim() || '#140612';

        // Generate LCH scales (no mode suffix)
        const lightScaleLch = chroma.scale([lightPrimary, lightSecondary]).mode('lch').colors(6);
        for (let i = 1; i <= 6; i++) {
            root.style.setProperty(`--color-light-scale-${i}`, lightScaleLch[i - 1]);
        }
        console.log('Updated light scale LCH:', lightScaleLch);

        const darkScaleLch = chroma.scale([darkPrimary, darkSecondary]).mode('lch').colors(6);
        for (let i = 1; i <= 6; i++) {
            root.style.setProperty(`--color-dark-scale-${i}`, darkScaleLch[i - 1]);
        }
        console.log('Updated dark scale LCH:', darkScaleLch);

        // Generate other modes
        modes.forEach(mode => {
            const lightScale = chroma.scale([lightPrimary, lightSecondary]).mode(mode).colors(6);
            for (let i = 1; i <= 6; i++) {
                root.style.setProperty(`--color-light-scale-${mode}-${i}`, lightScale[i - 1]);
            }
            console.log(`Updated light scale ${mode.toUpperCase()}:`, lightScale);

            const darkScale = chroma.scale([darkPrimary, darkSecondary]).mode(mode).colors(6);
            for (let i = 1; i <= 6; i++) {
                root.style.setProperty(`--color-dark-scale-${mode}-${i}`, darkScale[i - 1]);
            }
            console.log(`Updated dark scale ${mode.toUpperCase()}:`, darkScale);
        });

        // Regenerate opaque scales after solid updates
        generateOpaqueScales(styles);

        // Update existing swatches
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

    function waitForStylesheet(href, callback, timeout = 10000) {
        const start = Date.now();
        const check = () => {
            const sheets = Array.from(document.styleSheets).map(sheet => sheet.href || 'inline');
            for (const sheet of document.styleSheets) {
                if (sheet.href && (sheet.href.includes(href) || sheet.href.includes('styles.css'))) {
                    console.log(`✅ Found ${sheet.href}`);
                    callback();
                    return true;
                }
            }
            if (Date.now() - start > timeout) {
                console.error(`Timeout waiting for ${href}`);
                console.log('Final stylesheets:', sheets);
                callback(); // Proceed with fallback values
                return false;
            }
            console.log(`Waiting for ${href}…`);
            setTimeout(check, 100);
        };
        check();
    }

    function initializeColorPalette() {
        const styles = getComputedStyle(root);
        const baseColorVars = [
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
            '--color-static-light-8'
        ];

        // Add LCH scales and opaques (no suffix)
        for (let i = 1; i <= 6; i++) {
            baseColorVars.push(`--color-light-scale-${i}`);
            baseColorVars.push(`--color-dark-scale-${i}`);
            baseColorVars.push(`--color-accent-opaque-light-scale-${i}`);
            baseColorVars.push(`--color-accent-opaque-dark-scale-${i}`);
        }

        // Add other modes' scales and opaques
        modes.forEach(mode => {
            for (let i = 1; i <= 6; i++) {
                baseColorVars.push(`--color-light-scale-${mode}-${i}`);
                baseColorVars.push(`--color-dark-scale-${mode}-${i}`);
                baseColorVars.push(`--color-accent-opaque-light-scale-${mode}-${i}`);
                baseColorVars.push(`--color-accent-opaque-dark-scale-${mode}-${i}`);
            }
        });

        // Set fallback values for critical LCH variables
        root.style.setProperty('--color-light-scale-1', styles.getPropertyValue('--color-light-scale-1').trim() || '#cacdd6');
        root.style.setProperty('--color-light-scale-6', styles.getPropertyValue('--color-light-scale-6').trim() || '#f8f7f7');
        root.style.setProperty('--color-dark-scale-1', styles.getPropertyValue('--color-dark-scale-1').trim() || '#868eaa');
        root.style.setProperty('--color-dark-scale-6', styles.getPropertyValue('--color-dark-scale-6').trim() || '#140612');

        // Initial scale update to generate all variables
        updateColorScales(getComputedStyle(root));

        // Re-fetch styles after generating all
        const updatedStyles = getComputedStyle(root);

        const colorVars = [];
        baseColorVars.forEach(prop => {
            const value = updatedStyles.getPropertyValue(prop).trim();
            if (value) {
                colorVars.push(prop);
            } else {
                console.warn(`No value found for ${prop}`);
            }
        });

        console.log('Detected color variables:', colorVars);

        // Set initial input values to match CSS variables
        const lightScale1 = updatedStyles.getPropertyValue('--color-light-scale-1').trim() || '#cacdd6';
        const lightScale6 = updatedStyles.getPropertyValue('--color-light-scale-6').trim() || '#f8f7f7';
        const darkScale1 = updatedStyles.getPropertyValue('--color-dark-scale-1').trim() || '#868eaa';
        const darkScale6 = updatedStyles.getPropertyValue('--color-dark-scale-6').trim() || '#140612';

        document.getElementById('light-scale-1').value = lightScale1;
        document.getElementById('light-scale-6').value = lightScale6;
        document.getElementById('dark-scale-1').value = darkScale1;
        document.getElementById('dark-scale-6').value = darkScale6;

        const groups = {
            'color-accent-light': document.getElementById('color-accent-light'),
            'color-accent-dark': document.getElementById('color-accent-dark'),
            'color-accent-opaque-light': document.getElementById('color-accent-opaque-light'),
            'color-accent-opaque-dark': document.getElementById('color-accent-opaque-dark'),
            'color-static-light': document.getElementById('color-static-light'),
            'color-static-dark': document.getElementById('color-static-dark')
        };

        // Add groups for other modes
        modes.forEach(mode => {
            groups[`color-accent-light-${mode}`] = document.getElementById(`color-accent-light-${mode}`);
            groups[`color-accent-dark-${mode}`] = document.getElementById(`color-accent-dark-${mode}`);
            groups[`color-accent-opaque-light-${mode}`] = document.getElementById(`color-accent-opaque-light-${mode}`);
            groups[`color-accent-opaque-dark-${mode}`] = document.getElementById(`color-accent-opaque-dark-${mode}`);
        });

        // Clear existing swatches to prevent duplicates
        Object.values(groups).forEach(palette => {
            if (palette) palette.innerHTML = '';
        });

        colorVars.forEach(varName => {
            let groupKey = '';
            if (varName.includes('static-light')) {
                groupKey = 'color-static-light';
            } else if (varName.includes('static-dark')) {
                groupKey = 'color-static-dark';
            } else if (varName.includes('light-scale') && !varName.match(/light-scale-\w+-\d+$/)) {
                groupKey = 'color-accent-light';
            } else if (varName.includes('dark-scale') && !varName.match(/dark-scale-\w+-\d+$/)) {
                groupKey = 'color-accent-dark';
            } else if (varName.includes('accent-opaque-light-scale') && !varName.match(/accent-opaque-light-scale-\w+-\d+$/)) {
                groupKey = 'color-accent-opaque-light';
            } else if (varName.includes('accent-opaque-dark-scale') && !varName.match(/accent-opaque-dark-scale-\w+-\d+$/)) {
                groupKey = 'color-accent-opaque-dark';
            } else if (varName.match(/light-scale-(\w+)-(\d+)$/)) {
                const modeMatch = varName.match(/light-scale-(\w+)-(\d+)$/);
                const mode = modeMatch[1];
                groupKey = `color-accent-light-${mode}`;
            } else if (varName.match(/dark-scale-(\w+)-(\d+)$/)) {
                const modeMatch = varName.match(/dark-scale-(\w+)-(\d+)$/);
                const mode = modeMatch[1];
                groupKey = `color-accent-dark-${mode}`;
            } else if (varName.match(/accent-opaque-light-scale-(\w+)-(\d+)$/)) {
                const modeMatch = varName.match(/accent-opaque-light-scale-(\w+)-(\d+)$/);
                const mode = modeMatch[1];
                groupKey = `color-accent-opaque-light-${mode}`;
            } else if (varName.match(/accent-opaque-dark-scale-(\w+)-(\d+)$/)) {
                const modeMatch = varName.match(/accent-opaque-dark-scale-(\w+)-(\d+)$/);
                const mode = modeMatch[1];
                groupKey = `color-accent-opaque-dark-${mode}`;
            }

            const palette = groups[groupKey];
            if (!palette) {
                console.warn(`No palette found for ${varName}`);
                return;
            }

            const value = updatedStyles.getPropertyValue(varName).trim() || root.style.getPropertyValue(varName).trim();
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

        // Set up copy button listeners
        const copyButtons = ['copy-css-vars', ...modes.map(m => `copy-css-vars-${m}`)];
        copyButtons.forEach(btnId => {
            const copyButton = document.getElementById(btnId);
            if (copyButton) {
                copyButton.addEventListener('click', () => {
                    const styles = getComputedStyle(root);
                    let varsToCopy;
                    if (btnId === 'copy-css-vars') {
                        // Original LCH + statics
                        varsToCopy = [
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
                            '--color-dark-scale-6',
                            '--color-accent-opaque-light-scale-1',
                            '--color-accent-opaque-light-scale-2',
                            '--color-accent-opaque-light-scale-3',
                            '--color-accent-opaque-light-scale-4',
                            '--color-accent-opaque-light-scale-5',
                            '--color-accent-opaque-light-scale-6',
                            '--color-accent-opaque-dark-scale-1',
                            '--color-accent-opaque-dark-scale-2',
                            '--color-accent-opaque-dark-scale-3',
                            '--color-accent-opaque-dark-scale-4',
                            '--color-accent-opaque-dark-scale-5',
                            '--color-accent-opaque-dark-scale-6',
                            '--color-static-light',
                            '--color-static-dark'
                        ];
                    } else {
                        // Mode-specific
                        const mode = btnId.replace('copy-css-vars-', '');
                        varsToCopy = [];
                        for (let i = 1; i <= 6; i++) {
                            varsToCopy.push(`--color-light-scale-${mode}-${i}`);
                            varsToCopy.push(`--color-dark-scale-${mode}-${i}`);
                            varsToCopy.push(`--color-accent-opaque-light-scale-${mode}-${i}`);
                            varsToCopy.push(`--color-accent-opaque-dark-scale-${mode}-${i}`);
                        }
                    }

                    const cssOutput = varsToCopy.map(varName => {
                        const value = styles.getPropertyValue(varName).trim();
                        return value ? `${varName}: ${value};` : null;
                    }).filter(line => line).join('\n');

                    navigator.clipboard.writeText(cssOutput).then(() => {
                        const modeName = btnId === 'copy-css-vars' ? 'LCH' : btnId.replace('copy-css-vars-', '').toUpperCase();
                        alert(`${modeName} CSS variables copied to clipboard!`);
                    }).catch(err => {
                        console.error(`Failed to copy ${btnId} variables:`, err);
                        alert('Failed to copy CSS variables. Check the console for details.');
                    });
                });
            } else {
                console.warn(`${btnId} button not found`);
            }
        });
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
                updateColorScales(getComputedStyle(root));
            });
        } else {
            console.warn(`Color input for ${key} not found`);
        }
    });

    // Wait for styles.css before initializing
    waitForStylesheet('styles.css', initializeColorPalette);
}

// Remove any existing load listeners to prevent duplicates
window.removeEventListener('load', setupColorPalette);
window.addEventListener('load', setupColorPalette);