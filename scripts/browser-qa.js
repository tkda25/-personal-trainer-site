#!/usr/bin/env node
const { chromium } = require('playwright');

const slug = process.argv[2];
if (!slug) {
  console.error('Usage: node scripts/browser-qa.js <slug>');
  process.exit(2);
}

const base = process.env.BROWSER_QA_BASE || 'http://127.0.0.1:4173';
const url = `${base.replace(/\/$/, '')}/sites/${encodeURIComponent(slug)}/`;
const viewports = [
  { name: 'mobile-390', width: 390, height: 844 },
  { name: 'mobile-430', width: 430, height: 932 },
];

const errors = [];
const warnings = [];
const passes = [];
const err = m => errors.push(m);
const warn = m => warnings.push(m);
const ok = m => passes.push(m);

(async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    for (const vp of viewports) {
      const page = await browser.newPage({ viewport: { width: vp.width, height: vp.height }, deviceScaleFactor: 1 });
      const jsErrors = [];
      const localFailures = [];
      const externalFailures = [];

      page.on('pageerror', e => jsErrors.push(e.message));
      page.on('requestfailed', req => {
        const u = req.url();
        if (u.startsWith(base)) localFailures.push(`${req.method()} ${u} (${req.failure()?.errorText || 'failed'})`);
        else if (/\.(?:png|jpe?g|webp|gif|svg)(?:\?|$)/i.test(u)) externalFailures.push(u);
      });
      page.on('response', res => {
        if (res.status() >= 400 && res.url().startsWith(base)) localFailures.push(`${res.status()} ${res.url()}`);
      });

      const response = await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
      if (!response || !response.ok()) {
        err(`${vp.name}: ページを読み込めません (${response ? response.status() : 'no response'})`);
        await page.close();
        continue;
      }

      await page.waitForTimeout(500);

      const result = await page.evaluate(() => {
        const isVisible = el => {
          const s = getComputedStyle(el);
          const r = el.getBoundingClientRect();
          return s.display !== 'none' && s.visibility !== 'hidden' && Number(s.opacity || 1) > 0 && r.width > 1 && r.height > 1;
        };

        const viewportWidth = window.innerWidth;
        const doc = document.documentElement;
        const horizontalOverflow = Math.max(doc.scrollWidth, document.body.scrollWidth) - viewportWidth;
        const overflow = [];
        for (const el of document.querySelectorAll('body *')) {
          if (!isVisible(el)) continue;
          const r = el.getBoundingClientRect();
          const s = getComputedStyle(el);
          if (s.position === 'fixed') continue;
          if (r.width > viewportWidth + 6 || r.right > viewportWidth + 6 || r.left < -6) {
            overflow.push({
              tag: el.tagName.toLowerCase(),
              id: el.id || '',
              cls: String(el.className || '').slice(0, 80),
              left: Math.round(r.left),
              right: Math.round(r.right),
              width: Math.round(r.width),
            });
            if (overflow.length >= 8) break;
          }
        }

        const brokenImages = [...document.images]
          .filter(img => isVisible(img) && img.complete && img.naturalWidth === 0)
          .map(img => img.currentSrc || img.src || img.alt || 'unknown');

        const primaryCtas = [...document.querySelectorAll('[data-primary-cta], .ai-sticky-cta')].filter(isVisible).map(el => {
          const r = el.getBoundingClientRect();
          const s = getComputedStyle(el);
          return {
            text: (el.textContent || '').trim().slice(0, 80),
            href: el.getAttribute('href') || '',
            left: Math.round(r.left), top: Math.round(r.top), right: Math.round(r.right), bottom: Math.round(r.bottom),
            width: Math.round(r.width), height: Math.round(r.height), position: s.position,
          };
        });

        const ctaIssues = [];
        for (const cta of primaryCtas) {
          if (cta.width < 80 || cta.height < 38) ctaIssues.push(`CTAが小さすぎます: ${cta.text} (${cta.width}x${cta.height})`);
          if (cta.left < -4 || cta.right > viewportWidth + 4) ctaIssues.push(`CTAが横にはみ出しています: ${cta.text}`);
          if (!cta.href || cta.href === '#') ctaIssues.push(`CTAリンクが未設定です: ${cta.text}`);
        }

        const fixed = primaryCtas.filter(x => x.position === 'fixed');
        const overlapIssues = [];
        for (let i = 0; i < fixed.length; i++) {
          for (let j = i + 1; j < fixed.length; j++) {
            const a = fixed[i], b = fixed[j];
            const overlap = Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left)) * Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top));
            if (overlap > 400) overlapIssues.push(`固定CTA同士が重なっています: ${a.text} / ${b.text}`);
          }
        }

        const hero = document.querySelector('.hero');
        const main = document.querySelector('main');
        const visibleSections = [...document.querySelectorAll('main > section')].filter(isVisible).length;
        const h1 = document.querySelector('h1');
        const heroRect = hero?.getBoundingClientRect();
        const h1Rect = h1?.getBoundingClientRect();
        const heroTooTall = heroRect && heroRect.height > window.innerHeight * 1.35;
        const headlineTooWide = h1Rect && h1Rect.width > viewportWidth + 4;

        return {
          horizontalOverflow,
          overflow,
          brokenImages,
          primaryCtas,
          ctaIssues,
          overlapIssues,
          hasHero: !!hero,
          hasMain: !!main,
          visibleSections,
          heroTooTall,
          headlineTooWide,
          title: document.title,
          bodyTextLength: (document.body.innerText || '').trim().length,
        };
      });

      if (result.horizontalOverflow > 6) err(`${vp.name}: 横スクロール発生 +${result.horizontalOverflow}px`);
      else ok(`${vp.name}: 横スクロールなし`);

      if (result.overflow.length) err(`${vp.name}: 要素はみ出し ${result.overflow.map(x => `${x.tag}${x.id ? '#' + x.id : ''}(${x.left}..${x.right})`).join(', ')}`);
      if (result.brokenImages.length) err(`${vp.name}: 壊れた画像 ${result.brokenImages.join(', ')}`);
      if (jsErrors.length) err(`${vp.name}: JavaScriptエラー ${jsErrors.join(' / ')}`);
      if (localFailures.length) err(`${vp.name}: ローカルリソース読込失敗 ${localFailures.join(' / ')}`);
      if (externalFailures.length) warn(`${vp.name}: 外部画像の読込失敗候補 ${[...new Set(externalFailures)].slice(0, 4).join(', ')}`);
      if (!result.hasHero || !result.hasMain || result.visibleSections < 2 || result.bodyTextLength < 80) err(`${vp.name}: 主要コンテンツの描画不足`);
      else ok(`${vp.name}: 主要コンテンツ描画`);
      if (!result.primaryCtas.length) err(`${vp.name}: 表示中のCTAがありません`);
      else ok(`${vp.name}: CTA表示 ${result.primaryCtas.length}件`);
      result.ctaIssues.forEach(x => err(`${vp.name}: ${x}`));
      result.overlapIssues.forEach(x => err(`${vp.name}: ${x}`));
      if (result.heroTooTall) warn(`${vp.name}: ヒーローが画面高の135%を超えています`);
      if (result.headlineTooWide) err(`${vp.name}: H1が画面幅を超えています`);
      if (!result.title.trim()) err(`${vp.name}: document.title が空です`);

      await page.close();
    }
  } finally {
    await browser.close();
  }

  const lines = [];
  lines.push('## Browser QA');
  lines.push(`- Errors: ${errors.length}`);
  lines.push(`- Warnings: ${warnings.length}`);
  lines.push(`- Passed: ${passes.length}`);
  if (errors.length) {
    lines.push('\n### Errors');
    errors.forEach(x => lines.push(`- ❌ ${x}`));
  }
  if (warnings.length) {
    lines.push('\n### Warnings');
    warnings.forEach(x => lines.push(`- ⚠️ ${x}`));
  }
  lines.push('\n### Result');
  lines.push(errors.length ? '❌ 公開停止: ブラウザ表示の修正が必要です' : '✅ 公開可能: スマホ実描画で重大エラーなし');
  const out = lines.join('\n');
  console.log(out);
  if (process.env.GITHUB_STEP_SUMMARY) {
    try { require('fs').appendFileSync(process.env.GITHUB_STEP_SUMMARY, out + '\n'); } catch {}
  }
  process.exit(errors.length ? 1 : 0);
})().catch(e => {
  console.error(e);
  process.exit(1);
});
