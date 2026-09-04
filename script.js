function initSite(){
  const c=window.SITE_CONFIG||{},one=s=>document.querySelector(s),all=s=>[...document.querySelectorAll(s)];
  const text=(s,v)=>{if(v==null)return;const e=one(s);if(e)e.textContent=v},html=(s,v)=>{if(v==null)return;const e=one(s);if(e)e.innerHTML=v};
  const esc=v=>String(v??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
  const safeMediaUrl=u=>{try{const x=new URL(u,location.href);return ['http:','https:'].includes(x.protocol)?x.href:''}catch{return''}};
  const setPhoto=(el,url,fallback)=>{if(!el)return;const u=safeMediaUrl(url);if(u){el.textContent='';el.style.backgroundImage=`url("${u.replace(/"/g,'%22')}")`;el.style.backgroundSize='cover';el.style.backgroundPosition='center';el.style.backgroundRepeat='no-repeat';el.setAttribute('role','img');el.setAttribute('aria-label',fallback||c.brand||'Photo')}else if(fallback!=null)el.textContent=fallback};
  if(c.title)document.title=c.title;if(c.description){const m=one('meta[name="description"]');if(m)m.setAttribute('content',c.description)}
  if(c.theme?.accent)document.documentElement.style.setProperty('--accent',c.theme.accent);
  const preset=c.layout?.design||'luxury';document.body.dataset.design=preset;
  const industryKey=c.industryProfile?.key||'general';document.body.dataset.industry=industryKey;
  const logo=safeMediaUrl(c.assets?.logoUrl);all('[data-brand]').forEach(e=>{if(logo){e.textContent='';const img=document.createElement('img');img.src=logo;img.alt=c.brand||'Logo';img.loading='eager';img.style.maxHeight='38px';img.style.maxWidth='180px';img.style.width='auto';img.style.display='block';e.appendChild(img)}else e.textContent=c.brand||'BRAND'});text('[data-copyright]',`© ${new Date().getFullYear()} ${c.brand||'BRAND'}`);
  const photos=(c.assets?.photoUrls||[]).map(safeMediaUrl).filter(Boolean);
  text('[data-hero-eyebrow]',c.hero?.eyebrow);html('[data-hero-headline]',c.hero?.headlineHtml);html('[data-hero-description]',c.hero?.descriptionHtml);setPhoto(one('[data-hero-photo]'),photos[0],c.hero?.photoText);
  html('[data-concept-headline]',c.concept?.headlineHtml);text('[data-concept-body]',c.concept?.body);
  text('[data-features-title]',c.features?.title);const fr=one('[data-features]');if(fr)fr.innerHTML=(c.features?.items||[]).map((x,i)=>`<article><small>${String(i+1).padStart(2,'0')}</small><h3>${esc(x.title)}</h3><p>${esc(x.body)}</p></article>`).join('');
  text('[data-services-title]',c.services?.title);const sr=one('[data-service-groups]');if(sr)sr.innerHTML=(c.services?.groups||[]).map(g=>`<div class="service-group"><h4>${esc(g.title)}</h4><div class="grid auto-grid">${(g.items||[]).map(x=>`<article class="${x.badge?'recommend':''}">${x.badge?`<i>${esc(x.badge)}</i>`:''}<h3>${esc(x.label)}</h3><strong>${esc(x.price)}</strong>${x.sub?`<p>${esc(x.sub)}</p>`:''}</article>`).join('')}</div>${g.note?`<p class="note">${esc(g.note)}</p>`:''}</div>`).join('');
  text('[data-results-title]',c.results?.title);const rr=one('[data-results]');if(rr){rr.innerHTML=(c.results?.items||[]).map(x=>`<article class="result-card"><div class="photo">${esc(x.photoText||'PHOTO')}</div><h3>${esc(x.title)}</h3><p>${esc(x.body)}</p></article>`).join('');[...rr.querySelectorAll('.photo')].forEach((el,i)=>setPhoto(el,photos[i+2],el.textContent));if(!(c.results?.items||[]).length)one('#results').style.display='none'}
  const rev=one('[data-reviews]');if(rev){rev.innerHTML=(c.reviews||[]).map(x=>`<article class="review-card"><p>“${esc(x.body)}”</p><strong>${esc(x.name)}</strong></article>`).join('');if(!(c.reviews||[]).length)one('#reviews').style.display='none'}
  html('[data-about-headline]',c.about?.headlineHtml);text('[data-about-name]',c.about?.name);text('[data-about-body]',c.about?.body);setPhoto(one('[data-about-photo]'),photos[1],c.about?.photoText);
  const info=one('[data-business-info]');if(info){const rows=[['住所',c.business?.address],['営業時間',c.business?.hours],['電話番号',c.business?.phone]].filter(([,v])=>v);info.innerHTML=rows.map(([k,v])=>`<div class="info-row"><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join('');if(!rows.length&&!c.business?.mapUrl&&!Object.values(c.social||{}).some(Boolean))one('#access').style.display='none'}
  const socials=one('[data-social-links]');if(socials)socials.innerHTML=Object.entries({Instagram:c.social?.instagram,X:c.social?.x,TikTok:c.social?.tiktok,YouTube:c.social?.youtube}).filter(([,u])=>safeMediaUrl(u)).map(([n,u])=>`<a href="${esc(safeMediaUrl(u))}" target="_blank" rel="noopener">${esc(n)}</a>`).join('');
  const map=one('[data-map-card]');const mapUrl=safeMediaUrl(c.business?.mapUrl);if(map&&mapUrl)map.innerHTML=`<a class="gold" href="${esc(mapUrl)}" target="_blank" rel="noopener">Googleマップを開く</a>`;
  const fq=one('[data-faq]');if(fq)fq.innerHTML=(c.faq||[]).map(x=>`<details><summary>${esc(x.q)}</summary><p>${esc(x.a)}</p></details>`).join('');
  html('[data-contact-headline]',c.contact?.headlineHtml);text('[data-contact-description]',c.contact?.description);all('[data-primary-cta]').forEach(a=>{if(c.contact?.primaryLabel)a.textContent=c.contact.primaryLabel;const u=c.contact?.primaryUrl||'';if(u.startsWith('#')||safeMediaUrl(u))a.href=u});const em=one('[data-email-link]');if(em){if(c.contact?.email)em.href=`mailto:${encodeURIComponent(c.contact.email)}`;else em.style.display='none'}

  const labels=c.industryProfile?.labels||{};
  if(labels.reviews)text('#reviews h2',labels.reviews);
  if(labels.access)text('#access h2',labels.access);
  if(labels.faq)text('#faq h2',labels.faq);
  const navLabels=c.industryProfile?.nav||{};all('nav a[href^="#"]').forEach(a=>{const id=a.getAttribute('href').slice(1);if(navLabels[id])a.textContent=navLabels[id]});

  const hidden=new Set(c.layout?.hidden||[]);
  const resultItems=c.results?.items||[],about=c.about||{};
  const industryMeta={
    hair:{eyebrow:'STYLE / SALON',title:'スタイルとサロン',galleryTitle:'STYLE GALLERY',profileTitle:'SALON / STAFF',profileHeading:'あなたらしさを引き出すサロンづくり'},
    gym:{eyebrow:'RESULT / TRAINER',title:'結果とトレーナー',galleryTitle:'BEFORE & AFTER',profileTitle:'TRAINER',profileHeading:'目標まで伴走するトレーナー'},
    restaurant:{eyebrow:'FOOD / DINING',title:'料理と空間',galleryTitle:'FOOD GALLERY',profileTitle:'DINING',profileHeading:'料理を楽しむための空間'}
  };
  const meta=industryMeta[industryKey];
  if(meta&&(!hidden.has('results')||!hidden.has('about'))){
    const section=document.createElement('section');section.id='industry-special';section.className='industry-special';
    const gallery=!hidden.has('results')&&resultItems.length?`<div class="industry-block"><small>${meta.galleryTitle}</small><div class="industry-gallery">${resultItems.map((x,i)=>`<article class="industry-tile"><div class="photo" data-industry-photo="${i}">${esc(x.photoText||'PHOTO')}</div><div class="industry-tile-copy"><h3>${esc(x.title)}</h3><p>${esc(x.body)}</p></div></article>`).join('')}</div></div>`:'';
    const profile=!hidden.has('about')?`<div class="industry-profile"><div class="industry-profile-copy"><small>${meta.profileTitle}</small><h2>${esc(meta.profileHeading)}</h2><h3>${esc(about.name||c.brand)}</h3><p>${esc(about.body||c.description)}</p></div><div class="photo industry-profile-photo" data-industry-profile-photo>${esc(about.photoText||'PHOTO')}</div></div>`:'';
    section.innerHTML=`<div class="industry-heading"><small>${meta.eyebrow}</small><h2>${esc(meta.title)}</h2></div>${gallery}${profile}`;
    const main=one('main');if(main)main.appendChild(section);
    all('[data-industry-photo]').forEach((el,i)=>setPhoto(el,photos[i+2],el.textContent));setPhoto(one('[data-industry-profile-photo]'),photos[1],about.photoText);
    const genericResults=one('#results'),genericAbout=one('#about');if(genericResults)genericResults.style.display='none';if(genericAbout)genericAbout.style.display='none';
  }

  hidden.forEach(id=>{const e=one('#'+id);if(e)e.style.display='none'});
  const orders={standard:['concept','features','services','results','reviews','about','access','faq','contact'],conversion:['features','services','results','reviews','faq','about','access','concept','contact'],story:['concept','about','features','results','reviews','services','access','faq','contact'],proof:['results','reviews','features','services','about','access','faq','concept','contact']};
  const industryOrders={hair:['industry-special','reviews','features','services','access','faq','concept','contact'],gym:['industry-special','features','services','reviews','faq','access','concept','contact'],restaurant:['industry-special','services','reviews','concept','access','faq','features','contact']};
  const main=one('main'),hero=one('.hero');if(main&&hero){const requested=c.layout?.structure||'standard';const order=requested==='standard'&&industryOrders[industryKey]?industryOrders[industryKey]:(orders[requested]||orders.standard);if(meta&&!order.includes('industry-special'))order.splice(Math.min(2,order.length),0,'industry-special');order.forEach(id=>{const s=one('#'+id);if(s)main.appendChild(s)});main.insertBefore(hero,main.firstChild)}
  all('a[href^="#"]').forEach(a=>a.addEventListener('click',e=>{const t=one(a.getAttribute('href'));if(!t)return;e.preventDefault();t.scrollIntoView({behavior:'smooth'})}));
}
const configScript=document.createElement('script');configScript.src='site.config.js';configScript.onload=initSite;configScript.onerror=initSite;document.head.appendChild(configScript);
