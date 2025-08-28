# Custom Block Documentation

The `<custom-block>` is a versatile Web Component designed to create customizable content blocks with support for background images, primary images, videos, text, icons, and buttons. It provides a range of attributes to control styling, layout, and media rendering. Below is a detailed explanation of all attributes, grouped into General, Image, Video, and Icon categories, presented in alphabetical order within each group.

## General Attributes

| Attribute Name | Description | Default Value | Expected Format |
|----------------|-------------|---------------|-----------------|
| background-color | Sets the background color of the entire block using a predefined class. | `''` (empty) | `background-color-[number]` (e.g., `background-color-1`) |
| background-gradient | Applies a gradient overlay to the block's background. | `''` (empty) | `background-gradient-[number]` (e.g., `background-gradient-1`) |
| background-image-noise | Adds a noise texture to the block's background when present. | Not set (false) | Boolean attribute (presence indicates `true`) |
| background-overlay | Applies an overlay effect over the background image or video. | `''` (empty) | `background-overlay-[number]` (e.g., `background-overlay-1`) |
| backdrop-filter | Applies backdrop filter effects to the background overlay. | `''` (empty) | Space-separated class names (e.g., `backdrop-filter-blur-small backdrop-filter-grayscale-medium`) |
| border | Sets the border style for the block. | `''` (empty) | CSS class name (e.g., `border-small`) |
| border-radius | Sets the border radius for the block, requires `border` to be set. | `''` (empty) | CSS class name (e.g., `border-radius-small`) |
| button-href | Specifies the URL for the button's link. | `'#'` | Valid URL or anchor (e.g., `https://example.com`) |
| button-text | Defines the text displayed on the button. | `''` (empty) | Plain text (e.g., `Click Here`) |
| class | Adds custom CSS classes to the outer block element. | `''` (empty) | Space-separated class names (e.g., `custom-class another-class`) |
| heading | Sets the text for the heading element. | `'Default Heading'` | Plain text (e.g., `Welcome`) |
| heading-tag | Specifies the HTML tag for the heading. | `'h2'` | One of: `h1`, `h2`, `h3`, `h4`, `h5`, `h6` |
| inner-alignment | Controls the alignment of the inner content div. | `''` (empty) | One of: `center`, `top`, `bottom`, `left`, `right`, `top-left`, `top-center`, `top-right`, `bottom-left`, `bottom-center`, `bottom-right`, `center-left`, `center-right` |
| inner-background-color | Sets the background color for the inner content div. | `''` (empty) | `background-color-[number]` (e.g., `background-color-2`) |
| inner-background-gradient | Applies a gradient overlay to the inner content div. | `''` (empty) | `background-gradient-[number]` (e.g., `background-gradient-2`) |
| inner-background-image-noise | Adds a noise texture to the inner content div when present. | Not set (false) | Boolean attribute (presence indicates `true`) |
| inner-background-overlay | Applies an overlay effect to the inner content div. | `''` (empty) | `background-overlay-[number]` (e.g., `background-overlay-2`) |
| inner-backdrop-filter | Applies backdrop filter effects to the inner content div. | `''` (empty) | Space-separated class names (e.g., `backdrop-filter-blur-small backdrop-filter-grayscale-medium`) |
| inner-border | Sets the border style for the inner content div. | `''` (empty) | CSS class name (e.g., `border-dashed`) |
| inner-border-radius | Sets the border radius for the inner content div, requires `inner-border`. | `''` (empty) | CSS class name (e.g., `border-radius-small`) |
| inner-class | Adds custom CSS classes to the inner content div. | `''` (empty) | Space-separated class names (e.g., `inner-custom inner-style`) |
| inner-style | Applies inline CSS styles to the inner content div. | `''` (empty) | CSS style string (e.g., `background: blue; padding: 10px;`) |
| section-title | Marks the block as a section title when present, requires `heading` and no `button-text`. | Not set (false) | Boolean attribute (presence indicates `true`) |
| shadow | Applies a shadow effect to the outer block. | `''` (empty) | One of: `shadow-light`, `shadow-medium`, `shadow-heavy` |
| inner-shadow | Applies a shadow effect to the inner content div. | `''` (empty) | One of: `shadow-light`, `shadow-medium`, `shadow-heavy` |
| style | Applies inline CSS styles to the outer block element. | `''` (empty) | CSS style string (e.g., `background: red; margin: 10px;`) |
| sub-heading | Sets the text for the sub-heading element. | `''` (empty) | Plain text (e.g., `Subtitle`) |
| sub-heading-tag | Specifies the HTML tag for the sub-heading. | `'h3'` | One of: `h1`, `h2`, `h3`, `h4`, `h5`, `h6` |
| text | Defines the text content for the paragraph in the block. | `'Default description text.'` | Plain text (e.g., `This is a description.`) |
| text-alignment | Sets the text alignment for the inner content group. | `''` (empty) | One of: `left`, `center`, `right` |

