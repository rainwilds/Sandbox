document.addEventListener('DOMContentLoaded', async () => {
  const productContainer = document.getElementById('products');
  if (!productContainer) {
    console.error('Product container #products not found');
    return;
  }

  try {
    const response = await fetch('./JSON/products.json');
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const products = await response.json();
    console.log('Loaded products for buttons:', products);

    // Get the SKU from data-product-sku attribute, if present
    const targetSku = productContainer.dataset.productSku;

    // Filter products based on SKU (single-product page) or use all (multi-product page)
    const productsToDisplay = targetSku
      ? products.filter(product => product.sku === targetSku)
      : products;

    if (productsToDisplay.length === 0 && targetSku) {
      console.error(`No product found with SKU: ${targetSku}`);
      return;
    }

    productsToDisplay.forEach(product => {
      const button = document.createElement('button');
      button.className = 'snipcart-add-item';
      button.setAttribute('data-item-id', product.id || product.sku);
      button.setAttribute('data-item-name', product.name || 'Unnamed Product');
      button.setAttribute('data-item-price', product.price || '0.00');
      button.setAttribute('data-item-url', product.url || '');
      button.textContent = 'Buy';
      productContainer.appendChild(button);
    });
  } catch (error) {
    console.error('Failed to load products.json for buttons:', error);
  }
});