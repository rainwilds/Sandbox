# Head Generator Documentation

The `head-generator.js` script dynamically manages the `<head>` section of an HTML document by adding meta tags, stylesheets, fonts, favicons, and schema markup. It processes attributes from `<data-bh-head>` elements, fetches business information from a JSON file, and supports e-commerce integration with Snipcart. The script includes utilities for logging, deep cloning, and script loading, and it enhances accessibility and SEO with Open Graph, X meta tags, and JSON-LD schemas. Below is a detailed explanation of all attributes, grouped into General, Open Graph, X, Business, Schema, Product, Collection, Theme, and E-commerce Attributes, presented in alphabetical order within each group.

## General Attributes

| Attribute Name | Description | Default Value | Expected Format |
|----------------|-------------|---------------|-----------------|
| author | Sets the content for the `author` meta tag. | `'David Dufourq'` | Plain text (e.g., `John Doe`) |
| canonical | Specifies the canonical URL for the `link[rel="canonical"]` tag. | `''` (empty) | Valid URL (e.g., `https://example.com`) |
| components | Lists JavaScript component files to load dynamically. | `''` (empty) | Space-separated file names (e.g., `custom-header custom-logo`) |
| description | Sets the content for the `description` meta tag. | `''` (empty) | Plain text (e.g., `Website description`) |
| keywords | Sets the content for the `keywords` meta tag. | `''` (empty) | Comma-separated keywords (e.g., `web, design, services`) |
| robots | Sets the content for the `robots` meta tag to control search engine indexing. | `'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1'` | Valid robots directives (e.g., `noindex, nofollow`) |
| stylesheets | Specifies CSS stylesheet URLs to load with preload and stylesheet relations. | `'./styles.css'` | Comma-separated URLs (e.g., `./styles.css,./custom.css`) |
| title | Sets the text for the `<title>` tag. | `'Behive'` | Plain text (e.g., `My Website`) |

## Open Graph Attributes

| Attribute Name | Description | Default Value | Expected Format |
|----------------|-------------|---------------|-----------------|
| og-description | Sets the content for the `og:description` meta tag. | `attributes.description` or `''` (empty) | Plain text (e.g., `Open Graph description`) |
| og-image | Sets the content for the `og:image` meta tag. | `'https://rainwilds.github.io/Sandbox/img/preview.jpg'` | Valid image URL (e.g., `https://example.com/image.jpg`) |
| og-locale | Sets the content for the `og:locale` meta tag. | `'en_AU'` | Locale code (e.g., `en_US`) |
| og-site-name | Sets the content for the `og:site_name` meta tag. | `'Behive'` | Plain text (e.g., `Behive Media`) |
| og-title | Sets the content for the `og:title` meta tag. | `attributes.title` or `'Behive'` | Plain text (e.g., `Website Title`) |
| og-type | Sets the content for the `og:type` meta tag. | `'website'` | Valid Open Graph type (e.g., `article`) |
| og-url | Sets the content for the `og:url` meta tag. | `'https://rainwilds.github.io/Sandbox/'` | Valid URL (e.g., `https://example.com`) |

## X Attributes

| Attribute Name | Description | Default Value | Expected Format |
|----------------|-------------|---------------|-----------------|
| x-card | Sets the content for the `x:card` meta tag. | `'summary_large_image'` | Valid X card type (e.g., `summary`) |
| x-description | Sets the content for the `x:description` meta tag. | `attributes.description` or `''` (empty) | Plain text (e.g., `X description`) |
| x-domain | Sets the content for the `x:domain` meta tag. | `'rainwilds.github.io'` | Valid domain (e.g., `example.com`) |
| x-image | Sets the content for the `x:image` meta tag. | `attributes['og-image']` or `'https://rainwilds.github.io/Sandbox/img/preview.jpg'` | Valid image URL (e.g., `https://example.com/image.jpg`) |
| x-title | Sets the content for the `x:title` meta tag. | `attributes.title` or `'Behive'` | Plain text (e.g., `X Title`) |
| x-url | Sets the content for the `x:url` meta tag. | `'https://rainwilds.github.io/Sandbox/'` | Valid URL (e.g., `https://example.com`) |

## Business Attributes

| Attribute Name | Description | Default Value | Expected Format |
|----------------|-------------|---------------|-----------------|
| business-address-country | Sets the country for the business address in the JSON-LD schema. | `'AU'` | Country code (e.g., `US`) |
| business-address-locality | Sets the locality for the business address in the JSON-LD schema. | `'Melbourne'` | Plain text (e.g., `Sydney`) |
| business-address-postal | Sets the postal code for the business address in the JSON-LD schema. | `'3000'` | Postal code (e.g., `2000`) |
| business-address-region | Sets the region for the business address in the JSON-LD schema. | `'VIC'` | Region code (e.g., `NSW`) |
| business-address-street | Sets the street address for the business address in the JSON-LD schema. | `'456 Creative Lane'` | Plain text (e.g., `123 Main St`) |
| business-geo-latitude | Sets the latitude for the business location in the JSON-LD schema. | `-37.8136` | Numeric value (e.g., `40.7128`) |
| business-geo-longitude | Sets the longitude for the business location in the JSON-LD schema. | `144.9631` | Numeric value (e.g., `-74.0060`) |
| business-image | Sets the image URL for the business in the JSON-LD schema. | `'https://rainwilds.github.io/Sandbox/img/logo.jpg'` | Valid image URL (e.g., `https://example.com/business.jpg`) |
| business-logo | Sets the logo URL for the business in the JSON-LD schema. | `'https://rainwilds.github.io/Sandbox/img/logo.jpg'` | Valid image URL (e.g., `https://example.com/logo.jpg`) |
| business-name | Sets the name for the business in the JSON-LD schema. | `'Behive Media'` | Plain text (e.g., `My Company`) |
| business-opening-hours | Sets the opening hours for the business in the JSON-LD schema. | `'Mo-Fr 09:00-18:00'` | Opening hours format (e.g., `Mo-Su 08:00-20:00`) |
| business-same-as | Sets social media URLs for the business in the JSON-LD schema. | `'https://www.facebook.com/behivemedia,https://www.instagram.com/behivemedia'` | Comma-separated URLs (e.g., `https://facebook.com/example,https://instagram.com/example`) |
| business-telephone | Sets the telephone number for the business in the JSON-LD schema. | `'+61-3-9876-5432'` | Phone number (e.g., `'+1-123-456-7890'`) |
| business-url | Sets the URL for the business in the JSON-LD schema. | `'https://rainwilds.github.io/Sandbox/'` | Valid URL (e.g., `https://example.com`) |

