import type { AdFormat } from '../types';

/** Helper to build a standard GDN banner format */
function gdnBanner(
  placement: string,
  name: string,
  width: number,
  height: number,
  description: string,
  tips: string[],
  docsUrl: string = 'https://support.google.com/google-ads/answer/7005917',
): AdFormat {
  return {
    id: `google-display-network:${placement}:image`,
    platform: 'google-display-network',
    placement,
    name,
    mediaType: 'image',
    description,
    imageSpec: {
      formats: ['jpg', 'png', 'gif'],
      maxFileSizeMb: 0.15,
      dimensions: [{ width, height, label: name }],
    },
    textSpecs: [],
    tips,
    docsUrl,
    verifiedAt: '2026-04-05',
  };
}

export const GDN_AD_FORMATS: AdFormat[] = [
  gdnBanner(
    'leaderboard',
    'Leaderboard',
    728,
    90,
    'Horizontal banner typically placed at the top of a page. One of the highest-performing IAB standard sizes.',
    [
      'Place key messaging and CTA on the left side where users look first.',
      'Animate sparingly — a subtle motion draws attention without annoying visitors.',
      'Test both static and animated versions to see which drives more clicks.',
    ],
  ),
  gdnBanner(
    'medium-rectangle',
    'Medium Rectangle',
    300,
    250,
    'Versatile mid-page ad unit. Often embedded within text content or in sidebars. Highest inventory availability on GDN.',
    [
      'This is the most widely available GDN size — always include it in your campaigns.',
      'Design for both sidebar and in-content placements where it may appear.',
      'Use contrasting colors to stand out from surrounding page content.',
    ],
  ),
  gdnBanner(
    'wide-skyscraper',
    'Wide Skyscraper',
    160,
    600,
    'Tall vertical banner placed in page sidebars. High visibility due to its persistent presence during scrolling.',
    [
      'Take advantage of the vertical space to tell a visual story or list benefits.',
      'Keep the CTA visible without requiring the user to scan the full height.',
      'Works well for brand awareness due to prolonged sidebar visibility.',
    ],
  ),
  gdnBanner(
    'half-page',
    'Half Page',
    300,
    600,
    'Large-format vertical ad that offers significant creative space. Also known as a "large skyscraper".',
    [
      'Use the generous canvas for rich imagery and detailed messaging.',
      'This size commands premium CPMs — make the creative worth it.',
      'Consider including product shots or lifestyle imagery to maximize engagement.',
    ],
  ),
  gdnBanner(
    'large-leaderboard',
    'Large Leaderboard',
    970,
    90,
    'Extended horizontal banner for wide desktop layouts. Offers more creative space than the standard 728x90.',
    [
      'Design with a fallback strategy since not all placements support 970px width.',
      'Use the extra width for a panoramic visual or additional product callouts.',
      'Pair with a standard 728x90 to maximize reach across all placements.',
    ],
  ),
  gdnBanner(
    'billboard',
    'Billboard',
    970,
    250,
    'Large-format top-of-page unit that dominates the viewport. Premium placement with high viewability.',
    [
      'Treat this as a mini landing page — include headline, visual, and CTA.',
      'This is a premium format; invest in high-quality creative to justify the CPM.',
      'Use animation or rich media to take full advantage of the large canvas.',
    ],
  ),
  gdnBanner(
    'mobile-banner',
    'Mobile Banner',
    320,
    50,
    'Standard mobile banner anchored at the top or bottom of the screen. The most common mobile ad size.',
    [
      'Keep text minimal — the small area demands extreme clarity.',
      'Use high-contrast colors so the ad is readable on small screens in bright light.',
      'Avoid fine details or small fonts that become illegible at mobile resolution.',
    ],
  ),
  gdnBanner(
    'large-mobile-banner',
    'Large Mobile Banner',
    320,
    100,
    'Taller mobile banner that offers twice the height of the standard 320x50. Improved click-through rates on mobile.',
    [
      'The extra height lets you add a product image alongside your CTA.',
      'This format outperforms 320x50 in most A/B tests — prioritize it for mobile.',
      'Ensure tap targets are large enough for comfortable thumb interaction.',
    ],
  ),
  gdnBanner(
    'square',
    'Square',
    250,
    250,
    'Square ad unit often placed in sidebars or within content. Good for visually balanced creatives.',
    [
      'The square aspect ratio works well for product images and app icons.',
      'Center your CTA for a balanced, symmetrical layout.',
      'Inventory is more limited than 300x250 — always pair with Medium Rectangle.',
    ],
  ),
  gdnBanner(
    'small-square',
    'Small Square',
    200,
    200,
    'Compact square unit for tight placements. Lower inventory but useful for niche publishers.',
    [
      'Simplify your design to its absolute essentials for this small canvas.',
      'Use a single bold image or icon rather than multiple elements.',
      'Consider this a supplementary size — do not rely on it as your primary format.',
    ],
  ),
  gdnBanner(
    'large-rectangle',
    'Large Rectangle',
    336,
    280,
    'Slightly larger than the Medium Rectangle. Often used in-content for higher engagement.',
    [
      'The extra pixels versus 300x250 give you room for clearer text and imagery.',
      'In-content placement drives higher viewability — optimize for engagement.',
      'Pair with 300x250 creatives to cover both sizes with minimal redesign.',
    ],
  ),
  gdnBanner(
    'inline-rectangle',
    'Inline Rectangle',
    300,
    250,
    'Same dimensions as Medium Rectangle but specifically placed inline within article content for higher engagement.',
    [
      'Design to blend naturally with editorial content without being deceptive.',
      'In-article placement yields higher viewability than sidebar — bid accordingly.',
      'Use contextual relevance to match surrounding content themes.',
    ],
  ),
  gdnBanner(
    'portrait',
    'Portrait',
    300,
    1050,
    'Extra-tall vertical format that occupies a large portion of the viewport. Premium placement for storytelling.',
    [
      'Use the extreme vertical space for sequential storytelling or infographics.',
      'Place the CTA at multiple points since users may not scroll the full height.',
      'This is a rare premium format — check placement availability before designing.',
    ],
  ),

  // Responsive Display Ad — unique format
  {
    id: 'google-display-network:responsive-display:responsive',
    platform: 'google-display-network',
    placement: 'responsive-display',
    name: 'Responsive Display Ad',
    mediaType: 'responsive',
    description:
      'Google automatically assembles ads from your uploaded assets. Adjusts size, appearance, and format to fit available placements across the GDN.',
    imageSpec: {
      formats: ['jpg', 'png'],
      maxFileSizeMb: 5,
      dimensions: [
        { width: 1200, height: 628, label: 'Landscape Image' },
        { width: 1200, height: 1200, label: 'Square Image' },
        { width: 128, height: 128, label: 'Logo (minimum)' },
      ],
    },
    textSpecs: [
      { field: 'headline', maxChars: 30, notes: 'Up to 5 headlines; Google tests combinations' },
      { field: 'long_headline', maxChars: 90, notes: 'Shown in larger ad layouts' },
      { field: 'description', maxChars: 90, notes: 'Up to 5 descriptions; Google tests combinations' },
      { field: 'business_name', maxChars: 25, notes: 'Your brand or company name' },
    ],
    tips: [
      'Upload the maximum number of assets (5 headlines, 5 descriptions, 15 images) to give Google the best optimization surface.',
      'Ensure each headline and description works independently — they will be mixed and matched.',
      'Provide both landscape (1.91:1) and square (1:1) images for maximum placement coverage.',
    ],
    docsUrl: 'https://support.google.com/google-ads/answer/7005917',
    verifiedAt: '2026-04-05',
  },
];
