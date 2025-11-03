# setup.json Documentation

The `setup.json` file is a centralized configuration file that defines global, site-wide settings for the Behive website. It is used by `head-generator.js` to configure CSS variables, fonts, Font Awesome, favicon links, Snipcart e-commerce settings, and other metadata that apply across all pages. Page-specific settings (e.g., `title`, `description`, `og:title`) are managed via `<data-custom-head>` elements in HTML, with `setup.json` providing defaults for global properties. This documentation details all sections and properties, organized alphabetically within each category.

**Note on Snipcart `publicApiKey` Security**: The `publicApiKey` in the `general.snipcart` section is exposed client-side, as it’s required for Snipcart’s JavaScript SDK. To prevent misuse (e.g., unauthorized usage on other domains), enable domain whitelisting in your Snipcart dashboard:
- Log in to your Snipcart dashboard.
- Navigate to **Account > API Keys**.
- Add your site’s domain (e.g., `rainwilds.github.io`) to the allowed domains list.
- Test to ensure Snipcart only works on your whitelisted domain.

> **Note**: If the `version` field in `general.snipcart` is empty (`""`) or omitted, the **latest version** of Snipcart will be loaded automatically.

## General Section

The `general` section contains site-wide metadata and settings that apply to all pages unless overridden by `<data-custom-head>` attributes.

| Property Name | Description | Default Value | Expected Format |
|---------------|-------------|---------------|-----------------|
| author | Specifies the site’s author for the `<meta name="author">` tag. | `'David Dufourq'` | Plain text (e.g., `'Jane Doe'`) |
| basePath | Defines the base path for the site (used in routing and asset resolution). | `"/Sandbox/"` | String (e.g., `"/"`, `"/my-site/"`) |
| favicons | Defines favicon links for various devices. | `[]` (empty array) | Array of objects with `rel`, `href`, optional `type`, and optional `sizes` |
| include_e_commerce | Enables Snipcart e-commerce functionality when `true`. | `false` | Boolean (`true` or `false`) |
| og.locale | Sets the Open Graph locale for the site’s language/region. | `'en_AU'` | Valid locale string (e.g., `'en_US'`, `'fr_FR'`) |
| og.site_name | Specifies the site name for Open Graph metadata. | `'Behive'` | Plain text (e.g., `'Behive Media'`) |
| og.type | Defines the Open Graph content type. | `'website'` | Valid OG type (e.g., `'website'`, `'article'`) |
| og.image | URL of the default image used in Open Graph sharing. | `"https://rainwilds.github.io/img/logo.jpg"` | Valid image URL |
| robots | Defines the `<meta name="robots">` content for search engine indexing. | `'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1'` | Comma-separated robots directives |
| snipcart | Configures Snipcart e-commerce settings. | `{}` (empty object) | Object — see **Snipcart Sub-Properties** below |
| x.card | Sets the Twitter/X card type for social sharing. | `'summary_large_image'` | One of: `'summary'`, `'summary_large_image'`, `'app'`, `'player'` |
| x.domain | Specifies the domain for Twitter/X metadata. | `'rainwilds.github.io'` | Valid domain name (e.g., `'example.com'`) |
| x.site | Twitter/X handle for the site (with `@`). | `'@behive'` | String starting with `@` |

### Snipcart Sub-Properties (`general.snipcart`)

| Property | Description | Default | Expected Format |
|--------|-------------|---------|-----------------|
| publicApiKey | Your Snipcart public API key (required for e-commerce). | `""` | String (e.g., `"NTMzMT...YWNl..."`) |
| loadStrategy | When to load Snipcart script. | `"on-user-interaction"` | `"on-user-interaction"` or `"immediate"` |
| version | Specific Snipcart version to load. **Leave empty to use latest.** | `"3.7.3"` | String (e.g., `"3.7.3"`, `""`) |
| templatesUrl | Path to custom Snipcart HTML templates. | `"./plugins/snipcart.html"` | Relative or absolute URL |
| modalStyle | Cart modal layout style. | `"side"` | `"side"` or `"bottom"` |
| currency | Default currency for transactions. | `"aud"` | ISO 4217 code (e.g., `"usd"`, `"eur"`) |
| loadCSS | Whether to load Snipcart’s default CSS. | `true` | Boolean |

> **Important**: Always whitelist your domain in the Snipcart dashboard to protect your `publicApiKey`.

---

## Business Section

The `business` section provides data for JSON-LD schema markup representing the site’s business entity.

| Property Name | Description | Default Value | Expected Format |
|---------------|-------------|---------------|-----------------|
| address.addressCountry | Country of the business. | `'AU'` | ISO 3166-1 alpha-2 |
| address.addressLocality | City/locality. | `'Melbourne'` | Plain text |
| address.addressRegion | State/region. | `'VIC'` | Abbreviation or name |
| address.postalCode | Postal/ZIP code. | `'3000'` | String |
| address.streetAddress | Street address. | `'456 Creative Lane'` | Plain text |
| geo.latitude | Geographic latitude. | `-37.8136` | Number |
| geo.longitude | Geographic longitude. | `144.9631` | Number |
| image | Business image URL (for schema). | `"https://rainwilds.github.io/img/logo.jpg"` | Valid URL |
| logo | Business logo URL (for schema). | `"https://rainwilds.github.io/img/logo.jpg"` | Valid URL |
| name | Business name. | `'Behive'` | Plain text |
| openingHours | Operating hours in schema format. | `'Mo-Fr 09:00-18:00'` | Schema.org format |
| sameAs | Array of social profile URLs. | `["https://www.facebook.com/behive", "https://www.instagram.com/behive"]` | Array of URLs |
| telephone | Contact phone number. | `'+61-3-9876-5432'` | E.164 format recommended |
| url | Canonical business URL. | `'https://rainwilds.github.io'` | Valid URL |

---

## Fonts Section

The `fonts` section defines font resources to be **preloaded** for performance.

```json
"fonts": [
  {
    "href": "./fonts/Futura_PT_Demi.woff2",
    "as": "font",
    "type": "font/woff2",
    "crossorigin": "anonymous"
  },
  {
    "href": "./fonts/futura_pt_book.woff2",
    "as": "font",
    "type": "font/woff2",
    "crossorigin": "anonymous"
  }
]