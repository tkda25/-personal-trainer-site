(function(){
  const cleanText=el=>(el?.textContent||'').replace(/\s+/g,'').trim();
  const classify=(el,type)=>{
    if(!el)return;
    const len=[...cleanText(el)].length;
    el.dataset.textLength=len<=14?'short':len<=24?'medium':'long';
    el.dataset.textRole=type;
  };
  const apply=()=>{
    classify(document.querySelector('.hero h1'),'hero');
    document.querySelectorAll('.v7-section-head h2, main>section:not(.hero)>h2').forEach(el=>classify(el,'section'));
    document.querySelectorAll('.hero p, main section p, main section li, main section dd').forEach(el=>{el.classList.add('v8-readable-copy')});
    document.body.dataset.headlineV8='ready';
  };
  window.applyHeadlineV8=apply;
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(apply,0));else setTimeout(apply,0);
})();