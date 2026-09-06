(function(){
  const cleanText=el=>(el?.textContent||'').replace(/\s+/g,'').trim();
  const classify=(el,type)=>{
    if(!el)return;
    const len=[...cleanText(el)].length;
    el.dataset.textLength=len<=13?'short':len<=24?'medium':'long';
    el.dataset.textRole=type;
  };
  const naturalBreak=el=>{
    if(!el||el.querySelector('br')||window.innerWidth>760)return;
    const text=cleanText(el),chars=[...text];
    if(chars.length<14||chars.length>28)return;
    const candidates=[];
    chars.forEach((ch,i)=>{if(ch==='、'||ch==='：'||ch==='・')candidates.push(i+1)});
    if(!candidates.length)return;
    const center=chars.length/2;
    const cut=candidates.sort((a,b)=>Math.abs(a-center)-Math.abs(b-center))[0];
    if(cut/chars.length<0.3||cut/chars.length>0.7)return;
    el.dataset.v8Original=text;
    el.textContent=chars.slice(0,cut).join('');
    const br=document.createElement('br');br.dataset.v8Break='1';el.appendChild(br);
    el.appendChild(document.createTextNode(chars.slice(cut).join('')));
    el.dataset.naturalBreak='1';
  };
  const fitShort=el=>{
    if(!el||window.innerWidth>760||el.dataset.naturalBreak==='1')return;
    const len=[...cleanText(el)].length;
    if(len>13)return;
    el.style.whiteSpace='nowrap';
    const box=el.parentElement?.clientWidth||el.clientWidth||window.innerWidth-40;
    let size=Math.min(42,Math.max(26,(box/Math.max(len,1))*0.9));
    el.style.fontSize=`${size}px`;
    while(el.scrollWidth>box&&size>22){size-=1;el.style.fontSize=`${size}px`}
  };
  const apply=()=>{
    const hero=document.querySelector('.hero h1');
    classify(hero,'hero');
    naturalBreak(hero);
    fitShort(hero);
    document.querySelectorAll('.v7-section-head h2, main>section:not(.hero)>h2').forEach(el=>{classify(el,'section');naturalBreak(el)});
    document.querySelectorAll('.hero p, main section p, main section li, main section dd').forEach(el=>el.classList.add('v8-readable-copy'));
    document.body.dataset.headlineV8='ready';
  };
  const schedule=()=>[0,250,800].forEach(ms=>setTimeout(apply,ms));
  window.applyHeadlineV8=()=>{apply();setTimeout(apply,250)};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',schedule);else schedule();
  window.addEventListener('resize',()=>setTimeout(apply,80),{passive:true});
})();