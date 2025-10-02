window.addEventListener('load', () => {
    console.log('Load event fired');

    const root = document.documentElement;

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

        // Force swatch updates
        document.querySelectorAll('.color-swatch').forEach(swatch => {
            const varName = swatch.dataset.varName;
            const value = styles.getPropertyValue(varName).trim();
            if (value) {
                // Toggle class to force repaint
                swatch.classList.remove('color-swatch');
                void swatch.offsetWidth; // Trigger reflow
                swatch.classList.add('color-swatch');
                swatch.style.backgroundColor = `var(${varName})`;
                updateSwatchTextColor(swatch, value);
                swatch.querySelectorAll('span')[1].textContent = value;
            }
        });
    }

    function waitForStylesheet(href, callback, timeout = 10000) {
        const start = Date.now();
        const check = () => {
            const sheets = Array.from(document.styleSheets).map(sheet => sheet.href || 'inline');
            console.log('Available stylesheets:', sheets);
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
                callback();
                return false;
            }
            console.log(`Waiting for ${href}…`);
            setTimeout(check, 100);
        };
        check();
    }

    waitForStylesheet('styles.css', () => {
        console.log('Running color setup');
        setTimeout(() => {
            const styles = getComputedStyle(root);
            const colorVars = [];
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
            // Try enumerating all properties
            const allProps = window.getComputedStyle(root);
            console.log('Total computed properties:', allProps.length);
            for (let i = 0; i < allProps.length; i++) {
                const prop = allProps.item(i);
                if (prop.startsWith('--color-') && ![
                    '--color-accent-light-primary',
                    '--color-accent-light-secondary',
                    '--color-accent-dark-primary',
                    '--color-accent-dark-secondary'
                ].includes(prop)) {
                    colorVars.push(prop);
                }
            }
            // Fallback: explicitly check known variables
            if (colorVars.length === 0) {
                console.log('Falling back to known color variables');
                knownColorVars.forEach(prop => {
                    if (styles.getPropertyValue(prop).trim()) {
                        colorVars.push(prop);
                    }
                });
            }
            console.log('Test var: ' + styles.getPropertyValue('--color-background-light'));
            console.log('Number of color vars: ' + colorVars.length);
            console.log(colorVars);

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

            // Track last known values for polling
            let lastLightScale1 = styles.getPropertyValue('--color-light-scale-1').trim();
            let lastLightScale6 = styles.getPropertyValue('--color-light-scale-6').trim();
            let lastDarkScale1 = styles.getPropertyValue('--color-dark-scale-1').trim();
            let lastDarkScale6 = styles.getPropertyValue('--color-dark-scale-6').trim();

            // MutationObserver with debouncing
            let debounceTimeout;
            const observer = new MutationObserver((mutations) => {
                clearTimeout(debounceTimeout);
                debounceTimeout = setTimeout(() => {
                    const styles = getComputedStyle(root);
                    const style = root.getAttribute('style') || '';
                    let changedVar = null;
                    if (style.includes('--color-light-scale-1')) {
                        changedVar = '--color-light-scale-1';
                    } else if (style.includes('--color-light-scale-6')) {
                        changedVar = '--color-light-scale-6';
                    } else if (style.includes('--color-dark-scale-1')) {
                        changedVar = '--color-dark-scale-1';
                    } else if (style.includes('--color-dark-scale-6')) {
                        changedVar = '--color-dark-scale-6';
                    }
                    console.log('Style change detected, changed variable:', changedVar, 'Style attribute:', style);
                    updateColorScales(styles, changedVar);
                }, 100);
            });
            observer.observe(root, { attributes: true, attributeFilter: ['style'] });

            // Polling fallback
            setInterval(() => {
                const styles = getComputedStyle(root);
                const currentLightScale1 = styles.getPropertyValue('--color-light-scale-1').trim();
                const currentLightScale6 = styles.getPropertyValue('--color-light-scale-6').trim();
                const currentDarkScale1 = styles.getPropertyValue('--color-dark-scale-1').trim();
                const currentDarkScale6 = styles.getPropertyValue('--color-dark-scale-6').trim();
                if (currentLightScale1 !== lastLightScale1) {
                    console.log('Polling detected change in --color-light-scale-1:', currentLightScale1);
                    updateColorScales(styles, '--color-light-scale-1');
                    lastLightScale1 = currentLightScale1;
                } else if (currentLightScale6 !== lastLightScale6) {
                    console.log('Polling detected change in --color-light-scale-6:', currentLightScale6);
                    updateColorScales(styles, '--color-light-scale-6');
                    lastLightScale6 = currentLightScale6;
                }
                if (currentDarkScale1 !== lastDarkScale1) {
                    console.log('Polling detected change in --color-dark-scale-1:', currentDarkScale1);
                    updateColorScales(styles, '--color-dark-scale-1');
                    lastDarkScale1 = currentDarkScale1;
                } else if (currentDarkScale6 !== lastDarkScale6) {
                    console.log('Polling detected change in --color-dark-scale-6:', currentDarkScale6);
                    updateColorScales(styles, '--color-dark-scale-6');
                    lastDarkScale6 = currentDarkScale6;
                }
            }, 500);

            // Initial scale update
            updateColorScales(styles);
        }, 500);
    });
});