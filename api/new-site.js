const clean = (v) => String(v || '').trim();
const ALLOWED_DESIGNS = ['luxury', 'minimal', 'friendly', 'bold', 'photo'];
const ALLOWED_STRUCTURES = ['standard', 'conversion', 'story', 'proof'];
const ALLOWED_DENSITY = ['compact', 'balanced', 'airy'];
const ALLOWED_HERO = ['split', 'centered', 'overlay', 'editorial'];
const ALLOWED_IMAGES = ['low', 'medium', 'high'];
const ALLOWED_CTA = ['hero', 'after-services', 'sticky-mobile', 'footer'];
const ALLOWED_SECTIONS = ['concept','features','services','results','reviews','about','access','faq','contact'];

function chooseFallbackDesign(data) {
  const text = `${clean(data.industry)} ${clean(data.businessSummary)} ${clean(data.targetAudience)} ${clean(data.primaryGoal)} ${clean(data.designNotes)}`.toLowerCase();
  let designPreset = 'minimal', structurePreset = 'standard', accentColor = '#ad9151';
  if (/高級|上質|ラグジュアリー|premium|luxury|大人/.test(text)) designPreset = 'luxury';
  else if (/写真|作品|スタイル|gallery|美容|ヘア|salon/.test(text)) designPreset = 'photo';
  else if (/親しみ|家族|地域|初心者|やさし|女性向け/.test(text)) designPreset = 'friendly';
  else if (/筋トレ|ジム|fitness|力強|結果|男性/.test(text)) designPreset = 'bold';
  if (/予約|問い合わせ|体験|集客|申込|販売/.test(text)) structurePreset = 'conversion';
  else if (/実績|口コミ|症例|before|after|信頼/.test(text)) structurePreset = 'proof';
  else if (/想い|コンセプト|ストーリー|こだわり|世界観/.test(text)) structurePreset = 'story';
  const density = designPreset === 'luxury' ? 'airy' : designPreset === 'bold' ? 'compact' : 'balanced';
  const heroStyle = designPreset === 'photo' ? 'overlay' : designPreset === 'minimal' ? 'centered' : 'split';
  const imageEmphasis = /写真|美容|ヘア|飲食|料理|作品|gallery/.test(text) ? 'high' : 'medium';
  const ctaPlacement = structurePreset === 'conversion' ? 'after-services' : 'footer';
  const sectionOrder = structurePreset === 'conversion'
    ? ['features','services','results','reviews','faq','about','access','concept','contact']
    : structurePreset === 'proof'
      ? ['results','reviews','features','services','about','access','faq','concept','contact']
      : structurePreset === 'story'
        ? ['concept','about','features','results','reviews','services','access','faq','contact']
        : ['concept','features','services','results','reviews','about','access','faq','contact'];
  return { designPreset, structurePreset, accentColor, designReason: '入力内容からルールベースで自動選択', density, heroStyle, imageEmphasis, ctaPlacement, sectionOrder };
}

function fallbackCopy(data) {
  const brand = clean(data.brand), industry = clean(data.industry), summary = clean(data.businessSummary);
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
  for (const item of json?.output || []) for (const part of item?.content || []) if ((part?.type === 'output_text' || part?.type === 'text') && typeof part?.text === 'string') chunks.push(part.text);
  return chunks.join('\n').trim();
}

function parseJsonText(text) {
  const stripped = clean(text).replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '');
  try { return JSON.parse(stripped); } catch {}
  const start = stripped.indexOf('{'), end = stripped.lastIndexOf('}');
  if (start >= 0 && end > start) return JSON.parse(stripped.slice(start, end + 1));
  throw new Error('AI response was not valid JSON');
}

function cleanSectionOrder(value, fallback) {
  const arr = Array.isArray(value) ? value : [];
  const safe = arr.map(clean).filter((x,i,a) => ALLOWED_SECTIONS.includes(x) && a.indexOf(x) === i);
  for (const s of fallback) if (!safe.includes(s)) safe.push(s);
  return safe;
}

