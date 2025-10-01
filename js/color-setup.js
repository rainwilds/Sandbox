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
        if (isRgba || parts.length === 4) {
            return `rgba(${r},${g},${b},${a})`;
        } else {
            return `rgb(${r},${g},${b})`;
        }
    }

    // Helper: extract all CSS custom props from stylesheets
    function getAllCssVars() {
        const vars = new Set();
        for (const sheet of document.styleSheets) {
            try {
                for (const rule of sheet.cssRules) {
                    if (rule.style) {
                        for (const prop of rule.style) {
                            if (prop.startsWith('--color-')) {
                                vars.add(prop);
                            }
                        }
                    }
                }
            } catch (e) {
                // Ignore cross-origin stylesheet access errors
            }
        }
        return Array.from(vars);
    }

    console.log('Example var: ' + getComputedStyle(root).getPropertyValue('--color-background-light'));

    // Derive and set light primary opaque
    let lightPrimarySolid = getComputedStyle(root).getPropertyValue('--color-accent-light-primary').trim();
    lightPrimarySolid = normalizeCssColor(lightPrimarySolid);
    const lightPrimaryDerived = chroma(lightPrimarySolid)
        .set('hsl.h', 311)
        .set('hsl.s', chroma(lightPrimarySolid).get('hsl.s') * 3.77)
        .set('hsl.l', chroma(lightPrimarySolid).get('hsl.l') * 0.51)
        .alpha(0.2)
        .css();
    root.style.setProperty('--color-accent-opaque-light-primary', lightPrimaryDerived);

    // Derive and set light secondary opaque
    let lightSecondarySolid = getComputedStyle(root).getPropertyValue('--color-accent-light-secondary').trim();
    lightSecondarySolid = normalizeCssColor(lightSecondarySolid);
    const lightSecondaryDerived = chroma(lightSecondarySolid)
        .set('hsl.h', 301)
        .set('hsl.s', chroma(lightSecondarySolid).get('hsl.s') * 1.48)
        .set('hsl.l', chroma(lightSecondarySolid).get('hsl.l') * 0.86)
        .alpha(0.2)
        .css();
    root.style.setProperty('--color-accent-opaque-light-secondary', lightSecondaryDerived);

    // Derive and set dark primary opaque
    let darkPrimarySolid = getComputedStyle(root).getPropertyValue('--color-accent-dark-primary').trim();
    darkPrimarySolid = normalizeCssColor(darkPrimarySolid);
    const darkPrimaryDerived = chroma(darkPrimarySolid)
        .set('hsl.h', 311)
        .set('hsl.s', chroma(darkPrimarySolid).get('hsl.s') * 3.76)
        .set('hsl.l', chroma(darkPrimarySolid).get('hsl.l') * 0.27)
        .alpha(0.5)
        .css();
    root.style.setProperty('--color-accent-opaque-dark-primary', darkPrimaryDerived);

    // Derive and set dark secondary opaque
    let darkSecondarySolid = getComputedStyle(root).getPropertyValue('--color-accent-dark-secondary').trim();
    darkSecondarySolid = normalizeCssColor(darkSecondarySolid);
    const darkSecondaryDerived = chroma(darkSecondarySolid)
        .set('hsl.h', 311)
        .set('hsl.s', chroma(darkSecondarySolid).get('hsl.s') * 1.5)
        .set('hsl.l', chroma(darkSecondarySolid).get('hsl.l') * 0.25)
        .alpha(0.5)
        .css();
    root.style.setProperty('--color-accent-opaque-dark-secondary', darkSecondaryDerived);

    // Collect all --color-* variables
    const styles = getComputedStyle(root);
    const colorVars = getAllCssVars();

    console.log('Number of color vars: ' + colorVars.length);
    console.log(colorVars);

    // Build swatches
    const palette = document.getElementById('color-palette');
    if (palette) {
        colorVars.forEach(varName => {
            let value = styles.getPropertyValue(varName).trim();
            console.log(varName + ': ' + value);

            // Skip if not defined or invalid
            if (!value || value === 'none') {
                console.warn(`Skipping ${varName}, no usable value`);
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
                // Guard again in case normalizeCssColor returns garbage
                if (value && chroma.valid(value)) {
                    const color = chroma(value);
                    const textColor = color.luminance() > 0.5 ? 'black' : 'white';
                    nameSpan.style.color = textColor;
                    valueSpan.style.color = textColor;
                } else {
                    console.warn(`Skipping chroma() for ${varName}, invalid value: ${value}`);
                    nameSpan.style.color = 'black';
                    valueSpan.style.color = 'black';
                }
            } catch (e) {
                console.error(`Error processing ${varName}: ${value}`, e);
                nameSpan.style.color = 'black';
                valueSpan.style.color = 'black';
            }

            palette.appendChild(div);
        });
    } else {
        console.error('Color palette container not found');
    }

});
