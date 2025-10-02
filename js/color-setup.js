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

    function waitForStylesheet(href, callback, timeout = 5000) {
        const start = Date.now();
        const check = () => {
            for (const sheet of document.styleSheets) {
                if (sheet.href && sheet.href.includes(href)) {
                    console.log(`✅ Found ${href}`);
                    callback();
                    return true;
                }
            }
            if (Date.now() - start > timeout) {
                console.error(`Timeout waiting for ${href}`);
                callback(); // Run callback anyway to avoid hanging
                return false;
            }
            console.log(`Waiting for ${href}…`);
            setTimeout(check, 100); // Poll every 100ms
        };
        check();
    }

    waitForStylesheet('styles.css', () => {
        console.log('Running color setup');
        const styles = getComputedStyle(root);
        const colorVars = Object.keys(styles)
            .filter(prop => prop.startsWith('--color-'))
            .map(prop => prop);

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
    });
});