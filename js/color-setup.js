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
                '--color-accent-light-primary',
                '--color-accent-light-secondary',
                '--color-accent-dark-primary',
                '--color-accent-dark-secondary',
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
                if (prop.startsWith('--color-')) {
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

            const palette = document.getElementById('color-palette');
            if (palette) {
                colorVars.forEach(varName => {
                    let value = styles.getPropertyValue(varName).trim();
                    if (!value) {
                        console.warn(`Skipping ${varName}, empty value`);
                        return;
                    }
                    const div = document.createElement('div');
                    div.className = 'color-swatch';
                    div.style.backgroundColor = value;
                    const nameSpan = document.createElement('span');
                    nameSpan.textContent = varName;
                    const valueSpan = document.createElement('span');
                    valueSpan.textContent = value;
                    div.appendChild(nameSpan);
                    div.appendChild(valueSpan);
                    try {
                        value = normalizeCssColor(value);
                        if (chroma.valid(value)) {
                            const color = chroma(value);
                            const textColor = color.luminance() > 0.5 ? 'black' : 'white';
                            nameSpan.style.color = textColor;
                            valueSpan.style.color = textColor;
                        }
                    } catch (e) {
                        console.error(`Error processing ${varName}: ${value}`, e);
                    }
                    palette.appendChild(div);
                });
            } else {
                console.error('Color palette container not found');
            }
        }, 500);
    });
});