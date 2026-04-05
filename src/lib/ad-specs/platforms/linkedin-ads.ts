// MCV One — Ad Placement Intelligence System
// LinkedIn ad format specifications

import type { AdFormat } from '../types';

export const LINKEDIN_AD_FORMATS: AdFormat[] = [
  {
    id: 'linkedin-ads:sponsored-content:single-image',
    platform: 'linkedin-ads',
    placement: 'feed',
    name: 'Sponsored Content: Single Image',
    mediaType: 'image',
    description: 'Single image ad in the LinkedIn feed. Best for driving awareness and engagement with professional audiences.',
    imageSpec: {
      formats: ['jpg', 'png', 'gif'],
      maxFileSizeMb: 5,
      dimensions: [
        { width: 1200, height: 627, label: 'Landscape (recommended)' },
        { width: 1200, height: 1200, label: 'Square' },
        { width: 1080, height: 1350, label: 'Portrait 4:5' },
      ],
      aspectRatios: [
        { ratio: '1.91:1', minWidth: 1200, minHeight: 627 },
        { ratio: '1:1', minWidth: 1200, minHeight: 1200 },
        { ratio: '4:5', minWidth: 1080, minHeight: 1350 },
      ],
    },
    textSpecs: [
      { field: 'intro_text', maxChars: 600, recommended: 150, notes: 'Text above the image; truncated after ~150 chars on mobile' },
      { field: 'headline', maxChars: 200, recommended: 70, notes: 'Displayed below the image; aim for under 70 chars' },
      { field: 'description', maxChars: 300, recommended: 100, notes: 'Optional description shown on some placements' },
    ],
    callToAction: [
      'Apply Now', 'Download', 'Get Quote', 'Learn More', 'Sign Up',
      'Subscribe', 'Register', 'Join', 'Attend', 'Request Demo',
    ],
    tips: [
      'Use 1200x627 for maximum compatibility across devices',
      'Keep intro text under 150 characters to avoid truncation on mobile',
      'Use a clear, professional image that resonates with your target audience',
      'Headlines under 70 characters avoid truncation in the feed',
    ],
    docsUrl: 'https://www.linkedin.com/help/lms/answer/a427660',
    verifiedAt: '2026-03-15',
  },
  {
    id: 'linkedin-ads:sponsored-content:video',
    platform: 'linkedin-ads',
    placement: 'feed',
    name: 'Sponsored Content: Video',
    mediaType: 'video',
    description: 'Native video ad in the LinkedIn feed. Ideal for thought leadership, product demos, and brand storytelling.',
    videoSpec: {
      formats: ['mp4'],
      maxFileSizeMb: 200,
      minWidth: 75,
      minHeight: 75,
      maxWidth: 4096,
      maxHeight: 2304,
      aspectRatios: [
        { ratio: '16:9', minWidth: 640, minHeight: 360 },
        { ratio: '1:1', minWidth: 360, minHeight: 360 },
        { ratio: '9:16', minWidth: 360, minHeight: 640 },
      ],
      minDurationSec: 3,
      maxDurationSec: 1800,
      recommendedDurationSec: 30,
      captionsRecommended: true,
    },
    textSpecs: [
      { field: 'intro_text', maxChars: 600, recommended: 150, notes: 'Text above the video; keep concise for mobile' },
      { field: 'headline', maxChars: 200, recommended: 70, notes: 'Displayed below the video player' },
    ],
    callToAction: [
      'Apply Now', 'Download', 'Get Quote', 'Learn More', 'Sign Up',
      'Subscribe', 'Register', 'Request Demo', 'Watch More',
    ],
    tips: [
      'Keep videos 15-30 seconds for best completion rates',
      'Add captions — 80% of LinkedIn video is watched on mute',
      'Hook viewers in the first 3 seconds with a compelling visual',
      'Use square (1:1) or vertical (9:16) for mobile-first campaigns',
    ],
    docsUrl: 'https://www.linkedin.com/help/lms/answer/a427660',
    verifiedAt: '2026-03-15',
  },
  {
    id: 'linkedin-ads:sponsored-content:carousel',
    platform: 'linkedin-ads',
    placement: 'feed',
    name: 'Sponsored Content: Carousel',
    mediaType: 'carousel',
    description: 'Swipeable carousel ad with 2-10 image cards. Great for showcasing multiple products, features, or a narrative sequence.',
    imageSpec: {
      formats: ['jpg', 'png'],
      maxFileSizeMb: 10,
      dimensions: [
        { width: 1080, height: 1080, label: 'Card image (square, required)' },
      ],
      aspectRatios: [
        { ratio: '1:1', minWidth: 1080, minHeight: 1080 },
      ],
    },
    textSpecs: [
      { field: 'intro_text', maxChars: 255, recommended: 150, notes: 'Text above the carousel' },
      { field: 'card_headline', maxChars: 45, notes: 'Per-card headline displayed below each image' },
    ],
    callToAction: [
      'Apply Now', 'Download', 'Get Quote', 'Learn More', 'Sign Up',
      'Subscribe', 'Register', 'Request Demo',
    ],
    policyNotes: [
      'Minimum 2 cards, maximum 10 cards per carousel',
      'All cards must be 1080x1080 square format',
      'Max 10MB per individual card image',
    ],
    tips: [
      'Use 3-5 cards for the best engagement — too many cards reduces completion',
      'Each card can link to a unique landing page',
      'Create a visual narrative that encourages swiping through all cards',
      'First card is critical — it must stand on its own in the feed',
    ],
    docsUrl: 'https://www.linkedin.com/help/lms/answer/a427660',
    verifiedAt: '2026-03-15',
  },
  {
    id: 'linkedin-ads:sponsored-content:document',
    platform: 'linkedin-ads',
    placement: 'feed',
    name: 'Sponsored Content: Document',
    mediaType: 'responsive',
    description: 'Document ad that lets users browse a PDF, PowerPoint, or Word document directly in the feed. Ideal for whitepapers, case studies, and slide decks.',
    textSpecs: [
      { field: 'intro_text', maxChars: 600, recommended: 150, notes: 'Text above the document preview' },
      { field: 'headline', maxChars: 200, recommended: 70, notes: 'Displayed below the document preview' },
    ],
    callToAction: [
      'Download', 'Learn More', 'Sign Up', 'Subscribe', 'Register', 'Request Demo',
    ],
    policyNotes: [
      'Supported file types: PDF, PPT, PPTX, DOC, DOCX',
      'Maximum file size: 100MB',
      'Maximum 300 pages per document',
      'Lead gen forms can gate document downloads',
    ],
    tips: [
      'Design the first page as a compelling cover — it appears as the preview',
      'Keep documents under 10 pages for higher completion rates',
      'Use large fonts and bold visuals — documents are viewed on mobile screens',
      'Gate the full document with a lead gen form to capture leads',
    ],
    docsUrl: 'https://www.linkedin.com/help/lms/answer/a427660',
    verifiedAt: '2026-03-15',
  },
  {
    id: 'linkedin-ads:message-ad',
    platform: 'linkedin-ads',
    placement: 'messaging',
    name: 'Message Ad',
    mediaType: 'text',
    description: 'Sponsored message delivered directly to a member\'s LinkedIn inbox. Includes a CTA button and optional banner image.',
    imageSpec: {
      formats: ['jpg', 'png'],
      maxFileSizeMb: 2,
      dimensions: [
        { width: 300, height: 250, label: 'Banner image (optional)' },
      ],
    },
    textSpecs: [
      { field: 'subject', maxChars: 60, notes: 'Email-style subject line' },
      { field: 'body', maxChars: 1500, notes: 'Message body with personalization tokens supported' },
      { field: 'cta_button', maxChars: 20, notes: 'Call-to-action button text' },
    ],
    callToAction: [
      'Apply Now', 'Download', 'Get Quote', 'Learn More', 'Sign Up',
      'Subscribe', 'Register', 'Request Demo', 'Join Now',
    ],
    policyNotes: [
      'Members can only receive one Message Ad every 45 days',
      'Banner image (300x250) is optional but recommended',
    ],
    tips: [
      'Personalize the subject line — personalized messages have 2x open rates',
      'Keep the body concise and focused on a single CTA',
      'Use a conversational, professional tone — avoid overly salesy copy',
      'Include the optional 300x250 banner for additional brand visibility',
    ],
    docsUrl: 'https://www.linkedin.com/help/lms/answer/a427660',
    verifiedAt: '2026-03-15',
  },
  {
    id: 'linkedin-ads:text-ad',
    platform: 'linkedin-ads',
    placement: 'right-rail',
    name: 'Text Ad',
    mediaType: 'image',
    description: 'Simple text-based ad with a small thumbnail image shown in the right rail and top banner of LinkedIn desktop.',
    imageSpec: {
      formats: ['jpg', 'png'],
      maxFileSizeMb: 2,
      dimensions: [
        { width: 100, height: 100, label: 'Thumbnail image' },
      ],
      aspectRatios: [
        { ratio: '1:1', minWidth: 100, minHeight: 100 },
      ],
    },
    textSpecs: [
      { field: 'headline', maxChars: 25, notes: 'Short, punchy headline' },
      { field: 'description', maxChars: 75, notes: 'Brief description text' },
    ],
    callToAction: [
      'Apply Now', 'Download', 'Learn More', 'Sign Up', 'Visit Site',
    ],
    policyNotes: [
      'Desktop only — not shown on mobile',
      'Image is displayed at 100x100 pixels',
    ],
    tips: [
      'Use a clear, recognizable image — faces perform better than logos',
      'Front-load the headline with your key value proposition',
      'Text ads are cost-effective for driving traffic on a budget',
      'Test multiple ad variations — LinkedIn recommends 4+ per campaign',
    ],
    docsUrl: 'https://www.linkedin.com/help/lms/answer/a427660',
    verifiedAt: '2026-03-15',
  },
  {
    id: 'linkedin-ads:dynamic-ad:spotlight',
    platform: 'linkedin-ads',
    placement: 'right-rail',
    name: 'Dynamic Ad: Spotlight',
    mediaType: 'responsive',
    description: 'Personalized ad that dynamically uses the viewer\'s profile photo and name. Drives traffic to a landing page or generates leads.',
    imageSpec: {
      formats: ['jpg', 'png'],
      maxFileSizeMb: 2,
      dimensions: [
        { width: 100, height: 100, label: 'Company logo' },
      ],
      aspectRatios: [
        { ratio: '1:1', minWidth: 100, minHeight: 100 },
      ],
    },
    textSpecs: [
      { field: 'headline', maxChars: 50, notes: 'Supports personalization macros like %FIRSTNAME%' },
      { field: 'description', maxChars: 70, notes: 'Brief value proposition' },
      { field: 'cta_button', maxChars: 18, notes: 'Call-to-action button text' },
    ],
    callToAction: [
      'Apply Now', 'Download', 'Learn More', 'Sign Up', 'Visit Site', 'Get Started',
    ],
    policyNotes: [
      'Desktop only — not shown on mobile',
      'Viewer profile photo is automatically included for personalization',
    ],
    tips: [
      'Use personalization macros (%FIRSTNAME%) in the headline for engagement',
      'Keep the company logo clean and recognizable at 100x100',
      'Spotlight ads work well for event registration and content promotion',
      'CTA button text is limited to 18 characters — be concise',
    ],
    docsUrl: 'https://www.linkedin.com/help/lms/answer/a427660',
    verifiedAt: '2026-03-15',
  },
  {
    id: 'linkedin-ads:dynamic-ad:follower',
    platform: 'linkedin-ads',
    placement: 'right-rail',
    name: 'Dynamic Ad: Follower',
    mediaType: 'responsive',
    description: 'Personalized ad designed to grow your LinkedIn Company Page followers. Uses the viewer\'s profile photo alongside your company logo.',
    textSpecs: [
      { field: 'headline', maxChars: 50, notes: 'Supports personalization macros like %FIRSTNAME%' },
      { field: 'description', maxChars: 70, notes: 'Brief value proposition for following' },
    ],
    callToAction: [
      'Follow', 'Visit Company', 'Learn More',
    ],
    policyNotes: [
      'Desktop only — not shown on mobile',
      'Company logo is pulled automatically from your LinkedIn Company Page',
      'Viewer profile photo is automatically included for personalization',
      'CTA automatically changes to "Visit" once user already follows',
    ],
    tips: [
      'Use personalization to create a sense of direct connection',
      'Follower ads are the most cost-effective way to grow a Company Page',
      'Combine with organic content strategy for compounding results',
      'Target industry professionals who match your ideal follower profile',
    ],
    docsUrl: 'https://www.linkedin.com/help/lms/answer/a427660',
    verifiedAt: '2026-03-15',
  },
];
