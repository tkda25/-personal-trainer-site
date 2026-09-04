function initSite() {
  const c = window.SITE_CONFIG || {};
  const one = s => document.querySelector(s);
  const all = s => [...document.querySelectorAll(s)];
  const text = (s, v) => { if (v == null) return; const e = one(s); if (e) e.textContent = v; };
  const html = (s, v) => { if (v == null) return; const e = one(s); if (e) e.innerHTML = v; };

  if (c.title) document.title = c.title;
  if (c.description) {
    const meta = one('meta[name="description"]');
    if (meta) meta.setAttribute('content', c.description);
  }

  all('[data-brand]').forEach(e => e.textContent = c.brand || 'BRAND');
  text('[data-copyright]', `© ${new Date().getFullYear()} ${c.brand || 'BRAND'}`);

  text('[data-hero-eyebrow]', c.hero?.eyebrow);
  html('[data-hero-headline]', c.hero?.headlineHtml);
  html('[data-hero-description]', c.hero?.descriptionHtml);
  text('[data-hero-photo]', c.hero?.photoText);

  html('[data-concept-headline]', c.concept?.headlineHtml);
  text('[data-concept-body]', c.concept?.body);

  text('[data-features-title]', c.features?.title);
  const featureRoot = one('[data-features]');
  if (featureRoot) {
    featureRoot.innerHTML = (c.features?.items || []).map((item, i) => `
      <article>
        <small>${String(i + 1).padStart(2, '0')}</small>
        <h3>${item.title || ''}</h3>
        <p>${item.body || ''}</p>
      </article>`).join('');
  }

  text('[data-services-title]', c.services?.title);
  const serviceRoot = one('[data-service-groups]');
  if (serviceRoot) {
    serviceRoot.innerHTML = (c.services?.groups || []).map(group => `
      <div class="service-group">
        <h4>${group.title || ''}</h4>
        <div class="grid auto-grid">
          ${(group.items || []).map(item => `
            <article class="${item.badge ? 'recommend' : ''}">
              ${item.badge ? `<i>${item.badge}</i>` : ''}
              <h3>${item.label || ''}</h3>
              <strong>${item.price || ''}</strong>
              ${item.sub ? `<p>${item.sub}</p>` : ''}
            </article>`).join('')}
        </div>
        ${group.note ? `<p class="note">${group.note}</p>` : ''}
      </div>`).join('');
  }

  text('[data-results-title]', c.results?.title);
  const resultRoot = one('[data-results]');
  if (resultRoot) {
    resultRoot.innerHTML = (c.results?.items || []).map(item => `
      <article class="result-card">
        <div class="photo">${item.photoText || 'PHOTO'}</div>
        <h3>${item.title || ''}</h3>
        <p>${item.body || ''}</p>
      </article>`).join('');
  }

  html('[data-about-headline]', c.about?.headlineHtml);
  text('[data-about-name]', c.about?.name);
  text('[data-about-body]', c.about?.body);
  text('[data-about-photo]', c.about?.photoText);

  const faqRoot = one('[data-faq]');
  if (faqRoot) {
    faqRoot.innerHTML = (c.faq || []).map(item => `
      <details>
        <summary>${item.q || ''}</summary>
        <p>${item.a || ''}</p>
      </details>`).join('');
  }

  html('[data-contact-headline]', c.contact?.headlineHtml);
  text('[data-contact-description]', c.contact?.description);
  all('[data-primary-cta]').forEach(a => {
    if (c.contact?.primaryLabel) a.textContent = c.contact.primaryLabel;
    if (c.contact?.primaryUrl) a.href = c.contact.primaryUrl;
  });
  const email = one('[data-email-link]');
  if (email) {
    if (c.contact?.email) email.href = `mailto:${c.contact.email}`;
    else email.style.display = 'none';
  }

  all('a[href^="#"]').forEach(a => a.addEventListener('click', e => {
    const target = one(a.getAttribute('href'));
    if (!target) return;
    e.preventDefault();
    target.scrollIntoView({ behavior: 'smooth' });
  }));
}

const configScript = document.createElement('script');
configScript.src = 'site.config.js';
configScript.onload = initSite;
configScript.onerror = initSite;
document.head.appendChild(configScript);
