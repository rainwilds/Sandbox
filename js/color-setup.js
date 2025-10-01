window.addEventListener('load', () => {
    console.log('Load event fired');
    const root = document.documentElement;

    function normalizeCssColor(str) {
        str = str.trim();
        if (!str.startsWith('rgb')) return str;
        let isRgba = str.startsWith('rgba');
        let inner = str.slice(isRgba ? 5 : 4, -1).trim();
        let parts = inner.split(/\s+|\//).filter(p => p !== '');
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

    // Similar for others...

    // (keep the derivation code)

    // Now generate swatches
    const styles = getComputedStyle(root);
    const colorVars = [];
    for (let i = 0; i < styles.length; i++) {
        const prop = styles[i];
        if (prop.startsWith('--color-')) {
            colorVars.push(prop);
        }
    }
    console.log('Number of color vars: ' + colorVars.length);
    console.log(colorVars);

    const palette = document.getElementById('color-palette');
    if (palette) {
        colorVars.forEach(varName => {
            let value = styles.getPropertyValue(varName).trim();
            console.log(varName + ': ' + value);
            if (value && value !== 'none' && value !== '') {
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
                    const color = chroma(value);
                    const textColor = color.luminance() > 0.5 ? 'black' : 'white';
                    nameSpan.style.color = textColor;
                    valueSpan.style.color = textColor;
                } catch (e) {
                    console.error(`Error processing ${varName}: ${value}`, e);
                    nameSpan.style.color = 'black';
                    valueSpan.style.color = 'black';
                }

                palette.appendChild(div);
            }
        });
    } else {
        console.error('Color palette container not found');
    }
});