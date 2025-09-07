# setup.json Documentation

The `setup.json` file is a centralized configuration file that defines global, site-wide settings for the Behive website. It is used by `head-generator.js` to configure CSS variables, fonts, Font Awesome, favicon links, Snipcart e-commerce settings, and other metadata that apply across all pages. Page-specific settings (e.g., `title`, `description`, `og:title`) are managed via `<data-custom-head>` elements in HTML, with `setup.json` providing defaults for global properties. This documentation details all sections and properties, organized alphabetically within each category.

**Note on Snipcart `publicApiKey` Security**: The `publicApiKey` in the `general.snipcart` section is exposed client-side, as it’s required for Snipcart’s JavaScript SDK. To prevent misuse (e.g., unauthorized usage on other domains), enable domain whitelisting in your Snipcart dashboard:
- Log in to your Snipcart dashboard.
- Navigate to **Account > API Keys**.
- Add your site’s domain (e.g., `rainwilds.github.io`) to the allowed domains list.
- Test to ensure Snipcart only works on your whitelisted domain.

## General Section

The `general` section contains site-wide metadata and settings that apply to all pages unless overridden by `<data-custom-head>` attributes.

| Property Name | Description | Default Value | Expected Format |
|---------------|-------------|---------------|-----------------|
| author | Specifies the site’s author for the `<meta name="author">` tag. | `'David Dufourq'` | Plain text (e.g., `'Jane Doe'`) |
| favicons | Defines favicon links for various devices. | `[]` (empty array) | Array of objects with `rel`, `href`, optional `type`, and optional `sizes` (e.g., `[{ "rel": "apple-touch-icon", "sizes": "180x180", "href": "../Sandbox/img/icons/apple-touch-icon.png" }`) |
| include_e_commerce | Enables Snipcart e-commerce functionality when `true`. | `false` | Boolean (`true` or `false`) |
| og.locale | Sets the Open Graph locale for the site’s language/region. | `'en_AU'` | Valid locale string (e.g., `'en_US'`, `'fr_FR'`) |
| og.site_name | Specifies the site name for Open Graph metadata. | `'Behive'` | Plain text (e.g., `'Behive Media'`) |
| robots | Defines the `<meta name="robots">` content for search engine indexing. | `'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1'` | Comma-separated robots directives (e.g., `'noindex, nofollow'`) |
| snipcart | Configures Snipcart e-commerce settings. | `{}` (empty object) | Object with `publicApiKey`, `loadStrategy`, `version`, `templatesUrl`, `modalStyle` (e.g., `{ "publicApiKey": "NTMz...", "loadStrategy": "on-user-interaction", "version": "3.7.3", "templatesUrl": "/Sandbox/plugins/snipcart.html", "modalStyle": "side" }`) |
| theme_colors.dark | Specifies the theme color for dark mode in `<meta name="theme-color">`. | `'#000000'` | Valid CSS color (e.g., `'#141b32'`, `'rgb(20, 27, 50)'`) |
| theme_colors.light | Specifies the theme color for light mode in `<meta name="theme-color">`. | `'#ffffff'` | Valid CSS color (e.g., `'#faf9f3'`, `'rgb(250, 249, 243)'`) |
| x.card | Sets the Twitter/X card type for social sharing. | `'summary_large_image'` | One of: `'summary'`, `'summary_large_image'`, `'app'`, `'player'` |
| x.domain | Specifies the domain for Twitter/X metadata. | `'rainwilds.github.io'` | Valid domain name (e.g., `'example.com'`) |

**Note**: Properties like `title`, `description`, `og:title`, `x:url`, etc., are page-specific and managed via `<data-custom-head>` attributes, not `setup.json`.

## Business Section

The `business` section provides data for JSON-LD schema markup representing the site’s business entity.

