# HeadGenerator

## Summary

The `HeadGenerator` script dynamically manages the `<head>` section of an HTML document by processing `<data-bh-head>` custom elements. It adds meta tags, stylesheets, scripts, and schema markup based on attributes provided in `<data-bh-head>` tags. Key features include:
- Merges attributes from multiple `<data-bh-head>` elements into a single configuration object.
- Dynamically loads stylesheets, fonts, and component scripts (e.g., `custom-img.js`) based on `data-components`.
- Adds essential meta tags (charset, viewport, robots, title, author, description, keywords, canonical).
- Supports theme-aware `theme-color` meta tag, updating dynamically based on `prefers-color-scheme` or `data-theme`.
- Adds Open Graph and Twitter meta tags for social media sharing.
- Generates JSON-LD schema markup for SEO (WebSite, LocalBusiness, BreadcrumbList, Product/CollectionPage).
- Preloads resources (stylesheets, fonts, feature images, scripts) to optimize performance.
- Initializes e-commerce functionality (Snipcart) and debugging tools (Eruda) if enabled via `data-include-e-commerce`.
- Removes `<data-bh-head>` elements after processing to prevent parsing issues.
- Handles favicon links for various devices (apple-touch-icon, favicon.ico).
- Loads additional scripts (e.g., `scripts.js`) and ensures no duplicate resources are added.

The script requires `<data-bh-head>` elements to provide configuration and must be loaded as a module with `defer` before `<data-bh-head>` tags in the `<head>` section to ensure proper processing.

## Dependencies

The `HeadGenerator` script has the following dependencies:
- **`picture-generator.js`**: Required for components like `custom-img` that generate `<picture>` markup. Preloaded and loaded as a module with `defer`.
- **`business-info.json`**: Fetched asynchronously to provide default business metadata (e.g., name, address, telephone) for schema markup. Optional, with fallback defaults if not found.
- **Font Awesome Styles**: Loads stylesheets (`fontawesome.min.css`, `sharp-light.min.css`, `brands.min.css`) for icon support.
- **Snipcart (Optional)**: Loaded if `data-include-e-commerce` is present, using CDN scripts for e-commerce functionality.
- **Eruda (Optional)**: Loaded if `data-include-e-commerce` is present, for debugging via CDN script.
- **Component Scripts**: Dynamically loads scripts specified in `data-components` (e.g., `./js/components/custom-img.js`).

The script polls for the availability of `business-info.json` and logs warnings or errors if the fetch fails.

## Standard Attributes

These are standard HTML attributes supported by `<data-bh-head>` and processed to generate corresponding `<meta>`, `<title>`, or `<link>` tags.

| Attribute       | Description                                                                 | Type     | Required | Default Value |
|----------------|-----------------------------------------------------------------------------|----------|----------|---------------|
| `title`        | Sets the `<title>` tag content.                                             | String   | No       | 'Behive' |
| `description`  | Sets the `<meta name="description">` content for SEO.                       | String   | No       | '' |
| `keywords`     | Sets the `<meta name="keywords">` content for SEO.                          | String   | No       | '' |
| `author`       | Sets the `<meta name="author">` content.                                    | String   | No       | 'David Dufourq' |
| `canonical`    | Sets the `<link rel="canonical">` href for SEO.                             | String   | No       | '' |
| `robots`       | Sets the `<meta name="robots">` content for search engine crawling.         | String   | No       | 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1' |

## Custom Attributes

These are non-standard attributes specific to `<data-bh-head>`, used to configure advanced features like social media, schema, and resource preloading. They are processed and removed from the final DOM.