## Schema Attributes

| Attribute Name | Description | Default Value | Expected Format |
|----------------|-------------|---------------|-----------------|
| schema-site-name | Sets the name for the website in the JSON-LD schema. | `attributes.title` or `'Behive Media'` | Plain text (e.g., `My Website`) |
| schema-site-url | Sets the URL for the website in the JSON-LD schema. | `'https://rainwilds.github.io/Sandbox/'` | Valid URL (e.g., `https://example.com`) |

## Product Attributes

| Attribute Name | Description | Default Value | Expected Format |
|----------------|-------------|---------------|-----------------|
| product-availability | Sets the availability for a product in the JSON-LD schema. | `null` | Schema.org availability (e.g., `InStock`) |
| product-brand | Sets the brand for a product in the JSON-LD schema. | `null` | Plain text (e.g., `Behive`) |
| product-description | Sets the description for a product in the JSON-LD schema. | `null` | Plain text (e.g., `Product description`) |
| product-image | Sets the image URL for a product in the JSON-LD schema. | `null` | Valid image URL (e.g., `https://example.com/product.jpg`) |
| product-name | Sets the name for a product in the JSON-LD schema. | `null` | Plain text (e.g., `Product Name`) |
| product-price | Sets the price for a product in the JSON-LD schema. | `null` | Numeric value (e.g., `99.99`) |
| product-price-currency | Sets the currency for a product in the JSON-LD schema. | `null` | Currency code (e.g., `AUD`) |
| product-sku | Sets the SKU for a product in the JSON-LD schema. | `null` | Plain text (e.g., `SKU123`) |
| product-url | Sets the URL for a product in the JSON-LD schema. | `null` | Valid URL (e.g., `https://example.com/product`) |
| products | Specifies a JSON string of products for the JSON-LD schema. | `null` | JSON string (e.g., `[{"name": "Product", "url": "https://example.com/product"}]` |

## Collection Attributes

| Attribute Name | Description | Default Value | Expected Format |
|----------------|-------------|---------------|-----------------|
| collection-description | Sets the description for a collection in the JSON-LD schema. | `null` | Plain text (e.g., `Collection description`) |
| collection-name | Sets the name for a collection in the JSON-LD schema. | `null` | Plain text (e.g., `Spring Collection`) |

## Theme Attributes

| Attribute Name | Description | Default Value | Expected Format |
|----------------|-------------|---------------|-----------------|
| theme-color-dark | Sets the theme color for dark mode in the `theme-color` meta tag. | CSS `--color-background-dark` or `'#000000'` | Valid CSS color (e.g., `#333333`) |
| theme-color-light | Sets the theme color for light mode in the `theme-color` meta tag. | CSS `--color-background-light` or `'#ffffff'` | Valid CSS color (e.g., `#ffffff`) |

## E-commerce Attributes

| Attribute Name | Description | Default Value | Expected Format |
|----------------|-------------|---------------|-----------------|
| include-e-commerce | Enables Snipcart e-commerce integration when present. | Not set (false) | Boolean attribute (presence indicates `true`) |

## Notes
- The script runs on `DOMContentLoaded` and processes all `<data-bh-head>` elements, merging their dataset attributes into a single `attributes` object before removing them from the DOM.
- It fetches `business-info.json` to populate business-related data for the JSON-LD schema, falling back to default values if the fetch fails.
- The `manageHead` function ensures the `<head>` element exists, adding it if necessary, and appends meta tags, stylesheets, fonts, favicons, and schema markup.
- Font Awesome is included via a kit script (`https://kit.fontawesome.com/85d1e578b1.js`) with `crossorigin="anonymous"` and `async`.
- Stylesheets are preloaded with `rel="preload stylesheet"` for performance, and fonts are preloaded with appropriate MIME types.
- Essential meta tags (`charset`, `viewport`, `robots`, `author`) are added if not present, with defaults for SEO optimization.
- The `theme-color` meta tag dynamically updates based on `data-theme` attributes or `prefers-color-scheme`, using MutationObservers and media query listeners.
- Open Graph and X meta tags enhance social media sharing, with fallbacks to general attributes (e.g., `og-title` uses `title`).
- JSON-LD schema includes `WebSite`, `LocalBusiness`, and `BreadcrumbList` types, with business data from `business-info.json` or attributes.
- Favicons are added for various devices, including Apple Touch and standard icons.
- Snipcart integration is enabled with `include-e-commerce`, adding settings and scripts with a public API key and side modal style.
- The `deepClone` utility prevents circular reference issues when serializing JSON-LD schema.
- Logging is controlled by `DEBUG_MODE`, with timestamps in AEST, and errors are logged with `logError`.
- Components specified in the `components` attribute are dynamically loaded from `./components/` directory using `import`.