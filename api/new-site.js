const clean = (v) => String(v || '').trim();
const ALLOWED_DESIGNS = ['luxury', 'minimal', 'friendly', 'bold', 'photo'];
const ALLOWED_STRUCTURES = ['standard', 'conversion', 'story', 'proof'];

function chooseFallbackDesign(data) {
  const text = `${clean(data.industry)} ${clean(data.businessSummary)} ${clean(data.targetAudience)} ${clean(data.designNotes)}`.toLowerCase();
  let designPreset = 'minimal';
  let structurePreset = 'standard';
  let accentColor = '#ad9151';

  if (/高級|上質|ラグジュアリー|premium|luxury|大人/.test(text)) designPreset = 'luxury';
  else if (/写真|作品|スタイル|gallery|美容|ヘア|salon/.test(text)) designPreset = 'photo';
  else if (/親しみ|家族|地域|初心者|やさし|女性向け/.test(text)) designPreset = 'friendly';
  else if (/筋トレ|ジム|fitness|力強|結果|男性/.test(text)) designPreset = 'bold';

  if (/予約|問い合わせ|体験|集客|申込|販売/.test(text)) structurePreset = 'conversion';
  else if (/実績|口コミ|症例|before|after|信頼/.test(text)) structurePreset = 'proof';
  else if (/想い|コンセプト|ストーリー|こだわり|世界観/.test(text)) structurePreset = 'story';

  return { designPreset, structurePreset, accentColor, designReason: '入力内容からルールベースで自動選択' };
}

function fallbackCopy(data) {
  const brand = clean(data.brand);
  const industry = clean(data.industry);
  const summary = clean(data.businessSummary);
  return {
    title: clean(data.title) || `${brand}｜${industry}`,
    headline: clean(data.headline) || `${brand}で、あなたに合う選択を。`,
    description: clean(data.description) || summary,
    features: clean(data.features) || `丁寧な対応 | ${summary}`,
    faq: clean(data.faq) || '',
    ...chooseFallbackDesign(data)
  };
}

function extractOutputText(json) {
  if (typeof json?.output_text === 'string' && json.output_text.trim()) return json.output_text.trim();
  const chunks = [];
  for (const item of json?.output || []) {
    for (const part of item?.content || []) {
      if ((part?.type === 'output_text' || part?.type === 'text') && typeof part?.text === 'string') chunks.push(part.text);
    }
  }
  return chunks.join('\n').trim();
}

function parseJsonText(text) {
  const stripped = clean(text).replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '');
  try { return JSON.parse(stripped); } catch {}
  const start = stripped.indexOf('{'), end = stripped.lastIndexOf('}');
  if (start >= 0 && end > start) return JSON.parse(stripped.slice(start, end + 1));
  throw new Error('AI response was not valid JSON');
}