| Property Name | Description | Default Value | Expected Format |
|---------------|-------------|---------------|-----------------|
| address.addressCountry | Specifies the country for the business address. | `'AU'` | ISO 3166-1 alpha-2 country code (e.g., `'US'`) |
| address.addressLocality | Defines the city or locality of the business address. | `'Melbourne'` | Plain text (e.g., `'Sydney'`) |
| address.addressRegion | Specifies the state or region of the business address. | `'VIC'` | Region abbreviation or name (e.g., `'NSW'`) |
| address.postalCode | Sets the postal code for the business address. | `'3000'` | Postal code (e.g., `'2000'`) |
| address.streetAddress | Specifies the street address of the business. | `'456 Creative Lane'` | Plain text (e.g., `'123 Main St'`) |
| geo.latitude | Provides the latitude for the business location. | `-37.8136` | Numeric value (e.g., `40.7128`) |
| geo.longitude | Provides the longitude for the business location. | `144.9631` | Numeric value (e.g., `-74.0060`) |
| image | Specifies the URL for the business image in schema markup. | `'https://rainwilds.github.io/Sandbox/img/logo.jpg'` | Valid image URL |
| logo | Specifies the URL for the business logo in schema markup. | `'https://rainwilds.github.io/Sandbox/img/logo.jpg'` | Valid image URL |
| name | Defines the business name for schema markup. | `'Behive'` | Plain text (e.g., `'Behive Media'`) |
| openingHours | Specifies the business’s opening hours. | `'Mo-Fr 09:00-18:00'` | Schema.org opening hours format (e.g., `'Mo,Tu,We 09:00-17:00'`) |
| sameAs | Lists social media or other URLs for the business. | `['https://www.facebook.com/behive', 'https://www.instagram.com/behive']` | Array of valid URLs |
| telephone | Specifies the business’s contact phone number. | `'+61-3-9876-5432'` | International phone number format (e.g., `'+1-123-456-7890'`) |
| url | Defines the canonical URL for the business. | `'https://rainwilds.github.io/Sandbox/'` | Valid URL |

## Fonts Section

The `fonts` section defines font resources to be preloaded for performance optimization.

| Property Name | Description | Default Value | Expected Format |
|---------------|-------------|---------------|-----------------|
| crossorigin | Specifies the CORS mode for font preloading. | `'anonymous'` | String (`'anonymous'`) |
| href | Specifies the URL of the font file to preload. | `''` (empty) | Valid font file URL (e.g., `'../fonts/Futura_PT_Demi.woff2'`) |
| type | Defines the MIME type of the font file. | `'font/woff2'` | Valid MIME type (e.g., `'font/woff2'`, `'font/ttf'`) |

**Note**: Each font is an object in an array (e.g., `[{ "href": "../fonts/Futura_PT_Demi.woff2", "type": "font/woff2", "crossorigin": "anonymous" }]`).

## Font Faces Section

The `font_faces` section defines `@font-face` rules for custom fonts, injected dynamically into a `<style data-font-faces>` tag by `head-generator.js`.

| Property Name | Description | Default Value | Expected Format |
|---------------|-------------|---------------|-----------------|
| family | Specifies the font family name used in CSS (e.g., in `font-family`). | `''` (empty) | String (e.g., `'Futura_PT_Demi'`) |
| src | Specifies the URL of the font file. | `''` (empty) | Valid font file URL (e.g., `'../fonts/Futura_PT_Demi.woff2'`) |
| format | Defines the font file format. | `''` (empty) | String (e.g., `'woff2'`, `'woff'`, `'ttf'`) |
| weight | Sets the font weight. | `'normal'` | CSS font weight (e.g., `'normal'`, `'bold'`, `400`, `700`) |
| style | Sets the font style. | `'normal'` | CSS font style (e.g., `'normal'`, `'italic'`) |
| display | Specifies the font display strategy to control rendering behavior. | `'swap'` | One of: `'auto'`, `'block'`, `'swap'`, `'fallback'`, `'optional'` |

**Note**: Each font face is an object in an array (e.g., `[{ "family": "Futura_PT_Demi", "src": "../fonts/Futura_PT_Demi.woff2", "format": "woff2", "weight": "normal", "style": "normal", "display