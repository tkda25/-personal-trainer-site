const config = window.SITE_CONFIG || {};

function setHTML(selector, value) {
  if (value == null) return;
  const el = document.querySelector(selector);
  if (el) el.innerHTML = value;
}

function setText(selector, value) {
  if (value == null) return;
  const el = document.querySelector(selector);
  if (el) el.textContent = value;
}

function setHref(selector, value) {
  if (value == null) return;
  document.querySelectorAll(selector).forEach(el => el.setAttribute('href', value));
}

if (config.title) document.title = config.title;
setText('header > b', config.brand);
setText('footer', config.brand);

setText('.hero small', config.hero?.eyebrow);
setHTML('.hero h1', config.hero?.headlineHtml);
setHTML('.hero p', config.hero?.descriptionHtml);

setHTML('#concept h2', config.concept?.headlineHtml);
setText('#concept p', config.concept?.body);

setHref('a.gold', config.contact?.lineUrl);
if (config.contact?.email) setHref('a[href^="mailto:"]', `mailto:${config.contact.email}`);

const priceCards = document.querySelectorAll('#price article');
const priceKeys = ['training10','training20','support16','support24','food1','food3','food6','trial'];
priceKeys.forEach((key, index) => {
  const card = priceCards[index];
  const item = config.prices?.[key];
  if (!card || !item) return;
  const h3 = card.querySelector('h3');
  const strong = card.querySelector('strong');
  const p = card.querySelector('p');
  if (h3 && item.label) h3.textContent = item.label;
  if (strong && item.price) strong.textContent = item.price;
  if (p && item.sub) p.textContent = item.sub;
});

document.querySelectorAll('a[href^="#"]').forEach(a => a.addEventListener('click', e => {
  const t = document.querySelector(a.getAttribute('href'));
  if (t) {
    e.preventDefault();
    t.scrollIntoView({ behavior: 'smooth' });
  }
}));
