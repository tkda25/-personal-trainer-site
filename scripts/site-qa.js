#!/usr/bin/env node
const fs=require('fs');
const path=require('path');
const {execFileSync,spawn}=require('child_process');

const target=process.argv[2];
if(!target){console.error('Usage: node scripts/site-qa.js sites/<slug>');process.exit(2)}
const root=path.resolve(target);
const slug=path.basename(root);
const errors=[];const warnings=[];const passes=[];
const err=(m)=>errors.push(m),warn=(m)=>warnings.push(m),ok=(m)=>passes.push(m);
const exists=(f)=>fs.existsSync(path.join(root,f));
const read=(f)=>exists(f)?fs.readFileSync(path.join(root,f),'utf8'):'';

for(const f of ['index.html','style.css','script.js','site.config.js','sitemap.xml','robots.txt']){
  if(!exists(f))err(`必須ファイル不足: ${f}`);else ok(`必須ファイル: ${f}`);
}
if(errors.length){finish();}

const html=read('index.html');
const css=read('style.css')+'\n'+(fs.existsSync(path.resolve('visual-v4.css'))?fs.readFileSync(path.resolve('visual-v4.css'),'utf8'):'')+'\n'+(fs.existsSync(path.resolve('first-impression-v7.css'))?fs.readFileSync(path.resolve('first-impression-v7.css'),'utf8'):'');
const js=read('script.js');
let config={};
try{
  const raw=read('site.config.js').replace(/^\s*window\.SITE_CONFIG\s*=\s*/,'').replace(/;\s*$/,'');
  config=JSON.parse(raw);
  ok('site.config.js を解析');
}catch(e){err(`site.config.js の解析失敗: ${e.message}`)}

