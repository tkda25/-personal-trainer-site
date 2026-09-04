export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const token = process.env.GITHUB_SITE_TOKEN;
  const accessCode = process.env.FORM_ACCESS_CODE;
  const owner = process.env.GITHUB_OWNER || 'tkda25';
  const repo = process.env.GITHUB_REPO || '-personal-trainer-site';

  if (!token || !accessCode) {
    return res.status(500).json({ error: 'Server configuration is incomplete.' });
  }

  const data = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});

  if (data.website) return res.status(200).json({ ok: true });
  if (data.accessCode !== accessCode) return res.status(403).json({ error: 'アクセスコードが違います。' });

  const required = ['brand','industry','contactName','contactEmail','slug','title','headline','description','features','prices'];
  for (const key of required) {
    if (!String(data[key] || '').trim()) return res.status(400).json({ error: `必須項目が不足しています: ${key}` });
  }

  const slug = String(data.slug).trim().toLowerCase();
  if (!/^[a-z0-9-]+$/.test(slug)) return res.status(400).json({ error: '希望URL用IDは英小文字・数字・ハイフンのみ使用できます。' });

  const body = [
    '### Site slug', '', slug, '',
    '### 業種', '', String(data.industry).trim(), '',
    '### ブランド名・屋号', '', String(data.brand).trim(), '',
    '### ページタイトル', '', String(data.title).trim(), '',
    '### メインキャッチコピー', '', String(data.headline).trim(), '',
    '### メイン説明文', '', String(data.description).trim(), '',
    '### LINE URL', '', String(data.lineUrl || '').trim(), '',
    '### メールアドレス', '', String(data.publicEmail || '').trim(), '',
    '### 強み', '', String(data.features).trim(), '',
    '### 料金', '', String(data.prices).trim(), '',
    '### FAQ', '', String(data.faq || '').trim(), '',
    '### 申込者情報', '', `担当者: ${String(data.contactName).trim()}\n連絡先: ${String(data.contactEmail).trim()}`
  ].join('\n');

  const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/issues`, {
    method: 'POST',
    headers: {
      'Accept': 'application/vnd.github+json',
      'Authorization': `Bearer ${token}`,
      'X-GitHub-Api-Version': '2022-11-28',
      'Content-Type': 'application/json',
      'User-Agent': 'website-intake-bot'
    },
    body: JSON.stringify({
      title: `[NEW SITE] ${String(data.brand).trim()}`,
      body
    })
  });

  const json = await response.json().catch(() => ({}));
  if (!response.ok) {
    console.error('GitHub issue creation failed', response.status, json);
    return res.status(502).json({ error: '受付処理に失敗しました。制作担当者へご連絡ください。' });
  }

  return res.status(200).json({ ok: true, issueNumber: json.number });
}