async function generateSitePlan(data) {
  const apiKey = process.env.OPENAI_API_KEY, fallback = fallbackCopy(data);
  if (!apiKey) return { ...fallback, aiUsed: false };
  const source = {
    brand: clean(data.brand), industry: clean(data.industry), targetAudience: clean(data.targetAudience), primaryGoal: clean(data.primaryGoal),
    businessSummary: clean(data.businessSummary), prices: clean(data.prices), address: clean(data.address), hours: clean(data.hours),
    reviews: clean(data.reviews), results: clean(data.results), existingTitle: clean(data.title), existingHeadline: clean(data.headline),
    existingDescription: clean(data.description), existingFeatures: clean(data.features), existingFaq: clean(data.faq),
    requestedDesignPreset: clean(data.designPreset), requestedStructurePreset: clean(data.structurePreset), designNotes: clean(data.designNotes), colorNote: clean(data.colorNote),
    hasPhotos: Boolean(clean(data.photoUrls)), hasReviews: Boolean(clean(data.reviews)), hasResults: Boolean(clean(data.results))
  };
  const instructions = `あなたは日本語のホームページ制作におけるコピーライター兼アートディレクターです。入力された事実だけを使い、文章・デザイン・ページ内レイアウトまで決めてください。

ルール:
- 口コミ、実績、数字、効果、保証などを捏造しない。
- requestedDesignPreset / requestedStructurePreset が auto 以外ならその指定を尊重する。
- designPreset: luxury|minimal|friendly|bold|photo
- structurePreset: standard|conversion|story|proof
- density: compact|balanced|airy
- heroStyle: split|centered|overlay|editorial
- imageEmphasis: low|medium|high
- ctaPlacement: hero|after-services|sticky-mobile|footer
- sectionOrder は concept,features,services,results,reviews,about,access,faq,contact だけを使い、優先順で全項目を1回ずつ並べる。
- 写真がないのに imageEmphasis=high を選ばない。
- 実績や口コミが空なら、それらを上位に置かない。
- 予約/問い合わせが主目的なら services と CTA を早める。
- 世界観重視なら concept/about を早める。
- JSON以外は出力しない。

返却JSON:
{"title":"","headline":"","description":"","features":"","faq":"","designPreset":"minimal","structurePreset":"standard","accentColor":"#ad9151","designReason":"","density":"balanced","heroStyle":"split","imageEmphasis":"medium","ctaPlacement":"footer","sectionOrder":["concept","features","services","results","reviews","about","access","faq","contact"]}`;
  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST', headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: process.env.OPENAI_MODEL || 'gpt-5.6-luna', reasoning: { effort: 'low' }, input: [{ role: 'system', content: instructions }, { role: 'user', content: JSON.stringify(source) }], max_output_tokens: 1800 })
  });
  const json = await response.json().catch(() => ({}));
  if (!response.ok) { console.error('OpenAI site planning failed', response.status, json); return { ...fallback, aiUsed: false }; }
  try {
    const parsed = parseJsonText(extractOutputText(json));
    const requestedDesign = clean(data.designPreset), requestedStructure = clean(data.structurePreset);
    return {
      title: clean(parsed.title) || fallback.title,
      headline: clean(parsed.headline) || fallback.headline,
      description: clean(parsed.description) || fallback.description,
      features: clean(parsed.features) || fallback.features,
      faq: clean(parsed.faq) || clean(data.faq),
      designPreset: requestedDesign !== 'auto' && ALLOWED_DESIGNS.includes(requestedDesign) ? requestedDesign : (ALLOWED_DESIGNS.includes(clean(parsed.designPreset)) ? clean(parsed.designPreset) : fallback.designPreset),
      structurePreset: requestedStructure !== 'auto' && ALLOWED_STRUCTURES.includes(requestedStructure) ? requestedStructure : (ALLOWED_STRUCTURES.includes(clean(parsed.structurePreset)) ? clean(parsed.structurePreset) : fallback.structurePreset),
      accentColor: /^#[0-9a-fA-F]{6}$/.test(clean(parsed.accentColor)) ? clean(parsed.accentColor) : fallback.accentColor,
      designReason: clean(parsed.designReason) || fallback.designReason,
      density: ALLOWED_DENSITY.includes(clean(parsed.density)) ? clean(parsed.density) : fallback.density,
      heroStyle: ALLOWED_HERO.includes(clean(parsed.heroStyle)) ? clean(parsed.heroStyle) : fallback.heroStyle,
      imageEmphasis: ALLOWED_IMAGES.includes(clean(parsed.imageEmphasis)) ? clean(parsed.imageEmphasis) : fallback.imageEmphasis,
      ctaPlacement: ALLOWED_CTA.includes(clean(parsed.ctaPlacement)) ? clean(parsed.ctaPlacement) : fallback.ctaPlacement,
      sectionOrder: cleanSectionOrder(parsed.sectionOrder, fallback.sectionOrder),
      aiUsed: true
    };
  } catch (err) { console.error('OpenAI response parse failed', err); return { ...fallback, aiUsed: false }; }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); return res.status(405).json({ error: 'Method not allowed' }); }
  const token = process.env.GITHUB_SITE_TOKEN, accessCode = process.env.FORM_ACCESS_CODE, owner = process.env.GITHUB_OWNER || 'tkda25', repo = process.env.GITHUB_REPO || '-personal-trainer-site';
  if (!token || !accessCode) return res.status(500).json({ error: 'Server configuration is incomplete.' });
  let data; try { data = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {}); } catch { return res.status(400).json({ error: '送信データを読み取れませんでした。' }); }
  if (data.website) return res.status(200).json({ ok: true });
  if (data.accessCode !== accessCode) return res.status(403).json({ error: 'アクセスコードが違います。' });
  for (const k of ['brand','industry','contactName','contactEmail','slug','businessSummary','prices']) if (!clean(data[k])) return res.status(400).json({ error: `必須項目が不足しています: ${k}` });
  const slug = clean(data.slug).toLowerCase();
  if (!/^[a-z0-9-]+$/.test(slug)) return res.status(400).json({ error: '希望URL用IDは英小文字・数字・ハイフンのみ使用できます。' });
  for (const k of ['lineUrl','mapUrl','instagram','xUrl','tiktok','youtube','logoUrl']) { const v = clean(data[k]); if (v && !/^https?:\/\//i.test(v)) return res.status(400).json({ error: `${k} は http または https のURLを入力してください。` }); }

  const generated = await generateSitePlan(data); data = { ...data, ...generated };
  const section = (label, value) => ['### ' + label, '', clean(value), ''];
  const hidden = ['results','reviews','about','access','faq','concept'].filter(x => data['hide' + x[0].toUpperCase() + x.slice(1)]).join(',');
  const requestedColor = clean(data.colorNote) ? `${clean(data.color)} ${clean(data.colorNote)}` : generated.accentColor;
  const layoutPayload = JSON.stringify({ density:data.density, heroStyle:data.heroStyle, imageEmphasis:data.imageEmphasis, ctaPlacement:data.ctaPlacement, sectionOrder:data.sectionOrder });
  const designNotesWithAI = `${clean(data.designNotes)}\n[[AI_LAYOUT:${layoutPayload}]]`.trim();

  const body = [
    ...section('Site slug',slug),...section('業種',data.industry),...section('ブランド名・屋号',data.brand),...section('想定顧客',data.targetAudience),...section('HPの主目的',data.primaryGoal),...section('事業・店舗の特徴',data.businessSummary),...section('ページタイトル',data.title),...section('メインキャッチコピー',data.headline),...section('メイン説明文',data.description),...section('LINE URL',data.lineUrl),...section('メールアドレス',data.publicEmail),...section('強み',data.features),...section('料金',data.prices),...section('FAQ',data.faq),...section('口コミ',data.reviews),...section('実績',data.results),...section('住所',data.address),...section('営業時間',data.hours),...section('電話番号',data.phone),...section('GoogleマップURL',data.mapUrl),...section('Instagram',data.instagram),...section('X',data.xUrl),...section('TikTok',data.tiktok),...section('YouTube',data.youtube),...section('希望カラー',requestedColor),...section('デザインタイプ',ALLOWED_DESIGNS.includes(data.designPreset)?data.designPreset:generated.designPreset),...section('ページ構成',ALLOWED_STRUCTURES.includes(data.structurePreset)?data.structurePreset:generated.structurePreset),...section('AIデザイン判断',data.designReason),...section('非表示セクション',hidden),...section('デザイン要望',designNotesWithAI),...section('参考サイトURL',data.referenceUrls),...section('ロゴURL',data.logoUrl),...section('写真URL',data.photoUrls),...section('Google Search Console確認コード',data.googleVerification),...section('AI生成',generated.aiUsed?'OpenAI':'fallback'),...section('その他の要望',data.notes)
  ].join('\n');
  const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/issues`, { method:'POST', headers:{'Accept':'application/vnd.github+json','Authorization':`Bearer ${token}`,'X-GitHub-Api-Version':'2022-11-28','Content-Type':'application/json','User-Agent':'website-intake-bot'}, body:JSON.stringify({title:`[NEW SITE] ${clean(data.brand)}`,body}) });
  const json = await response.json().catch(() => ({}));
  if (!response.ok) { console.error('GitHub issue creation failed',response.status,json); return res.status(502).json({error:'受付処理に失敗しました。制作担当者へご連絡ください。'}); }
  return res.status(200).json({ ok:true, issueNumber:json.number, aiUsed:generated.aiUsed, designPreset:data.designPreset, structurePreset:data.structurePreset, designReason:data.designReason, layout:{density:data.density,heroStyle:data.heroStyle,imageEmphasis:data.imageEmphasis,ctaPlacement:data.ctaPlacement,sectionOrder:data.sectionOrder} });
}
