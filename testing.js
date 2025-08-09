// Wait for DOM to load
document.addEventListener('DOMContentLoaded', () => {
    // Find all custom-card elements
    const cards = document.querySelectorAll('custom-card');
    if (cards.length === 0) return;

    cards.forEach(card => {
        // Get the parent container for each card
        const parent = card.parentElement;
        if (!parent) return;

        // Get attributes from the card
        const attributes = {};
        for (const attr of card.attributes) {
            attributes[attr.name] = attr.value;
        }

        // Get estimated dimensions using parent's width
        const containerWidth = parent.clientWidth || window.innerWidth;
        const { width, height } = CustomCard.getEstimatedDimensions(attributes, containerWidth);

        // Apply skeleton class and reserve space
        card.classList.add('skeleton');
        card.style.minHeight = `${height}px`; // Prevent layout shift
        card.style.width = '100%'; // Match container width
        card.setAttribute('aria-busy', 'true'); // Accessibility

        // Add callback to clean up skeleton after render
        card.addCallback(() => {
            const renderedCard = parent.querySelector('.card');
            if (renderedCard) {
                renderedCard.classList.remove('skeleton');
                renderedCard.removeAttribute('aria-busy');
            }
        });
    });
});