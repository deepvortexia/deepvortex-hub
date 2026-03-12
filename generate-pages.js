/**
 * generate-pages.js
 * Programmatic SEO page generator for Deep Vortex AI Hub.
 *
 * Reads solutions/niche-template.html and generates one SEO-optimized
 * landing page per niche into the solutions/ directory.
 *
 * Usage:
 *   node generate-pages.js
 */

import fs   from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

// ── Niche definitions ────────────────────────────────────────────────────────

const niches = [
  {
    nicheName:       'Digital Artists',
    slug:            'digital-artists',
    pageTitle:       'AI Tools for Digital Artists | Deep Vortex AI',
    metaDescription: 'Supercharge your digital art workflow with Deep Vortex AI. Generate stunning AI images, design custom emoticons, and transform artwork into video — all free in one place.',
    metaKeywords:    'AI tools for digital artists, AI image generator for artists, digital art AI, AI creative suite, text to image AI, AI art generator',
    h1Title:         'AI Creative Suite for Digital Artists',
    tagline:         'Create faster. Imagine further. Powered by AI.',
    heroDescription: 'Deep Vortex AI gives digital artists a complete creative engine. Generate reference images, create branded emoticon packs, and animate your artwork into stunning videos — without leaving your browser.',
    usecase1Icon:    '🖼️',
    usecase1Title:   'Instant Visual References',
    usecase1Text:    'Generate high-quality AI images from text prompts to use as mood boards, composition references, or standalone artworks in seconds.',
    usecase2Icon:    '✏️',
    usecase2Title:   'Custom Emoticon Packs',
    usecase2Text:    'Design unique emoticon sets that match your art style. Perfect for Twitch, Discord communities, and social media branding.',
    usecase3Icon:    '🎞️',
    usecase3Title:   'Animate Your Artwork',
    usecase3Text:    'Transform any static illustration into a captivating AI-generated video and share it across platforms to grow your audience.',
    toolImageDesc:   'Generate detailed concept art, character designs, and background references from a single text prompt.',
    toolEmoticonDesc:'Create a full emoticon pack in your personal art style — ready for Discord, Twitch, or social media.',
    toolVideoDesc:   'Bring your illustrations to life with smooth AI-generated motion effects.',
  },
  {
    nicheName:       'Gamers',
    slug:            'gamers',
    pageTitle:       'AI Tools for Gamers | Deep Vortex AI',
    metaDescription: 'Level up your gaming brand with Deep Vortex AI. Generate custom AI avatars, create unique gaming emoticons, and produce epic AI-powered highlight videos — all free.',
    metaKeywords:    'AI tools for gamers, AI avatar generator, gaming AI tools, custom gaming emoticons, AI gaming content, streamer tools',
    h1Title:         'AI Creative Suite for Gamers',
    tagline:         'Level up your gaming brand with AI.',
    heroDescription: 'Whether you are a streamer, competitive player, or content creator, Deep Vortex AI gives you the tools to build a powerful gaming identity — custom avatars, emotes, and cinematic highlight videos.',
    usecase1Icon:    '🎮',
    usecase1Title:   'Unique Gaming Avatars',
    usecase1Text:    'Generate one-of-a-kind profile pictures and character art that set you apart on Steam, Discord, and Twitch.',
    usecase2Icon:    '😤',
    usecase2Title:   'Custom Channel Emotes',
    usecase2Text:    'Create subscriber-ready emotes and reaction packs that match your gaming persona and community vibe.',
    usecase3Icon:    '📽️',
    usecase3Title:   'Cinematic Highlight Videos',
    usecase3Text:    'Turn your best in-game screenshots into AI-animated video clips — ideal for YouTube shorts and social reels.',
    toolImageDesc:   'Generate custom gaming avatars, weapons, maps, and character concepts from text in seconds.',
    toolEmoticonDesc:'Build a full emote library for your Twitch or Discord channel with AI-generated custom reactions.',
    toolVideoDesc:   'Animate your gaming screenshots into cinematic video clips ready to share anywhere.',
  },
  {
    nicheName:       'Real Estate',
    slug:            'real-estate',
    pageTitle:       'AI Tools for Real Estate Professionals | Deep Vortex AI',
    metaDescription: 'Transform your real estate marketing with Deep Vortex AI. Generate stunning property visuals, create branded content, and produce AI-powered listing videos that attract more buyers.',
    metaKeywords:    'AI tools for real estate, AI property images, real estate AI marketing, AI listing videos, property visualization AI, real estate content AI',
    h1Title:         'AI Creative Suite for Real Estate Professionals',
    tagline:         'Transform property marketing with AI.',
    heroDescription: 'Stand out in a competitive market. Deep Vortex AI helps real estate agents and brokers create stunning property visuals, branded social content, and engaging listing videos — without a design team.',
    usecase1Icon:    '🏡',
    usecase1Title:   'Property Visualization',
    usecase1Text:    'Generate photorealistic renderings of renovation ideas, staging concepts, and dream property exteriors to impress potential buyers.',
    usecase2Icon:    '🏷️',
    usecase2Title:   'Branded Social Content',
    usecase2Text:    'Create branded emoticons and stickers for your agency — perfect for WhatsApp, Instagram, and client communication.',
    usecase3Icon:    '🎥',
    usecase3Title:   'Listing Showcase Videos',
    usecase3Text:    'Convert property photos into smooth AI-animated walkthrough videos that drive more engagement on listing platforms.',
    toolImageDesc:   'Generate stunning property renderings, neighborhood visuals, and interior design concepts from a text description.',
    toolEmoticonDesc:'Design branded emoticons for your agency to use in client chats, social media, and marketing campaigns.',
    toolVideoDesc:   'Turn property photos into polished AI-animated listing videos that capture buyer attention.',
  },
  {
    nicheName:       'E-commerce',
    slug:            'e-commerce',
    pageTitle:       'AI Tools for E-commerce Brands | Deep Vortex AI',
    metaDescription: 'Scale your e-commerce visuals with Deep Vortex AI. Generate product images, create custom brand emoticons, and produce AI-powered product videos that convert browsers into buyers.',
    metaKeywords:    'AI tools for e-commerce, AI product images, e-commerce AI content, AI brand visuals, product video AI, AI marketing tools',
    h1Title:         'AI Creative Suite for E-commerce Brands',
    tagline:         'Create content that sells — powered by AI.',
    heroDescription: 'Deep Vortex AI lets e-commerce brands produce high-converting visuals at scale. Generate product imagery, build branded emoticon packs for customer engagement, and animate products into captivating video ads.',
    usecase1Icon:    '📦',
    usecase1Title:   'AI Product Imagery',
    usecase1Text:    'Generate lifestyle and studio-quality product images without a photo shoot — perfect for ads, listings, and landing pages.',
    usecase2Icon:    '💬',
    usecase2Title:   'Brand Emoticons',
    usecase2Text:    'Build a set of branded emoticons for customer support chats, loyalty programs, and social media engagement.',
    usecase3Icon:    '🛒',
    usecase3Title:   'Product Video Ads',
    usecase3Text:    'Turn static product images into dynamic AI video ads that perform better on Instagram, TikTok, and Facebook.',
    toolImageDesc:   'Generate on-brand product images, lifestyle photos, and promotional visuals in seconds — no photo shoot needed.',
    toolEmoticonDesc:'Create a branded emoticon pack for customer communication, loyalty campaigns, and social engagement.',
    toolVideoDesc:   'Animate product photos into high-converting video ads for social media and paid campaigns.',
  },
  {
    nicheName:       'YouTubers',
    slug:            'youtubers',
    pageTitle:       'AI Tools for YouTubers | Deep Vortex AI',
    metaDescription: 'Grow your YouTube channel with Deep Vortex AI. Generate eye-catching thumbnails, create custom channel emoticons, and produce AI-powered video content at scale — completely free.',
    metaKeywords:    'AI tools for YouTubers, AI thumbnail generator, YouTube AI content, AI video tools for creators, YouTube channel growth AI, content creator AI tools',
    h1Title:         'AI Creative Suite for YouTubers',
    tagline:         'Fuel your YouTube growth with AI.',
    heroDescription: 'Deep Vortex AI is built for YouTube creators who want to produce more, spend less, and grow faster. Generate scroll-stopping thumbnails, build a branded emote library for Members, and turn clips into AI-animated shorts.',
    usecase1Icon:    '🖱️',
    usecase1Title:   'Click-Worthy Thumbnails',
    usecase1Text:    'Generate bold, high-contrast thumbnail concepts with AI and test multiple styles to maximize your click-through rate.',
    usecase2Icon:    '🏅',
    usecase2Title:   'Members-Only Emotes',
    usecase2Text:    'Reward channel members with a custom AI-generated emote pack that reinforces your brand identity and boosts retention.',
    usecase3Icon:    '⚡',
    usecase3Title:   'AI Shorts & Reels',
    usecase3Text:    'Convert still images or key frames into AI-animated Shorts and Reels — a fast way to grow on multiple platforms at once.',
    toolImageDesc:   'Generate compelling thumbnail concepts, channel art, and promotional graphics from a single text prompt.',
    toolEmoticonDesc:'Design exclusive member emotes and community stickers that deepen audience connection.',
    toolVideoDesc:   'Animate images into YouTube Shorts and Reels instantly — expand your reach without extra filming.',
  },
];

