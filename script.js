function initSite(){
  const c=window.SITE_CONFIG||{},one=s=>document.querySelector(s),all=s=>[...document.querySelectorAll(s)];
  const text=(s,v)=>{if(v==null)return;const e=one(s);if(e)e.textContent=v},html=(s,v)=>{if(v==null)return;const e=one(s);if(e)e.innerHTML=v};
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
  text('[data-features-title]',c.features?.title);const fr=one('[data-features]');if(fr)fr.innerHTML=(c.features?.items||[]).map((x,i)=>`<article><small>${String(i+1).padStart(2,'0')}</small><h3>${x.title||''}</h3><p>${x.body||''}</p></article>`).join('');
  text('[data-services-title]',c.services?.title);const sr=one('[data-service-groups]');if(sr)sr.innerHTML=(c.services?.groups||[]).map(g=>`<div class="service-group"><h4>${g.title||''}</h4><div class="grid auto-grid">${(g.items||[]).map(x=>`<article class="${x.badge?'recommend':''}">${x.badge?`<i>${x.badge}</i>`:''}<h3>${x.label||''}</h3><strong>${x.price||''}</strong>${x.sub?`<p>${x.sub}</p>`:''}</article>`).join('')}</div>${g.note?`<p class="note">${g.note}</p>`:''}</div>`).join('');
  text('[data-results-title]',c.results?.title);const rr=one('[data-results]');if(rr){rr.innerHTML=(c.results?.items||[]).map(x=>`<article class="result-card"><div class="photo">${x.photoText||'PHOTO'}</div><h3>${x.title||''}</h3><p>${x.body||''}</p></article>`).join('');[...rr.querySelectorAll('.photo')].forEach((el,i)=>setPhoto(el,photos[i+2],el.textContent));if(!(c.results?.items||[]).length)one('#results').style.display='none'}
  const rev=one('[data-reviews]');if(rev){rev.innerHTML=(c.reviews||[]).map(x=>`<article class="review-card"><p>“${x.body||''}”</p><strong>${x.name||''}</strong></article>`).join('');if(!(c.reviews||[]).length)one('#reviews').style.display='none'}
  html('[data-about-headline]',c.about?.headlineHtml);text('[data-about-name]',c.about?.name);text('[data-about-body]',c.about?.body);setPhoto(one('[data-about-photo]'),photos[1],c.about?.photoText);
  const info=one('[data-business-info]');if(info){const rows=[['住所',c.business?.address],['営業時間',c.business?.hours],['電話番号',c.business?.phone]].filter(([,v])=>v);info.innerHTML=rows.map(([k,v])=>`<div class="info-row"><dt>${k}</dt><dd>${v}</dd></div>`).join('');if(!rows.length&&!c.business?.mapUrl&&!Object.values(c.social||{}).some(Boolean))one('#access').style.display='none'}
  const socials=one('[data-social-links]');if(socials)socials.innerHTML=Object.entries({Instagram:c.social?.instagram,X:c.social?.x,TikTok:c.social?.tiktok,YouTube:c.social?.youtube}).filter(([,u])=>u).map(([n,u])=>`<a href="${u}" target="_blank" rel="noopener">${n}</a>`).join('');
  const map=one('[data-map-card]');if(map&&c.business?.mapUrl)map.innerHTML=`<a class="gold" href="${c.business.mapUrl}" target="_blank" rel="noopener">Googleマップを開く</a>`;
  const fq=one('[data-faq]');if(fq)fq.innerHTML=(c.faq||[]).map(x=>`<details><summary>${x.q||''}</summary><p>${x.a||''}</p></details>`).join('');
  html('[data-contact-headline]',c.contact?.headlineHtml);text('[data-contact-description]',c.contact?.description);all('[data-primary-cta]').forEach(a=>{if(c.contact?.primaryLabel)a.textContent=c.contact.primaryLabel;if(c.contact?.primaryUrl)a.href=c.contact.primaryUrl});const em=one('[data-email-link]');if(em){if(c.contact?.email)em.href=`mailto:${c.contact.email}`;else em.style.display='none'}

  const labels=c.industryProfile?.labels||{};
  if(labels.reviews)text('#reviews h2',labels.reviews);
  if(labels.access)text('#access h2',labels.access);
  if(labels.faq)text('#faq h2',labels.faq);
  const navLabels=c.industryProfile?.nav||{};all('nav a[href^="#"]').forEach(a=>{const id=a.getAttribute('href').slice(1);if(navLabels[id])a.textContent=navLabels[id]});

  const hidden=new Set(c.layout?.hidden||[]);hidden.forEach(id=>{const e=one('#'+id);if(e)e.style.display='none'});
  const orders={standard:['concept','features','services','results','reviews','about','access','faq','contact'],conversion:['features','services','results','reviews','faq','about','access','concept','contact'],story:['concept','about','features','results','reviews','services','access','faq','contact'],proof:['results','reviews','features','services','about','access','faq','concept','contact']};
  const industryOrders={hair:['results','reviews','features','services','about','access','faq','concept','contact'],gym:['results','features','about','services','reviews','faq','access','concept','contact'],restaurant:['results','services','reviews','concept','about','access','faq','features','contact']};
  const main=one('main'),hero=one('.hero');if(main&&hero){const requested=c.layout?.structure||'standard';const order=requested==='standard'&&industryOrders[industryKey]?industryOrders[industryKey]:(orders[requested]||orders.standard);order.forEach(id=>{const s=one('#'+id);if(s)main.appendChild(s)});main.insertBefore(hero,main.firstChild)}
  all('a[href^="#"]').forEach(a=>a.addEventListener('click',e=>{const t=one(a.getAttribute('href'));if(!t)return;e.preventDefault();t.scrollIntoView({behavior:'smooth'})}));
}
const configScript=document.createElement('script');configScript.src='site.config.js';configScript.onload=initSite;configScript.onerror=initSite;document.head.appendChild(configScript);