const has=(re)=>re.test(html);
if(!has(/<meta[^>]+name=["']viewport["'][^>]+content=["'][^"']*width=device-width/i))err('viewport meta がありません');else ok('viewport meta');
if(!has(/<title>[^<\s][\s\S]*?<\/title>/i))err('title が空です');else ok('title');
if(!has(/<meta[^>]+name=["']description["'][^>]+content=["'][^"']+["']/i))err('meta description が空です');else ok('meta description');
if(!has(/<link[^>]+rel=["']canonical["'][^>]+href=["']https?:\/\//i))err('canonical URL がありません');else ok('canonical');
for(const p of ['og:title','og:description','og:url']){
  const re=new RegExp(`<meta[^>]+property=["']${p.replace(':','\\:')}["'][^>]+content=["'][^"']+["']`,'i');
  if(!re.test(html))err(`${p} がありません`);else ok(p);
}
if(!/application\/ld\+json/i.test(html))warn('JSON-LD がありません');else ok('JSON-LD');

for(const k of ['brand','title','description']){
  if(!String(config[k]||'').trim())err(`設定値が空です: ${k}`);else ok(`設定値: ${k}`);
}

const ids=[...html.matchAll(/\bid=["']([^"']+)["']/gi)].map(m=>m[1]);
const dup=[...new Set(ids.filter((x,i)=>ids.indexOf(x)!==i))];
if(dup.length)err(`重複ID: ${dup.join(', ')}`);else ok('重複IDなし');
const idSet=new Set(ids);

const hrefs=[...html.matchAll(/\bhref=["']([^"']*)["']/gi)].map(m=>m[1]);
for(const h of hrefs){
  if(!h)err('空の href があります');
  else if(h.startsWith('#')&&h.length>1&&!idSet.has(h.slice(1)))err(`リンク先IDが存在しません: ${h}`);
}

const primary=String(config.contact?.primaryUrl||'').trim();
if(!String(config.contact?.primaryLabel||'').trim())err('CTAラベルが空です');
if(!primary)err('CTAリンクが空です');
else if(primary.startsWith('#')&&!idSet.has(primary.slice(1)))err(`CTAリンク先が存在しません: ${primary}`);
else if(!primary.startsWith('#')&&!validUrl(primary))err(`CTA URL形式が不正です: ${primary}`);
else ok('CTAリンク');

const localRefs=[];
for(const m of html.matchAll(/\b(?:src|href)=["']([^"']+)["']/gi)){
  const u=m[1];
  if(/^(?:https?:|mailto:|tel:|#|data:|javascript:)/i.test(u))continue;
  const clean=u.split('?')[0].split('#')[0];
  if(clean)localRefs.push(clean);
}
for(const u of [...new Set(localRefs)]){
  if(!fs.existsSync(path.resolve(root,u)))err(`ローカル参照切れ: ${u}`);
}
if(!localRefs.length||!errors.some(x=>x.startsWith('ローカル参照切れ')))ok('ローカル参照');

const media=[];
if(config.assets?.logoUrl)media.push(['logo',config.assets.logoUrl]);
for(const [i,u] of (config.assets?.photoUrls||[]).entries())if(u)media.push([`photo ${i+1}`,u]);
if(config.business?.mapUrl)media.push(['map',config.business.mapUrl]);
for(const [k,u] of Object.entries(config.social||{}))if(u)media.push([k,u]);
for(const [label,u] of media){if(!validUrl(u))err(`URL形式が不正 (${label}): ${u}`)}
if(media.length)ok('画像/SNS/地図URL形式');

const visibleSections=['concept','features','services','results','reviews','about','access','faq'];
const hidden=new Set(config.layout?.hidden||[]);
for(const id of visibleSections){
  if(hidden.has(id))continue;
  if(!idSet.has(id))warn(`セクション #${id} がHTMLにありません`);
}

const featureCount=config.features?.items?.length||0;
const serviceCount=(config.services?.groups||[]).reduce((n,g)=>n+(g.items?.length||0),0);
if(featureCount===0)warn('強みが0件です');
if(serviceCount===0)warn('料金・サービスが0件です');
if((config.reviews||[]).length===0&&!hidden.has('reviews'))warn('口コミが0件です（表示時は自動非表示を確認）');
if((config.results?.items||[]).length===0&&!hidden.has('results'))warn('実績が0件です（表示時は自動非表示を確認）');

if(!/@media\s*\([^)]*max-width\s*:/i.test(css))err('モバイル用media queryがありません');else ok('モバイルmedia query');
if(!/width=device-width/i.test(html))err('スマホviewport設定がありません');
const fixedWidths=[...css.matchAll(/\bwidth\s*:\s*(\d{3,})px/gi)].map(m=>Number(m[1])).filter(n=>n>760);
if(fixedWidths.length)warn(`スマホ横はみ出し候補: 固定幅 ${[...new Set(fixedWidths)].join(', ')}px`);
if(/position\s*:\s*fixed/i.test(css)&&!/safe-area-inset-bottom/i.test(css))warn('固定CTAがありますがSafe Area対応が見つかりません');
if(/ai-sticky-cta/.test(js)&&!/safe-area-inset-bottom/i.test(css))warn('sticky CTAのSafe Area対応を確認してください');

if(/safeMediaUrl\s*=/.test(js)&&/if\(!raw\)return''/.test(js))ok('空URLガード');
else warn('空URLガードを確認できません');

if(html.includes('>BRAND<'))warn('BRANDプレースホルダはJS置換前提です');

writeStaticSummary();
if(errors.length)process.exit(1);
runBrowserQa();

function validUrl(v){
  try{const u=new URL(String(v));return ['http:','https:'].includes(u.protocol)}catch{return false}
}
function writeStaticSummary(){
  const lines=[];
  lines.push('## Pre-publish QA');
  lines.push(`- Errors: ${errors.length}`);
  lines.push(`- Warnings: ${warnings.length}`);
  lines.push(`- Passed: ${passes.length}`);
  if(errors.length){lines.push('\n### Errors');errors.forEach(x=>lines.push(`- ❌ ${x}`));}
  if(warnings.length){lines.push('\n### Warnings');warnings.forEach(x=>lines.push(`- ⚠️ ${x}`));}
  lines.push('\n### Result');
  lines.push(errors.length?'❌ 公開停止: 修正が必要です':'✅ 静的QA通過: ブラウザQAへ進みます');
  const out=lines.join('\n');
  console.log(out);
  if(process.env.GITHUB_STEP_SUMMARY){try{fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY,out+'\n')}catch{}}
}
function finish(){
  writeStaticSummary();
  process.exit(errors.length?1:0);
}
function runBrowserQa(){
  console.log('\nInstalling browser QA runtime...');
  execFileSync('npm',['install','--no-save','--package-lock=false','playwright@1.55.0'],{stdio:'inherit'});
  execFileSync('npx',['playwright','install','--with-deps','chromium'],{stdio:'inherit'});
  const server=spawn('python3',['-m','http.server','4173','--bind','127.0.0.1'],{cwd:path.resolve('.'),stdio:'ignore'});
  const stop=()=>{try{server.kill('SIGTERM')}catch{}};
  process.on('exit',stop);process.on('SIGINT',()=>{stop();process.exit(130)});process.on('SIGTERM',()=>{stop();process.exit(143)});
  try{
    const waitUntil=Date.now()+10000;
    while(Date.now()<waitUntil){
      try{execFileSync('curl',['-fsS','http://127.0.0.1:4173/'],{stdio:'ignore'});break}catch{Atomics.wait(new Int32Array(new SharedArrayBuffer(4)),0,0,200)}
    }
    execFileSync(process.execPath,['scripts/browser-qa.js',slug],{stdio:'inherit',env:{...process.env,BROWSER_QA_BASE:'http://127.0.0.1:4173'}});
  }finally{stop()}
}
