// Function to create picture tag string (unchanged)
function createPictureTagString(id, imageUrl) {
    return `
        <picture>
            <!-- light -->
            <source srcset="${imageUrl}"
                    media="(max-width: 767px) and (resolution < 1.5dppx) and (prefers-color-scheme: light)" />
            <source srcset="${imageUrl}"
                    media="(max-width: 767px) and (resolution >= 1.5dppx) and (prefers-color-scheme: light)" />
            <source srcset="${imageUrl}"
                    media="(min-width: 768px) and (max-width: 1366px) and (resolution < 1.5dppx) and (prefers-color-scheme: light)" />
            <source srcset="${imageUrl}"
                    media="(min-width: 768px) and (max-width: 1366px) and (resolution >= 1.5dppx) and (resolution < 2dppx) and (prefers-color-scheme: light)" />
            <source srcset="${imageUrl}"
                    media="(min-width: 768px) and (max-width: 1366px) and (resolution >= 2dppx) and (prefers-color-scheme: light)" />
            <source srcset="${imageUrl}"
                    media="(min-width: 1367px) and (resolution < 1.2dppx) and (prefers-color-scheme: light)" />
            <source srcset="${imageUrl}"
                    media="(min-width: 1367px) and (resolution >= 1.2dppx) and (resolution < 2dppx) and (prefers-color-scheme: light)" />
            <source srcset="${imageUrl}"
                    media="(min-width: 1367px) and (resolution >= 2dppx) and (prefers-color-scheme: light)" />
            <!-- dark -->
            <source srcset="${imageUrl}"
                    media="(max-width: 767px) and (resolution < 1.5dppx) and (prefers-color-scheme: dark)" />
            <source srcset="${imageUrl}"
                    media="(max-width: 767px) and (resolution >= 1.5dppx) and (prefers-color-scheme: dark)" />
            <source srcset="${imageUrl}"
                    media="(min-width: 768px) and (max-width: 1366px) and (resolution < 1.5dppx) and (prefers-color-scheme: dark)" />
            <source srcset="${imageUrl}"
                    media="(min-width: 768px) and (max-width: 1366px) and (resolution >= 1.5dppx) and (resolution < 2dppx) and (prefers-color-scheme: dark)" />
            <source srcset="${imageUrl}"
                    media="(min-width: 768px) and (max-width: 1366px) and (resolution >= 2dppx) and (prefers-color-scheme: dark)" />
            <source srcset="${imageUrl}"
                    media="(min-width: 1367px) and (resolution < 1.2dppx) and (prefers-color-scheme: dark)" />
            <source srcset="${imageUrl}"
                    media="(min-width: 1367px) and (resolution >= 1.2dppx) and (resolution < 2dppx) and (prefers-color-scheme: dark)" />
            <source srcset="${imageUrl}"
                    media="(min-width: 1367px) and (resolution >= 2dppx) and (prefers-color-scheme: dark)" />
            <img width="100%" src="${imageUrl}" alt="Alt title" title="Image title" loading="lazy"
                 id="${id}" />
        </picture>
    `;
}