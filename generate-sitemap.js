/**
 * generate-sitemap.js
 * Generates public/sitemap.xml for Deep Vortex AI Hub.
 *
 * - Preserves all existing static entries (subdomain tools, blog posts)
 * - Dynamically scans public/solutions/ and adds each page at priority 0.8
 * - Updates <lastmod> on the Hub root to today's date
 * - Writes the result to public/sitemap.xml
 *
 * Usage:
 *   node generate-sitemap.js
 */

import fs   from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

// Today's date in YYYY-MM-DD (used for Hub root and any new solution pages)
const today = new Date().toISOString().split('T')[0];

// ── Static entries ────────────────────────────────────────────────────────────
// Subdomain tools and blog posts are static — their lastmod is preserved.
// Only the Hub root gets its lastmod bumped to today on every run.

const staticEntries = [
  // Hub root — always priority 1.0, always updated to today
  { loc: 'https://deepvortexai.com/',      priority: '1.0', changefreq: 'weekly',  lastmod: today },

  // Subdomain AI tools
  { loc: 'https://images.deepvortexai.com/',  priority: '0.7', changefreq: 'weekly',  lastmod: '2026-03-08' },
  { loc: 'https://emoticons.deepvortexai.com/', priority: '0.7', changefreq: 'weekly', lastmod: '2026-03-08' },
  { loc: 'https://bgremover.deepvortexai.com/', priority: '0.7', changefreq: 'weekly', lastmod: '2026-03-08' },
  { loc: 'https://upscaler.deepvortexai.com/', priority: '0.7', changefreq: 'weekly', lastmod: '2026-03-08' },
  { loc: 'https://3d.deepvortexai.com/',       priority: '0.7', changefreq: 'weekly',  lastmod: '2026-03-08' },
  { loc: 'https://voice.deepvortexai.com/',    priority: '0.7', changefreq: 'weekly',  lastmod: '2026-03-08' },
  { loc: 'https://video.deepvortexai.com/',    priority: '0.7', changefreq: 'weekly',  lastmod: '2026-03-08' },
  { loc: 'https://avatar.deepvortexai.com/',  priority: '0.7', changefreq: 'weekly',  lastmod: today },

  // Game page
  { loc: 'https://deepvortexai.com/game',     priority: '0.9', changefreq: 'weekly',  lastmod: today },

  // Blog index
  { loc: 'https://deepvortexai.com/blog/',     priority: '0.8', changefreq: 'weekly',  lastmod: '2026-03-09' },

  // Blog posts
  { loc: 'https://deepvortexai.com/blog/how-to-remove-image-background-with-ai/', priority: '0.7', changefreq: 'monthly', lastmod: '2026-03-09' },
  { loc: 'https://deepvortexai.com/blog/best-ai-image-upscaler-2026/',            priority: '0.7', changefreq: 'monthly', lastmod: '2026-03-09' },
  { loc: 'https://deepvortexai.com/blog/turn-photo-into-3d-model-online/',        priority: '0.7', changefreq: 'monthly', lastmod: '2026-03-09' },
  { loc: 'https://deepvortexai.com/blog/ai-image-to-video-generator-guide/',      priority: '0.7', changefreq: 'monthly', lastmod: '2026-03-09' },
  { loc: 'https://deepvortexai.com/blog/ai-voice-generator-text-to-speech/',      priority: '0.7', changefreq: 'monthly', lastmod: '2026-03-09' },
  { loc: 'https://deepvortexai.com/blog/best-ai-image-generator-2026/',           priority: '0.7', changefreq: 'monthly', lastmod: '2026-03-09' },
  { loc: 'https://deepvortexai.com/blog/custom-ai-emoticon-generator/',           priority: '0.7', changefreq: 'monthly', lastmod: '2026-03-09' },
  { loc: 'https://deepvortexai.com/blog/deep-vortex-ai-all-tools-guide/',         priority: '0.7', changefreq: 'monthly', lastmod: '2026-03-09' },
];

// ── Dynamic: scan public/solutions/ ──────────────────────────────────────────

const solutionsDir = path.join(__dirname, 'public', 'solutions');
const solutionEntries = [];

if (fs.existsSync(solutionsDir)) {
  const files = fs.readdirSync(solutionsDir).filter(f => f.endsWith('.html'));
  files.sort(); // deterministic order

  for (const file of files) {
    const slug = file.replace('.html', '');
    solutionEntries.push({
      loc:        `https://deepvortexai.com/solutions/${file}`,
      priority:   '0.8',
      changefreq: 'monthly',
      lastmod:    today,
    });
    console.log(`  + solutions/${file}`);
  }
} else {
  console.warn('WARNING: public/solutions/ not found — run node generate-pages.js first.');
}

// ── Build XML ─────────────────────────────────────────────────────────────────

/**
 * Render a single <url> block.
 * @param {{ loc: string, priority: string, changefreq: string, lastmod: string }} entry
 */
function renderUrl(entry) {
  return [
    '  <url>',
    `    <loc>${entry.loc}</loc>`,
    `    <lastmod>${entry.lastmod}</lastmod>`,
    `    <changefreq>${entry.changefreq}</changefreq>`,
    `    <priority>${entry.priority}</priority>`,
    '  </url>',
  ].join('\n');
}

const allEntries = [...staticEntries, ...solutionEntries];

const xml = [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
  allEntries.map(renderUrl).join('\n'),
  '</urlset>',
  '', // trailing newline
].join('\n');

// ── Write output ──────────────────────────────────────────────────────────────

const outputPath = path.join(__dirname, 'public', 'sitemap.xml');
fs.writeFileSync(outputPath, xml, 'utf8');

console.log(`\n✓ Sitemap written to public/sitemap.xml`);
console.log(`  ${allEntries.length} URLs total (${staticEntries.length} static + ${solutionEntries.length} solutions)`);
console.log(`  Hub lastmod: ${today}`);