## Icon Attributes

| Attribute Name | Description | Default Value | Expected Format |
|----------------|-------------|---------------|-----------------|
| icon | Specifies a Font Awesome icon to display. | `''` (empty) | Valid Font Awesome `<i>` tag (e.g., `<i class="fa-regular fa-house"></i>`) |
| icon-class | Adds custom CSS classes to the icon element. | `''` (empty) | Space-separated class names (e.g., `icon-large icon-custom`) |
| icon-size | Sets the font size of the Font Awesome icon. | `''` (empty) | Valid CSS rem value (e.g., `2rem`) |
| icon-style | Applies inline CSS styles to the icon element. | `''` (empty) | CSS style string (e.g., `color: blue; margin: 5px;`) |

## Image Attributes

| Attribute Name | Description | Default Value | Expected Format |
|----------------|-------------|---------------|-----------------|
| img-background-alt | Provides the alt text for the background image for accessibility. | `''` (empty) | Plain text (e.g., `Background scene`) |
| img-background-aspect-ratio | Sets the aspect ratio for the background image. | `''` (empty) | CSS aspect ratio (e.g., `16/9`) |
| img-background-dark-src | Specifies the source URL for the background image in dark mode. | `''` (empty) | Valid image URL (e.g., `image-dark.jpg`) |
| img-background-decorative | Marks the background image as decorative (no alt text) when present. | Not set (false) | Boolean attribute (presence indicates `true`) |
| img-background-desktop-width | Sets the width of the background image on desktop screens. | `'100vw'` | CSS width value (e.g., `1200px`) |
| img-background-fetchpriority | Defines the fetch priority for the background image. | `''` (empty) | One of: `high`, `low`, `auto` |
| img-background-include-schema | Includes schema markup for the background image when present. | Not set (false) | Boolean attribute (presence indicates `true`) |
| img-background-light-src | Specifies the source URL for the background image in light mode. | `''` (empty) | Valid image URL (e.g., `image-light.jpg`) |
| img-background-loading | Sets the loading strategy for the background image. | `'lazy'` | One of: `lazy`, `eager` |
| img-background-mobile-width | Sets the width of the background image on mobile screens. | `'100vw'` | CSS width value (e.g., `600px`) |
| img-background-src | Specifies the default source URL for the background image. | `''` (empty) | Valid image URL (e.g., `image.jpg`) |
| img-background-tablet-width | Sets the width of the background image on tablet screens. | `'100vw'` | CSS width value (e.g., `800px`) |
| img-primary-alt | Provides the alt text for the primary image for accessibility. | `''` (empty) | Plain text (e.g., `Primary logo`) |
| img-primary-aspect-ratio | Sets the aspect ratio for the primary image. | `''` (empty) | CSS aspect ratio (e.g., `1/1`) |
| img-primary-dark-src | Specifies the source URL for the primary image in dark mode. | `''` (empty) | Valid image URL (e.g., `primary-dark.jpg`) |
| img-primary-decorative | Marks the primary image as decorative (no alt text) when present. | Not set (false) | Boolean attribute (presence indicates `true`) |
| img-primary-desktop-width | Sets the width of the primary image on desktop screens. | `'100vw'` | CSS width value (e.g., `1200px`) |
| img-primary-fetchpriority | Defines the fetch priority for the primary image. | `''` (empty) | One of: `high`, `low`, `auto` |
| img-primary-include-schema | Includes schema markup for the primary image when present. | Not set (false) | Boolean attribute (presence indicates `true`) |
| img-primary-light-src | Specifies the source URL for the primary image in light mode. | `''` (empty) | Valid image URL (e.g., `primary-light.jpg`) |
| img-primary-loading | Sets the loading strategy for the primary image. | `'lazy'` | One of: `lazy`, `eager` |
| img-primary-mobile-width | Sets the width of the primary image on mobile screens. | `'100vw'` | CSS width value (e.g., `600px`) |
| img-primary-position | Specifies the position of the primary image relative to content. | `'none'` | One of: `none`, `top`, `bottom`, `left`, `right` |
| img-primary-src | Specifies the default source URL for the primary image. | `''` (empty) | Valid image URL (e.g., `primary.jpg`) |
| img-primary-tablet-width | Sets the width of the primary image on tablet screens. | `'100vw'` | CSS width value (e.g., `800px`) |