async function generateSitePlan(data) {
  const apiKey = process.env.OPENAI_API_KEY;
  const fallback = fallbackCopy(data);
  if (!apiKey) return { ...fallback, aiUsed: false };

  const source = {
    brand: clean(data.brand),
    industry: clean(data.industry),
    targetAudience: clean(data.targetAudience),
    primaryGoal: clean(data.primaryGoal),
    businessSummary: clean(data.businessSummary),
    prices: clean(data.prices),
    address: clean(data.address),
    hours: clean(data.hours),
    reviews: clean(data.reviews),
    results: clean(data.results),
    existingTitle: clean(data.title),
    existingHeadline: clean(data.headline),
    existingDescription: clean(data.description),
    existingFeatures: clean(data.features),
    existingFaq: clean(data.faq),
    requestedDesignPreset: clean(data.designPreset),
    requestedStructurePreset: clean(data.structurePreset),
    designNotes: clean(data.designNotes),
    colorNote: clean(data.colorNote)
  };

  const instructions = `あなたは日本語のホームページ制作におけるコピーライター兼アートディレクターです。入力された事実だけを使って、HPの文章と最適なデザイン方針を決めてください。

重要ルール:
- 口コミ、実績、受賞歴、数字、所在地、料金、効果、保証などを推測・捏造しない。
- 入力済みの文章がある場合は意図を保ちながら自然に改善する。
- headline は短く印象的に。
- description は2〜4文。
- features は必ず「タイトル | 説明」の形式で3行。
- faq は入力済みの事実で回答できるものだけを最大4件。「質問 | 回答」の形式で1行ずつ。回答できる事実がなければ空文字。
- requestedDesignPreset が auto 以外なら、その値をそのまま designPreset に使う。
- requestedStructurePreset が auto 以外なら、その値をそのまま structurePreset に使う。
- designPreset は luxury / minimal / friendly / bold / photo のいずれか。
- structurePreset は standard / conversion / story / proof のいずれか。
- accentColor は #RRGGBB の形式。ターゲット・業種・世界観に合う1色を選ぶ。
- designReason は、なぜその見た目と構成にしたかを日本語で1〜2文。
- JSON以外は出力しない。

返却JSON:
{"title":"","headline":"","description":"","features":"","faq":"","designPreset":"minimal","structurePreset":"standard","accentColor":"#ad9151","designReason":""}`;

  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || 'gpt-5.6-luna',
      reasoning: { effort: 'low' },
      input: [
        { role: 'system', content: instructions },
        { role: 'user', content: JSON.stringify(source) }
      ],
      max_output_tokens: 1400
    })
  });

  const json = await response.json().catch(() => ({}));
  if (!response.ok) {
    console.error('OpenAI site planning failed', response.status, json);
    return { ...fallback, aiUsed: false };
  }

  try {
    const parsed = parseJsonText(extractOutputText(json));
    const requestedDesign = clean(data.designPreset);
    const requestedStructure = clean(data.structurePreset);
    const aiDesign = ALLOWED_DESIGNS.includes(clean(parsed.designPreset)) ? clean(parsed.designPreset) : fallback.designPreset;
    const aiStructure = ALLOWED_STRUCTURES.includes(clean(parsed.structurePreset)) ? clean(parsed.structurePreset) : fallback.structurePreset;
    const accentColor = /^#[0-9a-fA-F]{6}$/.test(clean(parsed.accentColor)) ? clean(parsed.accentColor) : fallback.accentColor;
    return {
      title: clean(parsed.title) || fallback.title,
      headline: clean(parsed.headline) || fallback.headline,
      description: clean(parsed.description) || fallback.description,
      features: clean(parsed.features) || fallback.features,
      faq: clean(parsed.faq) || clean(data.faq),
      designPreset: requestedDesign !== 'auto' && ALLOWED_DESIGNS.includes(requestedDesign) ? requestedDesign : aiDesign,
      structurePreset: requestedStructure !== 'auto' && ALLOWED_STRUCTURES.includes(requestedStructure) ? requestedStructure : aiStructure,
      accentColor,
      designReason: clean(parsed.designReason) || fallback.designReason,
      aiUsed: true
    };
  } catch (err) {
    console.error('OpenAI response parse failed', err);
    return { ...fallback, aiUsed: false };
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const token = process.env.GITHUB_SITE_TOKEN;
  const accessCode = process.env.FORM_ACCESS_CODE;
  const owner = process.env.GITHUB_OWNER || 'tkda25';
  const repo = process.env.GITHUB_REPO || '-personal-trainer-site';
  if (!token || !accessCode) return res.status(500).json({ error: 'Server configuration is incomplete.' });

  let data;
  try {
    data = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
  } catch {
    return res.status(400).json({ error: '送信データを読み取れませんでした。' });
  }

  if (data.website) return res.status(200).json({ ok: true });
  if (data.accessCode !== accessCode) return res.status(403).json({ error: 'アクセスコードが違います。' });

  const required = ['brand', 'industry', 'contactName', 'contactEmail', 'slug', 'businessSummary', 'prices'];
  for (const k of required) if (!clean(data[k])) return res.status(400).json({ error: `必須項目が不足しています: ${k}` });

  const slug = clean(data.slug).toLowerCase();
  if (!/^[a-z0-9-]+$/.test(slug)) return res.status(400).json({ error: '希望URL用IDは英小文字・数字・ハイフンのみ使用できます。' });

  const urlFields = ['lineUrl', 'mapUrl', 'instagram', 'xUrl', 'tiktok', 'youtube', 'logoUrl'];
  for (const k of urlFields) {
    const v = clean(data[k]);
    if (v && !/^https?:\/\//i.test(v)) return res.status(400).json({ error: `${k} は http または https のURLを入力してください。` });
  }

  const generated = await generateSitePlan(data);
  data = { ...data, ...generated };

  const section = (label, value) => ['### ' + label, '', clean(value), ''];
  const hidden = ['results', 'reviews', 'about', 'access', 'faq', 'concept']
    .filter(x => data['hide' + x[0].toUpperCase() + x.slice(1)])
    .join(',');
  const requestedColor = clean(data.colorNote) ? `${clean(data.color)} ${clean(data.colorNote)}` : generated.accentColor;

  const body = [
    ...section('Site slug', slug),
    ...section('業種', data.industry),
    ...section('ブランド名・屋号', data.brand),
    ...section('想定顧客', data.targetAudience),
    ...section('HPの主目的', data.primaryGoal),
    ...section('事業・店舗の特徴', data.businessSummary),
    ...section('ページタイトル', data.title),
    ...section('メインキャッチコピー', data.headline),
    ...section('メイン説明文', data.description),
    ...section('LINE URL', data.lineUrl),
    ...section('メールアドレス', data.publicEmail),
    ...section('強み', data.features),
    ...section('料金', data.prices),
    ...section('FAQ', data.faq),
    ...section('口コミ', data.reviews),
    ...section('実績', data.results),
    ...section('住所', data.address),
    ...section('営業時間', data.hours),
    ...section('電話番号', data.phone),
    ...section('GoogleマップURL', data.mapUrl),
    ...section('Instagram', data.instagram),
    ...section('X', data.xUrl),
    ...section('TikTok', data.tiktok),
    ...section('YouTube', data.youtube),
    ...section('希望カラー', requestedColor),
    ...section('デザインタイプ', ALLOWED_DESIGNS.includes(data.designPreset) ? data.designPreset : generated.designPreset),
    ...section('ページ構成', ALLOWED_STRUCTURES.includes(data.structurePreset) ? data.structurePreset : generated.structurePreset),
    ...section('AIデザイン判断', data.designReason),
    ...section('非表示セクション', hidden),
    ...section('デザイン要望', data.designNotes),
    ...section('参考サイトURL', data.referenceUrls),
    ...section('ロゴURL', data.logoUrl),
    ...section('写真URL', data.photoUrls),
    ...section('Google Search Console確認コード', data.googleVerification),
    ...section('AI生成', generated.aiUsed ? 'OpenAI' : 'fallback'),
    ...section('その他の要望', data.notes)
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
    body: JSON.stringify({ title: `[NEW SITE] ${clean(data.brand)}`, body })
  });

  const json = await response.json().catch(() => ({}));
  if (!response.ok) {
    console.error('GitHub issue creation failed', response.status, json);
    return res.status(502).json({ error: '受付処理に失敗しました。制作担当者へご連絡ください。' });
  }

  return res.status(200).json({
    ok: true,
    issueNumber: json.number,
    aiUsed: generated.aiUsed,
    designPreset: data.designPreset,
    structurePreset: data.structurePreset,
    designReason: data.designReason
  });
}