// ── Generator ─────────────────────────────────────────────────────────────────

const templatePath = path.join(__dirname, 'solutions', 'niche-template.html');
// Output goes to public/solutions/ so Vite copies the files into dist/ at build time.
// This ensures Vercel serves each page as a real static file instead of falling
// through to the SPA catch-all rewrite, which was causing the canonical conflict.
const outputDir    = path.join(__dirname, 'public', 'solutions');

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
  console.log('Created output directory: public/solutions/');
}

if (!fs.existsSync(templatePath)) {
  console.error('ERROR: Template not found at', templatePath);
  process.exit(1);
}

const template = fs.readFileSync(templatePath, 'utf8');

/**
 * Replace all occurrences of a placeholder token with a value.
 * @param {string} html
 * @param {string} token   - e.g. '{{SLUG}}'
 * @param {string} value
 */
function replace(html, token, value) {
  return html.split(token).join(value);
}

let generated = 0;

for (const niche of niches) {
  let html = template;

  html = replace(html, '{{NICHE_NAME}}',        niche.nicheName);
  html = replace(html, '{{SLUG}}',              niche.slug);
  html = replace(html, '{{PAGE_TITLE}}',        niche.pageTitle);
  html = replace(html, '{{META_DESCRIPTION}}',  niche.metaDescription);
  html = replace(html, '{{META_KEYWORDS}}',     niche.metaKeywords);
  html = replace(html, '{{H1_TITLE}}',          niche.h1Title);
  html = replace(html, '{{TAGLINE}}',           niche.tagline);
  html = replace(html, '{{HERO_DESCRIPTION}}',  niche.heroDescription);
  html = replace(html, '{{USECASE_1_ICON}}',    niche.usecase1Icon);
  html = replace(html, '{{USECASE_1_TITLE}}',   niche.usecase1Title);
  html = replace(html, '{{USECASE_1_TEXT}}',    niche.usecase1Text);
  html = replace(html, '{{USECASE_2_ICON}}',    niche.usecase2Icon);
  html = replace(html, '{{USECASE_2_TITLE}}',   niche.usecase2Title);
  html = replace(html, '{{USECASE_2_TEXT}}',    niche.usecase2Text);
  html = replace(html, '{{USECASE_3_ICON}}',    niche.usecase3Icon);
  html = replace(html, '{{USECASE_3_TITLE}}',   niche.usecase3Title);
  html = replace(html, '{{USECASE_3_TEXT}}',    niche.usecase3Text);
  html = replace(html, '{{TOOL_IMAGE_DESC}}',   niche.toolImageDesc);
  html = replace(html, '{{TOOL_EMOTICON_DESC}}',niche.toolEmoticonDesc);
  html = replace(html, '{{TOOL_VIDEO_DESC}}',   niche.toolVideoDesc);

  const outputPath = path.join(outputDir, `${niche.slug}.html`);
  fs.writeFileSync(outputPath, html, 'utf8');
  console.log(`✓ Generated: public/solutions/${niche.slug}.html`);
  generated++;
}

console.log(`\nDone — ${generated} pages generated in solutions/`);