## Video Attributes

| Attribute Name | Description | Default Value | Expected Format |
|----------------|-------------|---------------|-----------------|
| video-background-alt | Provides the accessibility description for the background video. | `'Video content'` | Plain text (e.g., `Background video scene`) |
| video-background-autoplay | Enables autoplay for the background video when present. | Not set (false) | Boolean attribute (presence indicates `true`) |
| video-background-dark-poster | Specifies the poster image URL for the background video in dark mode. | `''` (empty) | Valid image URL (e.g., `poster-dark.jpg`) |
| video-background-dark-src | Specifies the source URL for the background video in dark mode. | `''` (empty) | Valid video URL (e.g., `video-dark.mp4`) |
| video-background-disable-pip | Disables picture-in-picture mode for the background video when present. | Not set (false) | Boolean attribute (presence indicates `true`) |
| video-background-light-poster | Specifies the poster image URL for the background video in light mode. | `''` (empty) | Valid image URL (e.g., `poster-light.jpg`) |
| video-background-light-src | Specifies the source URL for the background video in light mode. | `''` (empty) | Valid video URL (e.g., `video-light.mp4`) |
| video-background-loading | Sets the loading strategy for the background video. | `'lazy'` | One of: `lazy`, `eager` |
| video-background-loop | Enables looping for the background video when present. | Not set (false) | Boolean attribute (presence indicates `true`) |
| video-background-muted | Mutes the background video when present or when `video-background-autoplay` is set. | Not set (false) | Boolean attribute (presence indicates `true`) |
| video-background-playsinline | Enables inline playback for the background video when present. | Not set (false) | Boolean attribute (presence indicates `true`) |
| video-background-poster | Specifies the default poster image URL for the background video. | `''` (empty) | Valid image URL (e.g., `poster.jpg`) |
| video-background-src | Specifies the default source URL for the background video. | `''` (empty) | Valid video URL (e.g., `video.mp4`) |
| video-primary-alt | Provides the accessibility description for the primary video. | `'Video content'` | Plain text (e.g., `Primary video scene`) |
| video-primary-autoplay | Enables autoplay for the primary video when present. | Not set (false) | Boolean attribute (presence indicates `true`) |
| video-primary-dark-poster | Specifies the poster image URL for the primary video in dark mode. | `''` (empty) | Valid image URL (e.g., `primary-poster-dark.jpg`) |
| video-primary-dark-src | Specifies the source URL for the primary video in dark mode. | `''` (empty) | Valid video URL (e.g., `primary-video-dark.mp4`) |
| video-primary-disable-pip | Disables picture-in-picture mode for the primary video when present. | Not set (false) | Boolean attribute (presence indicates `true`) |
| video-primary-light-poster | Specifies the poster image URL for the primary video in light mode. | `''` (empty) | Valid image URL (e.g., `primary-poster-light.jpg`) |
| video-primary-light-src | Specifies the source URL for the primary video in light mode. | `''` (empty) | Valid video URL (e.g., `primary-video-light.mp4`) |
| video-primary-loading | Sets the loading strategy for the primary video. | `'lazy'` | One of: `lazy`, `eager` |
| video-primary-loop | Enables looping for the primary video when present. | Not set (false) | Boolean attribute (presence indicates `true`) |
| video-primary-muted | Mutes the primary video when present or when `video-primary-autoplay` is set. | Not set (false) | Boolean attribute (presence indicates `true`) |
| video-primary-playsinline | Enables inline playback for the primary video when present. | Not set (false) | Boolean attribute (presence indicates `true`) |
| video-primary-poster | Specifies the default poster image URL for the primary video. | `''` (empty) | Valid image URL (e.g., `primary-poster.jpg`) |
| video-primary-src | Specifies the default source URL for the primary video. | `''` (empty) | Valid video URL (e.g., `primary-video.mp4`) |