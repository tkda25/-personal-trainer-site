const $ = id => document.getElementById(id);
const lines = value => value.split('\n').map(v => v.trim()).filter(Boolean);
const splitRow = row => row.split('｜').map(v => v.trim());

function escapeHtmlBreaks(value='') {
  return value.replace(/\n/g, '<br>');
}

function makeConfig() {
  const features = lines($('features').value).map((row, i) => {
    const [title='', body=''] = splitRow(row);
    return { no: String(i + 1).padStart(2, '0'), title, body };
  });
  const prices = lines($('prices').value).map(row => {
    const [label='', price='', sub=''] = splitRow(row);
    return { label, price, sub };
  });
  const faqs = lines($('faqs').value).map(row => {
    const [q='', a=''] = splitRow(row);
    return { q, a };
  });

  const config = {
    industry: $('industry').value,
    brand: $('brand').value || 'BRAND',
    title: $('title').value || $('brand').value || 'WEBSITE',
    hero: {
      eyebrow: $('eyebrow').value || $('industry').value.toUpperCase(),
      headlineHtml: escapeHtmlBreaks($('headline').value || 'あなたの魅力を、もっと伝わる形に。'),
      descriptionHtml: escapeHtmlBreaks($('description').value || '')
    },
    contact: {
      primaryLabel: $('ctaLabel').value || '問い合わせる',
      lineUrl: $('lineUrl').value || '#contact',
      email: $('email').value || ''
    },
    concept: {
      headlineHtml: escapeHtmlBreaks($('conceptHeadline').value || ''),
      body: $('conceptBody').value || ''
    },
    features,
    prices,
    faqs
  };

  return `window.SITE_CONFIG = ${JSON.stringify(config, null, 2)};\n`;
}

$('generate').addEventListener('click', () => {
  $('output').textContent = makeConfig();
});

$('copy').addEventListener('click', async () => {
  const text = $('output').textContent.includes('ここに') ? makeConfig() : $('output').textContent;
  $('output').textContent = text;
  try {
    await navigator.clipboard.writeText(text);
    $('copy').textContent = 'コピーしました';
    setTimeout(() => $('copy').textContent = 'コピー', 1400);
  } catch {
    alert('コピーできませんでした。生成結果を長押ししてコピーしてください。');
  }
});

$('download').addEventListener('click', () => {
  const text = $('output').textContent.includes('ここに') ? makeConfig() : $('output').textContent;
  $('output').textContent = text;
  const blob = new Blob([text], { type: 'text/javascript;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'site.config.js';
  a.click();
  URL.revokeObjectURL(url);
});
