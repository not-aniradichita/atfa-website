// Studio Booking System for Aniradichita Studio
(function(){
const MONTHS=['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAYS=['SUN','MON','TUE','WED','THU','FRI','SAT'];

// Pricing tiers
const RATES={
  weekday:{1:800,2:1500,3:2200,4:2800},   // Mon(1)–Thu(4)
  weekend:{1:1000,2:1900,3:2800,4:3600}   // Fri(5)–Sun(0,6)
};
const ADDONS=[
  {id:'chair',name:'Chair Seating',desc:'Comfortable chairs for guests',rate:25},
  {id:'sound',name:'Sound Equipment',desc:'2 mics + 1 speaker',rate:50},
  {id:'podcast',name:'Podcast Setup',desc:'2 podcast mics, 3 tripods, rolling office chairs for guests',rate:100}
];

// Seeded fake bookings per dateKey (YYYY-MM-DD) -> array of booked hours (24h, e.g. [10,11,15,16,17])
function seededBookings(){
  const out={};
  const today=new Date();
  for(let m=-1;m<=3;m++){
    const ref=new Date(today.getFullYear(),today.getMonth()+m,1);
    const days=new Date(ref.getFullYear(),ref.getMonth()+1,0).getDate();
    for(let d=1;d<=days;d++){
      const dt=new Date(ref.getFullYear(),ref.getMonth(),d);
      const key=fmtKey(dt);
      // pseudo-random based on date
      const seed=(dt.getFullYear()*1000+dt.getMonth()*40+d);
      const rnd=(s)=>((Math.sin(s)+1)/2);
      const r=rnd(seed);
      const r2=rnd(seed+7);
      if(r<0.05){ // fully booked day
        out[key]=Array.from({length:15},(_,i)=>i+8);
      } else if(r<0.55){ // some slots booked
        const blocks=Math.floor(r2*3)+1;
        const hours=[];
        for(let b=0;b<blocks;b++){
          const start=8+Math.floor(rnd(seed+b*3+11)*13);
          const len=1+Math.floor(rnd(seed+b*5+19)*3);
          for(let h=0;h<len;h++) if(start+h<=22) hours.push(start+h);
        }
        out[key]=Array.from(new Set(hours)).sort((a,b)=>a-b);
      }
    }
  }
  return out;
}
function fmtKey(dt){
  return dt.getFullYear()+'-'+String(dt.getMonth()+1).padStart(2,'0')+'-'+String(dt.getDate()).padStart(2,'0');
}
function fmtHour(h){
  const ampm=h<12?'AM':'PM';
  let hh=h%12; if(hh===0) hh=12;
  return hh+':00 '+ampm;
}
function isWeekendDate(dt){
  const w=dt.getDay(); // 0 Sun, 5 Fri, 6 Sat
  return w===0||w===5||w===6;
}

const state={
  view:new Date(),
  selDate:null,
  duration:null, // 1..4
  startHour:null,
  addons:{},
  bookings:seededBookings()
};
// align view to today
state.view.setDate(1);

function renderCal(){
  const v=state.view;
  document.getElementById('cal2Label').textContent=MONTHS[v.getMonth()]+' '+v.getFullYear();
  const wrap=document.getElementById('cal2');
  let html='';
  DAYS.forEach((d,i)=>{
    const cls=(i===0||i===5||i===6)?'cal2-hd we':'cal2-hd';
    html+=`<div class="${cls}">${d}</div>`;
  });
  const first=new Date(v.getFullYear(),v.getMonth(),1).getDay();
  const days=new Date(v.getFullYear(),v.getMonth()+1,0).getDate();
  const today=new Date(); today.setHours(0,0,0,0);
  for(let i=0;i<first;i++) html+='<div class="cal2-d empty"></div>';
  for(let d=1;d<=days;d++){
    const dt=new Date(v.getFullYear(),v.getMonth(),d);
    const key=fmtKey(dt);
    const isPast=dt<today;
    const we=isWeekendDate(dt);
    const isToday=dt.getTime()===today.getTime();
    const bk=state.bookings[key]||[];
    const totalSlots=15; // 8 to 22 inclusive (15 hours)
    const isFull=bk.length>=totalSlots;
    const isPart=bk.length>0&&!isFull;
    let cls='cal2-d';
    if(we) cls+=' weekend';
    if(isPast) cls+=' dis';
    if(isToday) cls+=' today';
    if(isFull) cls+=' fullbook';
    if(isPart) cls+=' partbook';
    if(state.selDate===key) cls+=' sel';
    const dot=(isPart||isFull)?'<span class="dot"></span>':'';
    const handler=(isPast||isFull)?'':`onclick="sb.pickDate('${key}')"`;
    html+=`<div class="${cls}" ${handler}>${d}${dot}</div>`;
  }
  wrap.innerHTML=html;
}

function renderDurations(){
  const grid=document.getElementById('durGrid');
  const tierEl=document.getElementById('tierDisplay');
  if(!state.selDate){
    grid.innerHTML='<p style="grid-column:1/-1;color:#555;font-size:.78rem;padding:14px;text-align:center;">Pick a date to see pricing.</p>';
    tierEl.textContent='— select a date first';
    return;
  }
  const dt=parseKey(state.selDate);
  const we=isWeekendDate(dt);
  const tier=we?'weekend':'weekday';
  tierEl.innerHTML=we
    ?'<span style="color:var(--gold);">FRI–SUN · Weekend tier</span>'
    :'<span style="color:var(--red);">MON–THU · Weekday tier</span>';
  let html='';
  [1,2,3,4].forEach(h=>{
    const price=RATES[tier][h];
    const sel=state.duration===h?'sel':'';
    html+=`<div class="dur ${sel}" onclick="sb.pickDuration(${h})"><b>${h} hr${h>1?'s':''}</b><div class="pr">₹${price.toLocaleString('en-IN')}<small>${h>1?'₹'+Math.round(price/h)+'/hr avg':'flat'}</small></div></div>`;
  });
  grid.innerHTML=html;
}

function renderSlots(){
  const grid=document.getElementById('slotGrid');
  const hint=document.getElementById('slotHint');
  if(!state.selDate){
    grid.innerHTML=''; hint.textContent='Select a date and duration above to see available start times.';
    return;
  }
  if(!state.duration){
    grid.innerHTML=''; hint.textContent='Now select a duration to see available start times.';
    return;
  }
  hint.innerHTML='Slots run from <b>8 AM to 11 PM</b>. Already-booked hours are <span style="color:#552020;text-decoration:line-through;">crossed out</span>. A '+state.duration+'-hour booking will run consecutively from your chosen start.';
  const bk=new Set(state.bookings[state.selDate]||[]);
  let html='';
  for(let h=8;h<=22;h++){
    const lastStart=22-state.duration+1;
    const fits=h<=lastStart;
    let bkConflict=false;
    for(let k=0;k<state.duration;k++) if(bk.has(h+k)) bkConflict=true;
    let cls='slot';
    let label=fmtHour(h);
    let sub='';
    if(bk.has(h)){cls+=' bk';sub='<small>BOOKED</small>';}
    else if(!fits){cls+=' un';sub='<small>too late</small>';}
    else if(bkConflict){cls+=' un';sub='<small>overlaps</small>';}
    else if(state.startHour===h){cls+=' sel';sub='<small>→ '+fmtHour(h+state.duration)+'</small>';}
    const handler=(cls.includes('bk')||cls.includes('un'))?'':`onclick="sb.pickStart(${h})"`;
    html+=`<div class="${cls}" ${handler}>${label}${sub}</div>`;
  }
  grid.innerHTML=html;
}

function renderAddons(){
  const wrap=document.getElementById('addonList');
  let html='';
  ADDONS.forEach(a=>{
    const on=state.addons[a.id]?'on':'';
    const checked=state.addons[a.id]?'checked':'';
    html+=`<label class="addon-row ${on}"><input type="checkbox" ${checked} onchange="sb.toggleAddon('${a.id}')"><div class="ar-l"><b>${a.name}</b><span>${a.desc}</span></div><div class="ar-r">₹${a.rate}/hr</div></label>`;
  });
  wrap.innerHTML=html;
}

function renderSummary(){
  const sum=document.getElementById('bookSummary');
  const cta=document.getElementById('bookCta');
  if(!state.selDate||!state.duration||state.startHour===null){
    sum.style.display='none';
    cta.disabled=true;
    cta.textContent='📩 Complete the steps above to enable booking';
    return;
  }
  const dt=parseKey(state.selDate);
  const we=isWeekendDate(dt);
  const tier=we?'weekend':'weekday';
  const base=RATES[tier][state.duration];
  let addonLines=[];
  let addonTotal=0;
  Object.keys(state.addons).forEach(id=>{
    if(state.addons[id]){
      const a=ADDONS.find(x=>x.id===id);
      const cost=a.rate*state.duration;
      addonTotal+=cost;
      addonLines.push(`<div class="sline"><span>+ ${a.name} (${state.duration}h × ₹${a.rate})</span><b>₹${cost.toLocaleString('en-IN')}</b></div>`);
    }
  });
  const total=base+addonTotal;
  sum.style.display='block';
  sum.innerHTML=`
    <div class="sline"><span>Date</span><b>${dt.toDateString()}</b></div>
    <div class="sline"><span>Tier</span><b style="color:${we?'var(--gold)':'var(--red)'};">${we?'Weekend (Fri–Sun)':'Weekday (Mon–Thu)'}</b></div>
    <div class="sline"><span>Time</span><b>${fmtHour(state.startHour)} → ${fmtHour(state.startHour+state.duration)} (${state.duration} hr${state.duration>1?'s':''})</b></div>
    <div class="sline"><span>Basic Package</span><b>₹${base.toLocaleString('en-IN')}</b></div>
    ${addonLines.join('')}
    <div class="total"><span>TOTAL</span><b>₹${total.toLocaleString('en-IN')}</b></div>
  `;
  cta.disabled=false;
  cta.textContent='📩 Send Booking Request to office@aniradichita.com';
}

function parseKey(k){const[y,m,d]=k.split('-').map(Number);return new Date(y,m-1,d);}

const sb={
  changeMonth(dir){
    state.view.setMonth(state.view.getMonth()+dir);
    renderCal();
  },
  pickDate(key){
    state.selDate=key;
    state.duration=null;
    state.startHour=null;
    renderCal(); renderDurations(); renderSlots(); renderSummary();
  },
  pickDuration(h){
    state.duration=h;
    // reset start hour if overlap now
    state.startHour=null;
    renderDurations(); renderSlots(); renderSummary();
  },
  pickStart(h){
    state.startHour=h;
    renderSlots(); renderSummary();
  },
  toggleAddon(id){
    state.addons[id]=!state.addons[id];
    renderAddons(); renderSummary();
  },
  submit(){
    if(state.startHour===null||!state.duration||!state.selDate) return;
    const name=document.getElementById('bk_name').value.trim();
    const phone=document.getElementById('bk_phone').value.trim();
    const email=document.getElementById('bk_email').value.trim();
    const purpose=document.getElementById('bk_purpose').value;
    const notes=document.getElementById('bk_notes').value.trim();
    if(!name||!phone||!email){alert('Please fill in your name, phone and email.');return;}
    const dt=parseKey(state.selDate);
    const we=isWeekendDate(dt);
    const tier=we?'weekend':'weekday';
    const base=RATES[tier][state.duration];
    let lines=[];
    let total=base;
    Object.keys(state.addons).forEach(id=>{
      if(state.addons[id]){
        const a=ADDONS.find(x=>x.id===id);
        const cost=a.rate*state.duration;
        total+=cost;
        lines.push(`${a.name} (${state.duration}h × ₹${a.rate}) = ₹${cost}`);
      }
    });
    const body=[
      'STUDIO BOOKING REQUEST',
      '----------------------',
      'Date: '+dt.toDateString(),
      'Tier: '+(we?'Weekend (Fri–Sun)':'Weekday (Mon–Thu)'),
      'Time: '+fmtHour(state.startHour)+' to '+fmtHour(state.startHour+state.duration),
      'Duration: '+state.duration+' hour(s)',
      'Basic Package: ₹'+base,
      lines.length?'Add-ons:\n  '+lines.join('\n  '):'Add-ons: none',
      'TOTAL: ₹'+total,
      '',
      'GUEST DETAILS',
      '-------------',
      'Name: '+name,
      'Phone: '+phone,
      'Email: '+email,
      'Purpose: '+purpose,
      'Notes: '+(notes||'-')
    ].join('\n');
    const subject='Studio Booking — '+dt.toDateString()+' '+fmtHour(state.startHour);
    window.location.href='mailto:office@aniradichita.com?subject='+encodeURIComponent(subject)+'&body='+encodeURIComponent(body);
    setTimeout(()=>alert('📩 Your email client is opening with your booking request.\nWe will confirm within 2 hours.\n\nHum Aap ke PAaaS Hai! 🎭'),400);
  }
};
window.sb=sb;

function init(){
  renderCal();
  renderDurations();
  renderSlots();
  renderAddons();
  renderSummary();
}
if(document.readyState!=='loading') init(); else document.addEventListener('DOMContentLoaded',init);
})();
