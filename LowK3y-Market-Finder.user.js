// ==UserScript==
// @name         LowK3y Market Opportunity Finder
// @namespace    lowk3y-industries-market
// @version      0.2.1
// @description  Read-only Torn market watchlist with illustrative fee-adjusted comparisons. Manual refresh only.
// @match        https://www.torn.com/*
// @match        https://torn.com/*
// @run-at       document-end
// @grant        none
// @updateURL    https://raw.githubusercontent.com/5cyp4csmpb-ctrl/Lowk3y-Market-Finder/main/LowK3y-Market-Finder.user.js
// @downloadURL  https://raw.githubusercontent.com/5cyp4csmpb-ctrl/Lowk3y-Market-Finder/main/LowK3y-Market-Finder.user.js
// ==/UserScript==
(() => {
  'use strict';
  if (document.getElementById('lowk3y-market-finder-host')) return;
  const host=document.createElement('div');
  host.id='lowk3y-market-finder-host';
  (document.body||document.documentElement).appendChild(host);
  const root=host.attachShadow({mode:'open'});
  const store='lowk3y-market-finder-items';
  let ids=[206];
  try { const saved=JSON.parse(localStorage.getItem(store)||'null'); if(Array.isArray(saved)) ids=saved.filter(x=>Number.isSafeInteger(x)&&x>0).slice(0,10); } catch {}
  root.innerHTML=`<style>
  :host{all:initial;font:13px system-ui;color:#f4f4f4}
  button,input{font:inherit}button{background:#263746;border:1px solid #607386;border-radius:9px;color:white;padding:8px;cursor:pointer}
  #open{position:fixed;right:8px;bottom:88px;z-index:2147483000;background:#17222e;color:#f6ce69;border:1px solid #c29a48}
  #panel{position:fixed;right:8px;bottom:132px;z-index:2147483000;box-sizing:border-box;width:min(350px,calc(100vw - 16px));max-height:56vh;overflow:auto;padding:12px;border:1px solid #9b813d;border-radius:12px;background:#111a24;color:#f4f4f4;box-shadow:0 5px 25px #0009}
  [hidden]{display:none!important}h3{margin:0;color:#f6ce69}p{font-size:12px;line-height:1.5;color:#c2cbd7}input{background:#09121b;color:white;border:1px solid #667585;border-radius:7px;padding:8px;max-width:100%;box-sizing:border-box}
  #key{width:100%}.row{display:flex;align-items:center;gap:7px;flex-wrap:wrap;margin:9px 0}#id{width:90px}#fee{width:60px}.item{padding:9px 0;border-top:1px solid #394756}.bad{color:#ffaaa8}.good{color:#9ae3af}a{color:#a9d3ff}
  .tabs{display:flex;gap:6px;margin:9px 0}.tabs button[aria-pressed=true]{border-color:#f6ce69;color:#f6ce69}.section{display:block}.section[hidden]{display:none!important}.muted{font-size:11px;color:#b4c1ce}.field{display:flex;flex-direction:column;gap:4px;flex:1;min-width:90px}.field input{width:100%}.summary{padding:9px;border:1px solid #47586b;border-radius:9px;margin:8px 0}#overseas select{background:#09121b;color:white;border:1px solid #667585;border-radius:7px;padding:8px;max-width:100%}\n  </style><button id="open">💰 Market</button><section id="panel" hidden>
  <h3>LowK3y Market Finder v0.2.1</h3><div class="tabs"><button id="cityTab" aria-pressed="true">City Market</button><button id="abroadTab" aria-pressed="false">Overseas</button></div><div id="city" class="section"><p>Read-only beta • up to ten items • manual refresh</p>
  <label>Public API key (not saved)</label><input id="key" type="password" autocomplete="off" placeholder="Enter your Public API key">
  <div class="row"><label>Assumed fee % <input id="fee" type="number" min="0" max="99" step="0.5" value="5"></label><button id="scan">Refresh</button></div>
  <div class="row"><input id="id" type="number" min="1" placeholder="Item ID"><button id="add">Add item</button><button id="reset">Reset</button></div>
  <p id="status"></p><div id="results"></div>
  <p>API average is only a reference, not a guaranteed selling price. Fee is a user-editable assumption. Check actual market depth and prices before buying.</p></div><div id="overseas" class="section" hidden><p>Overseas planning calculator. Foreign purchase prices are entered manually, NOT live foreign stock. City resale reference is fetched from the official Torn API when you tap Check.</p><div class="row"><label class="field">Country<select id="country"><option>Argentina</option><option>Canada</option><option>Cayman Islands</option><option>China</option><option>Hawaii</option><option>Japan</option><option>Mexico</option><option>South Africa</option><option>Switzerland</option><option>UAE</option><option>United Kingdom</option></select></label><label class="field">Item ID<input id="foreignId" type="number" min="1" value="206"></label></div><div class="row"><label class="field">Shop price (T$)<input id="shopPrice" type="number" min="0" placeholder="Enter observed price"></label><label class="field">Quantity<input id="qty" type="number" min="1" value="10"></label></div><div class="row"><label class="field">Trip costs (T$)<input id="tripCost" type="number" min="0" value="0"></label><label class="field">Assumed sale fee %<input id="foreignFee" type="number" min="0" max="99" value="5"></label></div><button id="checkForeign">Check against city market</button><div id="foreignResult" class="summary" aria-live="polite">Enter a verified shop price to compare.</div><p class="muted">Stock, restocks and foreign shop prices are not live. No purchases or travel are automated. Check availability in Torn before flying. API data may be cached.</p></div><button id="close">Close</button></section>`;
  const $=id=>root.getElementById(id), money=n=>'$'+Math.round(n).toLocaleString('en-US');
  const tab=which=>{const abroad=which==='abroad';$('city').hidden=abroad;$('overseas').hidden=!abroad;$('cityTab').setAttribute('aria-pressed',String(!abroad));$('abroadTab').setAttribute('aria-pressed',String(abroad));};
  $('cityTab').onclick=()=>tab('city');$('abroadTab').onclick=()=>tab('abroad');
  $('open').onclick=()=>{$('panel').hidden=!$('panel').hidden;};
  $('close').onclick=()=>{$('panel').hidden=true;};
  const save=()=>localStorage.setItem(store,JSON.stringify(ids));
  $('add').onclick=()=>{const id=Number($('id').value);if(!Number.isSafeInteger(id)||id<1||id>1000000){$('status').textContent='Enter a valid item ID.';return;}if(!ids.includes(id)&&ids.length>=10){$('status').textContent='Maximum ten items.';return;}if(!ids.includes(id)){ids.push(id);save();}$('id').value='';$('status').textContent='Watchlist: '+ids.join(', ');};
  $('reset').onclick=()=>{ids=[206];save();$('results').replaceChildren();$('status').textContent='Reset to Xanax (206).';};
  let busy=false,last=0,foreignBusy=false,foreignLast=0;
  $('checkForeign').onclick=async()=>{
    if(foreignBusy)return;
    const key=$('key').value.trim(),id=Number($('foreignId').value),buy=Number($('shopPrice').value),qty=Number($('qty').value),cost=Number($('tripCost').value),fee=Number($('foreignFee').value)/100;
    const out=$('foreignResult');
    if(!key){out.textContent='Enter your Public API key on the City Market tab first.';return;}
    if(!Number.isSafeInteger(id)||id<1||!$('shopPrice').value||!(buy>0)||!Number.isSafeInteger(qty)||qty<1||qty>100000||!Number.isFinite(cost)||cost<0||!Number.isFinite(fee)||fee<0||fee>=1){out.textContent='Check item ID, foreign shop price, quantity, trip cost and fee.';return;}
    if(Date.now()-foreignLast<35000){out.textContent='Please wait before checking again.';return;}
    foreignBusy=true;foreignLast=Date.now();$('checkForeign').disabled=true;out.textContent='Checking Torn city-market reference...';
    try{
      const ctrl=new AbortController(),timer=setTimeout(()=>ctrl.abort(),12000);let response;
      try{response=await fetch('https://api.torn.com/v2/market/'+id+'/itemmarket',{headers:{Authorization:'ApiKey '+key},signal:ctrl.signal,cache:'no-store'});}finally{clearTimeout(timer);}
      if(!response.ok)throw Error('HTTP '+response.status);
      const data=await response.json();if(data.error)throw Error(data.error.error||'Torn API error');
      const m=data.itemmarket||{},avg=Number((m.item||{}).average_price);
      if(!(avg>0))throw Error('No valid market average returned');
      const netPer=avg*(1-fee)-buy,netTrip=netPer*qty-cost,breakEven=(buy+cost/qty)/(1-fee);
      out.replaceChildren();
      const strong=document.createElement('strong');strong.textContent=(m.item?.name||'Item')+' — '+$('country').value;out.append(strong);
      const p=document.createElement('p');p.textContent='Foreign price (manual): '+money(buy)+' · City API average: '+money(avg)+' · Qty: '+qty;out.append(p);
      const total=document.createElement('p');total.className=netTrip>=0?'good':'bad';total.textContent='Illustrative trip net: '+money(netTrip)+' · Per item before trip cost: '+money(netPer);out.append(total);
      const note=document.createElement('p');note.textContent='Required city sale price to break even: '+money(breakEven)+'. Average price is NOT a confirmed buyer. Foreign stock is unverified.';out.append(note);
    }catch(e){out.textContent='Unable to compare: '+String(e.message||e);}
    finally{foreignBusy=false;$('checkForeign').disabled=false;}
  };
  $('scan').onclick=async()=>{
    if(busy)return;
    const key=$('key').value.trim(),fee=Number($('fee').value)/100;
    if(!key){$('status').textContent='Enter your Public API key first.';return;}
    if(!Number.isFinite(fee)||fee<0||fee>=1){$('status').textContent='Invalid fee.';return;}
    const wait=35000-(Date.now()-last);if(wait>0){$('status').textContent='Wait '+Math.ceil(wait/1000)+'s before refreshing.';return;}
    busy=true;last=Date.now();$('scan').disabled=true;$('results').replaceChildren();
    try {
      for(const id of ids){
        $('status').textContent='Checking item '+id+'...';
        const block=document.createElement('div');block.className='item';$('results').append(block);
        try {
          const ctrl=new AbortController(),timer=setTimeout(()=>ctrl.abort(),12000);
          let response;try {response=await fetch('https://api.torn.com/v2/market/'+id+'/itemmarket',{headers:{Authorization:'ApiKey '+key},signal:ctrl.signal,cache:'no-store'});}finally{clearTimeout(timer);}
          if(!response.ok)throw Error('HTTP '+response.status);
          const data=await response.json();
          if(data.error)throw Error(data.error.error||'Torn API error');
          const market=data.itemmarket||{},meta=market.item||{},avg=Number(meta.average_price);
          const listings=Array.isArray(market.listings)?market.listings.filter(x=>Number.isFinite(x.price)&&x.price>0&&Number.isFinite(x.amount)&&x.amount>0).sort((a,b)=>a.price-b.price):[];
          const cheapest=listings[0];
          const heading=document.createElement('strong');heading.textContent=(meta.name||'Item')+' (#'+id+')';block.append(heading);
          const p=document.createElement('p');block.append(p);
          if(!cheapest){p.textContent='No valid listings returned.';continue;}
          p.textContent='Lowest: '+money(cheapest.price)+' ('+cheapest.amount+' available) · API average: '+(Number.isFinite(avg)&&avg>0?money(avg):'unknown');
          const result=document.createElement('p');block.append(result);
          if(Number.isFinite(avg)&&avg>0){const profit=avg*(1-fee)-cheapest.price;result.className=profit>=0?'good':'bad';result.textContent='Illustrative net per item: '+money(profit)+' ('+(100*profit/cheapest.price).toFixed(1)+'% ROI)';}
          else result.textContent='Profit comparison unavailable.';
          const link=document.createElement('a');link.href='https://www.torn.com/page.php?sid=ItemMarket#/market/view=search&itemID='+id;link.textContent='Open Torn market (manual)';block.append(link);
        }catch(e){block.textContent='Item '+id+': '+String(e.message||e);}
      }
      $('status').textContent='Finished. Verify prices manually; Torn data may be cached.';
    }finally{busy=false;$('scan').disabled=false;}
  };
})();