| Attribute                     | Description                                                                 | Type     | Required | Default Value |
|------------------------------|-----------------------------------------------------------------------------|----------|----------|---------------|
| `components`                 | Comma- or space-separated list of component scripts to load (e.g., `custom-img`). | String   | No       | '' |
| `og-title`                   | Sets the `<meta property="og:title">` content for Open Graph.               | String   | No       | Fallback to `title` or 'Behive' |
| `og-description`             | Sets the `<meta property="og:description">` content for Open Graph.         | String   | No       | Fallback to `description` or '' |
| `og-image`                   | Sets the `<meta property="og:image">` content for Open Graph.               | String   | No       | 'https://rainwilds.github.io/Sandbox/img/preview.jpg' |
| `og-url`                     | Sets the `<meta property="og:url">` content for Open Graph.                 | String   | No       | 'https://rainwilds.github.io/Sandbox/' |
| `og-type`                    | Sets the `<meta property="og:type">` content for Open Graph.                | String   | No       | 'website' |
| `og-locale`                  | Sets the `<meta property="og:locale">` content for Open Graph.              | String   | No       | 'en_AU' |
| `og-site-name`               | Sets the `<meta property="og:site_name">` content for Open Graph.           | String   | No       | 'Behive' |
| `twitter-title`              | Sets the `<meta name="twitter:title">` content for Twitter.                 | String   | No       | Fallback to `title` or 'Behive' |
| `twitter-description`        | Sets the `<meta name="twitter:description">` content for Twitter.           | String   | No       | Fallback to `description` or '' |
| `twitter-image`              | Sets the `<meta name="twitter:image">` content for Twitter.                 | String   | No       | Fallback to `og-image` or 'https://rainwilds.github.io/Sandbox/img/preview.jpg' |
| `twitter-url`                | Sets the `<meta property="twitter:url">` content for Twitter.               | String   | No       | 'https://rainwilds.github.io/Sandbox/' |
| `twitter-domain`             | Sets the `<meta property="twitter:domain">` content for Twitter.            | String   | No       | 'rainwilds.github.io' |
| `twitter-card`               | Sets the `<meta name="twitter:card">` content for Twitter (e.g., `summary_large_image`). | String   | No       | 'summary_large_image' |
| `schema-site-name`           | Sets the `name` field in the WebSite JSON-LD schema.                        | String   | No       | Fallback to `title` or 'Behive Media' |
| `schema-site-url`            | Sets the `url` field in the WebSite JSON-LD schema.                         | String   | No       | 'https://rainwilds.github.io/Sandbox/' |
| `business-name`              | Sets the `name` field in the LocalBusiness JSON-LD schema.                  | String   | No       | 'Behive Media' (or from `business-info.json`) |
| `business-url`               | Sets the `url` field in the LocalBusiness JSON-LD schema.                   | String   | No       | 'https://rainwilds.github.io/Sandbox/' (or from `business-info.json`) |
| `business-telephone`         | Sets the `telephone` field in the LocalBusiness JSON-LD schema.             | String   | No       | '+61-3-9876-5432' (or from `business-info.json`) |
| `business-address-street`    | Sets the `streetAddress` field in the LocalBusiness JSON-LD schema.         | String   | No       | '456 Creative Lane' (or from `business-info.json`) |
| `business-address-locality`  | Sets the `addressLocality` field in the LocalBusiness JSON-LD schema.       | String   | No       | 'Melbourne' (or from `business-info.json`) |
| `business-address-region`    | Sets the `addressRegion` field in the LocalBusiness JSON-LD schema.         | String   | No       | 'VIC' (or from `business-info.json`) |
| `business-address-postal`    | Sets the `postalCode` field in the LocalBusiness JSON-LD schema.            | String   | No       | '3000' (or from `business-info.json`) |
| `business-address-country`   | Sets the `addressCountry` field in the LocalBusiness JSON-LD schema.        | String   | No       | 'AU' (or from `business-info.json`) |
| `business-geo-latitude`      | Sets the `latitude` field in the LocalBusiness JSON-LD schema.              | Number   | No       | -37.8136 (or from `business-info.json`) |
| `business-geo-longitude`     | Sets the `longitude` field in the LocalBusiness JSON-LD schema.             | Number   | No       | 144.9631 (or from `business-info.json`) |
| `business-opening-hours`     | Sets the `openingHours` field in the LocalBusiness JSON-LD schema.          | String   | No       | 'Mo-Fr 09:00-18:00' (or from `business-info.json`) |
| `business-image`             | Sets the `image` field in the LocalBusiness JSON-LD schema.                 | String   | No       | 'https://rainwilds.github.io/Sandbox/img/logo.jpg' (or from `business-info.json`) |
| `business-logo`              | Sets the `logo` field in the LocalBusiness JSON-LD schema.                  | String   | No       | 'https://rainwilds.github.io/Sandbox/img/logo.jpg' (or from `business-info.json`) |
| `business-same-as`           | Sets the `sameAs` field in the LocalBusiness JSON-LD schema (comma-separated URLs). | String   | No       | ['https://www.facebook.com/behivemedia', 'https://www.instagram.com/behivemedia'] (or from `business-info.json`) |
| `product-name`               | Sets the `name` field in the Product JSON-LD schema (if `include-e-commerce`). | String   | No       | 'Behive Premium Video Production Package' |
| `product-description`        | Sets the `description` field in the Product JSON-LD schema.                 | String   | No       | Fallback to `description` or 'Professional video production services...' |
| `product-image`              | Sets the `image` field in the Product JSON-LD schema.                       | String   | No       | Fallback to `og-image` or 'https://rainwilds.github.io/Sandbox/img/video-package.jpg' |
| `product-url`                | Sets the `url` field in the Product JSON-LD schema.                         | String   | No       | 'https://rainwilds.github.io/Sandbox/products/video-package' |
| `product-price-currency`     | Sets the `priceCurrency` field in the Product JSON-LD schema.               | String   | No       | 'AUD' |
| `product-price`              | Sets the `price` field in the Product JSON-LD schema.                       | String   | No       | '1500.00' |
| `product-availability`       | Sets the `availability` field in the Product JSON-LD schema.                | String   | No       | 'https://schema.org/InStock' |
| `product-sku`                | Sets the `sku` field in the Product JSON-LD schema.                         | String   | No       | 'BH-VIDEO-002' |
| `product-brand`              | Sets the `name` field in the Product’s `brand` JSON-LD schema.              | String   | No       | 'Behive' |
| `collection-name`            | Sets the `name` field in the CollectionPage JSON-LD schema (if `include-e-commerce`). | String   | No       | Fallback to `title` or 'Behive Shop' |
| `collection-description`     | Sets the `description` field in the CollectionPage JSON-LD schema.          | String   | No       | Fallback to `description` or 'Browse our curated selection of products.' |
| `products`                   | JSON string of products for CollectionPage JSON-LD schema (if `include-e-commerce`). | String   | No       | None |
| `theme-color-light`          | Sets the `<meta name="theme-color">` content for light theme.               | String   | No       | CSS `--color-background-light` or '#ffffff' |
| `theme-color-dark`           | Sets the `<meta name="theme-color">` content for dark theme.                | String   | No       | CSS `--color-background-dark` or '#000000' |
| `include-e-commerce`         | Enables Snipcart and Eruda initialization for e-commerce functionality.     | Boolean  | No       | False |
| `include-eruda`              | Enables Eruda debugging tool (overridden by `include-e-commerce`).          | Boolean  | No       | False |
| `preload-feature-img-mobile` | Preloads an image for mobile devices (e.g., `img/responsive/...`).          | String   | No       | None |
| `preload-feature-img-desktop`| Preloads an image for desktop devices (e.g., `img/responsive/...`).         | String   | No       | None |
| `stylesheets`                | Comma-separated list of stylesheet URLs to preload and load.                | String   | No       | './styles.css' |

## Example Data-BH-Head Tags

Here are example usages of the `<data-bh-head>` tag, demonstrating different configurations for metadata, components, and e-commerce.

### Basic Example (General Settings and Component)
```html
<data-bh-head
    data-components="custom-img"
    data-title="Behive Home"
    data-description="Welcome to Behive, your source for media and web design."
    data-keywords="media, design, photography"
    data-author="David Dufourq"
    data-canonical="https://rainwilds.github.io/Sandbox/"
>
```

### Example with Social Media and Schema
```html
<!-- General/Site -->
<data-bh-head
    data-components="custom-img"
    data-title="Photography, Videography & Websites - Behive"
    data-description="Bespoke media assets and web design for quality brands."
    data-keywords="photography, videography, websites, web design"
    data-author="David Dufourq"
    data-canonical="https://rainwilds.github.io/Sandbox/"
    data-robots="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1"
    data-schema-site-name="Behive: Photography, Videography & Websites"
    data-schema-site-url="https://rainwilds.github.io/Sandbox/"
    data-preload-feature-img-mobile="img/responsive/business-service-location-1-1366.avif"
    data-preload-feature-img-desktop="img/responsive/business-service-location-1-1920.avif"
></data-bh-head>
<!-- Open Graph -->
<data-bh-head
    data-og-title="Photography, Videography & Websites - Behive"
    data-og-description="Bespoke media assets and web design for quality brands."
    data-og-image="https://rainwilds.github.io/Sandbox/img/preview.jpg"
    data-og-url="https://rainwilds.github.io/Sandbox/"
    data-og-type="website"
    data-og-locale="en_AU"
    data-og-site-name="Behive"
></data-bh-head>
<!-- Twitter -->
<data-bh-head
    data-twitter-title="Behive: Photography, Videography & Websites"
    data-twitter-description="Bespoke media assets and web design for quality brands."
    data-twitter-image="https://rainwilds.github.io/Sandbox/img/preview.jpg"
    data-twitter-url="https://rainwilds.github.io/Sandbox/"
    data-twitter-domain="rainwilds.github.io"
    data-twitter-card="summary_large_image"
></data-bh-head>
```

### Example with E-commerce Product
```html
<data-bh-head
    data-components="custom-img, product-cart"
    data-title="Behive Product Page"
    data-description="Explore our premium products."
    data-product-name="Featured Product"
    data-product-description="High-quality product from Behive."
    data-product-image="https://rainwilds.github.io/Sandbox/img/preview.jpg"
    data-product-url="https://rainwilds.github.io/Sandbox/products/featured"
    data-product-price-currency="AUD"
    data-product-price="10.00"
    data-product-availability="https://schema.org/InStock"
    data-product-sku="BH-PRODUCT-001"
    data-product-brand="Behive"
    data-include-e-commerce
></data-bh-head>
```

### Example with Product Collection
```html
<data-bh-head
    data-components="custom-img, product-gallery"
    data-title="Behive Shop"
    data-description="Browse our curated selection of products."
    data-collection-name="Behive Shop"
    data-collection-description="Browse our curated selection of photography and videography products."
    data-products='[{"name":"Product 1","url":"https://rainwilds.github.io/Sandbox/products/1","image":"https://rainwilds.github.io/Sandbox/img/product1.jpg","description":"Product 1 description","sku":"BH-PROD-001","brand":"Behive","priceCurrency":"AUD","price":"50.00","availability":"https://schema.org/InStock"}]'
    data-include-e-commerce
></data-bh-head>
```