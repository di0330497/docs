// 게이트웨이(색인) 페이지 — 실제 학습자료 페이지와 같은 토큰·클래스·조작감을 쓴다.
import { VENDORS } from './vendors.mjs';

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

const CSS = `
:root{
  --bg:#1a1b26; --bg-deep:#16161e; --surface:#24283b; --surface-2:#1f2335;
  --line:#2f3549; --line-2:#3b4261;
  --fg:#c0caf5; --fg-dim:#a9b1d6; --muted:#787c99; --faint:#565f89;
  --blue:#7aa2f7; --cyan:#7dcfff; --magenta:#bb9af7; --green:#9ece6a;
  --mono:"Malgun Gothic","맑은 고딕",system-ui,sans-serif;
  --sans:"Malgun Gothic","맑은 고딕",system-ui,sans-serif;
}
*{box-sizing:border-box}
html,body{margin:0;padding:0;height:100%}
body{background:var(--bg);color:var(--fg);font-family:var(--sans);font-size:16.5px;line-height:1.8;
  -webkit-font-smoothing:antialiased;text-rendering:optimizeLegibility}
a{color:inherit}
::selection{background:rgba(122,162,247,.28)}
::-webkit-scrollbar{width:10px;height:10px}
::-webkit-scrollbar-thumb{background:var(--line-2);border-radius:6px;border:2px solid var(--bg)}
::-webkit-scrollbar-thumb:hover{background:var(--faint)}
::-webkit-scrollbar-track{background:transparent}

/* 학습자료 페이지와 같은 기본 배율 150%. 배율 설정은 localStorage 로 공유된다. */
html{--zoom:1.5}
body{zoom:var(--zoom)}
.app{display:flex;height:calc(100vh / var(--zoom));overflow:hidden}
.zoom{all:unset;cursor:pointer;margin-left:10px;padding:2px 8px;border:1px solid var(--line-2);border-radius:5px;
  color:var(--muted);font-family:var(--mono);font-size:11px;white-space:nowrap}
.zoom:hover{color:var(--fg);border-color:var(--blue)}

/* ── 사이드바 ── */
.side{width:300px;flex:0 0 300px;background:var(--bg-deep);border-right:1px solid var(--line);
  display:flex;flex-direction:column;min-height:0}
.side-head{padding:16px 14px 12px;border-bottom:1px solid var(--line)}
.brand{display:block;font-weight:700;font-size:15px;text-decoration:none;letter-spacing:-.01em;color:var(--fg)}
.side-head .meta{margin:3px 0 10px;font-size:11.5px;color:var(--faint);font-family:var(--mono)}
.filter{width:100%;background:var(--surface-2);border:1px solid var(--line-2);border-radius:7px;
  color:var(--fg);font-family:var(--sans);font-size:13px;padding:7px 10px;outline:none}
.filter::placeholder{color:var(--faint)}
.filter:focus{border-color:var(--blue);box-shadow:0 0 0 3px rgba(122,162,247,.14)}
.tree{flex:1;overflow-y:auto;padding:10px 8px 60px;min-height:0}
.nav-stage{margin-bottom:12px}
.nav-stage-t{display:flex;align-items:center;gap:8px;padding:6px 8px;font-size:11.5px;font-weight:700;
  color:var(--muted);letter-spacing:.04em;text-transform:uppercase}
.sn{display:inline-grid;place-items:center;width:19px;height:19px;border-radius:5px;flex:0 0 19px;
  background:rgba(122,162,247,.14);color:var(--blue);font-size:10.5px;font-weight:700;font-family:var(--mono)}
.nav-item{display:flex;align-items:baseline;gap:8px;padding:5px 8px 5px 30px;font-size:13.5px;
  color:var(--fg-dim);text-decoration:none;border-radius:6px;line-height:1.5;cursor:pointer}
.nav-item:hover{background:var(--surface-2);color:var(--fg)}
.nav-item .nid{font-family:var(--mono);font-size:10px;color:var(--faint);flex:0 0 auto;margin-left:auto}
.nav-item.hide,.nav-stage.hide{display:none}
.nav-empty{padding:14px 12px;font-size:12.5px;color:var(--faint)}
.nav-empty.hide{display:none}

/* ── 본문 ── */
.main{flex:1;min-width:0;display:flex;flex-direction:column}
.topbar{position:relative;height:44px;flex:0 0 44px;display:flex;align-items:center;gap:12px;padding:0 22px;
  border-bottom:1px solid var(--line);background:rgba(26,27,38,.86);backdrop-filter:blur(8px);
  font-size:12.5px;color:var(--muted);font-family:var(--mono)}
.topbar .crumb{font-weight:500;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;min-width:0}
.topbar .pos{margin-left:auto;color:var(--faint);flex:0 0 auto}
.topbar .keys{flex:0 0 auto}
.topbar kbd{font-family:var(--mono);font-size:10.5px;background:var(--surface-2);border:1px solid var(--line-2);
  border-bottom-width:2px;border-radius:4px;padding:1px 5px;color:var(--muted)}
.scroll{flex:1;overflow-y:auto;min-height:0;scroll-behavior:smooth}
.wrap{max-width:760px;margin:0 auto;padding:44px 28px 120px}

/* ── 표지 ── */
.eyebrow{margin:0 0 10px;font-size:12px;color:var(--magenta);font-weight:600;letter-spacing:.06em;
  text-transform:uppercase;font-family:var(--mono)}
h1{margin:0;font-size:clamp(34px,5vw,54px);line-height:1.12;letter-spacing:-.03em;font-weight:800}
.stats{display:flex;flex-wrap:wrap;gap:10px;margin:22px 0 26px}
.stat{display:flex;align-items:baseline;gap:6px;padding:7px 12px;background:var(--surface);
  border:1px solid var(--line);border-radius:8px;font-size:12px;color:var(--muted)}
.stat b{font-family:var(--mono);font-size:15px;color:var(--cyan);font-weight:700}

.panel{padding:18px 20px;background:var(--surface);border:1px solid var(--line);border-radius:12px;margin-bottom:34px}
.panel .lead{margin:0 0 14px;font-size:14.5px;color:var(--fg-dim);line-height:1.7}
.kv{display:flex;flex-wrap:wrap;gap:10px 26px;margin:0}
.kv>div{display:flex;align-items:baseline;gap:8px}
.kv dt{font-size:10.5px;font-weight:700;color:var(--faint);letter-spacing:.06em;white-space:nowrap;
  text-transform:uppercase;font-family:var(--mono)}
.kv dd{margin:0;font-size:13px;color:var(--fg-dim)}

/* 이어서 읽기 — 가장 많이 읽어 둔 자료로 한 번에 돌아간다 */
.resume{display:none;margin:0 0 26px}
.resume.on{display:block}
.resume a{display:flex;align-items:center;gap:12px;padding:13px 16px;text-decoration:none;
  background:rgba(122,162,247,.09);border:1px solid rgba(122,162,247,.28);border-radius:10px}
.resume a:hover{background:rgba(122,162,247,.16);border-color:var(--blue)}
.resume .tag{font-family:var(--mono);font-size:10px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;
  color:var(--blue);background:rgba(122,162,247,.16);border-radius:5px;padding:3px 7px;flex:0 0 auto}
.resume b{font-size:14.5px;font-weight:700;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.resume em{font-style:normal;margin-left:auto;font-family:var(--mono);font-size:11.5px;color:var(--faint);flex:0 0 auto}

/* ── 벤더 묶음 ── */
.vgroup{margin:0 0 38px;scroll-margin-top:20px}
.vgroup.hide{display:none}
.vh{display:flex;align-items:center;gap:10px;margin:0 0 3px}
.vh h2{margin:0;font-size:17px;font-weight:700;letter-spacing:-.015em}
.vh .vn{margin-left:auto;font-family:var(--mono);font-size:11.5px;color:var(--faint);
  background:var(--surface);border:1px solid var(--line);border-radius:5px;padding:2px 7px}
.vsub{margin:0 0 14px 29px;font-size:12.5px;color:var(--muted)}
.stage-grid{display:grid;gap:8px}
.st-card{display:flex;align-items:flex-start;gap:12px;padding:14px 16px;background:var(--surface);
  border:1px solid var(--line);border-radius:10px;text-decoration:none;transition:border-color .12s,background .12s}
.st-card:hover{border-color:var(--blue);background:var(--surface-2)}
.st-card.hide{display:none}
.st-card .sn{margin-top:3px}
.st-body{display:flex;flex-direction:column;gap:3px;min-width:0;flex:1}
.st-body b{font-size:15px;font-weight:700;letter-spacing:-.01em}
.st-body em{font-style:normal;font-size:12.5px;color:var(--muted);line-height:1.6}
.st-n{font-family:var(--mono);font-size:11.5px;color:var(--faint);flex:0 0 auto;
  display:flex;flex-direction:column;align-items:flex-end;gap:5px;padding-top:2px}
/* 읽은 비율 — 각 토픽 페이지가 localStorage 에 남긴 기록을 그대로 읽는다 */
.bar{width:54px;height:3px;border-radius:2px;background:var(--line-2);overflow:hidden}
.bar i{display:block;height:100%;width:0;background:var(--blue);border-radius:2px}
.st-card.done .bar i{background:var(--green)}
.pct{font-size:10px;color:var(--faint);min-height:15px}
.st-card.done .pct{color:var(--green)}

.note{margin-top:26px;padding-top:18px;border-top:1px solid var(--line);
  font-size:12.5px;color:var(--faint);line-height:1.7}

/* ── 모바일 ── */
.burger{display:none}
.scrim{display:none}
html.narrow .side{position:fixed;z-index:30;left:0;top:0;height:calc(100vh / var(--zoom));transform:translateX(-100%);
  transition:transform .2s ease;box-shadow:0 0 50px rgba(0,0,0,.5)}
html.narrow .side.open{transform:none}
html.narrow .scrim.on{display:block;position:fixed;inset:0;z-index:29;background:rgba(0,0,0,.5)}
html.narrow .wrap{padding:32px 20px 100px}
html.narrow .topbar{padding:0 16px}
html.narrow .topbar .keys{display:none}
html.narrow .burger{display:grid;place-items:center;position:fixed;z-index:31;right:18px;bottom:18px;
  width:50px;height:50px;border-radius:14px;background:var(--blue);color:#16161e;border:0;
  font-size:19px;cursor:pointer;box-shadow:0 8px 24px rgba(122,162,247,.4)}
@media print{ .side,.topbar,.burger,.scrim,.resume{display:none!important}
  .app,.scroll{display:block;height:auto;overflow:visible} body{background:#fff;color:#111;zoom:1} }
`;

export function renderGateway({ topics, noindex, updated }) {
  // 벤더별로 묶고 정의된 순서대로 늘어놓는다. 해당 토픽이 없는 벤더는 뺀다.
  const groups = VENDORS
    .map((v) => ({ ...v, items: topics.filter((t) => t.vendor === v.id) }))
    .filter((g) => g.items.length);

  const totalItems = topics.reduce((n, t) => n + (t.items || 0), 0);

  const nav = groups.map((g, gi) => `    <div class="nav-stage" data-v="${g.id}">
      <div class="nav-stage-t"><span class="sn">${gi + 1}</span><span>${esc(g.name)}</span></div>
${g.items.map((t) => `      <a class="nav-item" href="${t.href}" data-text="${esc((t.title + ' ' + g.name).toLowerCase())}">${esc(t.title)}<span class="nid">${t.items || ''}</span></a>`).join('\n')}
    </div>`).join('\n');

  const cards = groups.map((g, gi) => `      <section class="vgroup" id="v-${g.id}">
        <div class="vh"><span class="sn">${gi + 1}</span><h2>${esc(g.name)}</h2><span class="vn">${g.items.length}</span></div>
        <p class="vsub">${esc(g.sub)}</p>
        <div class="stage-grid">
${g.items.map((t, i) => `          <a class="st-card" href="${t.href}" data-key="${esc(t.key)}" data-total="${t.items || 0}" data-text="${esc((t.title + ' ' + g.name + ' ' + t.lead).toLowerCase())}"><span class="sn">${i + 1}</span><span class="st-body"><b>${esc(t.title)}</b><em>${esc(t.lead)}</em></span><span class="st-n"><span>${t.items || '?'}항목</span><span class="bar"><i></i></span><span class="pct"></span></span></a>`).join('\n')}
        </div>
      </section>`).join('\n');

  return `<!doctype html>
<html lang="ko"><head><meta charset="utf-8">${noindex}
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="dark">
<title>IT 학습자료</title>
<style>${CSS}</style></head>
<body>
<div class="scrim"></div>
<div class="app">
<aside class="side">
  <div class="side-head">
    <a class="brand" href="#top">IT 학습자료</a>
    <p class="meta">${topics.length} topics · ${groups.length} vendors</p>
    <input class="filter" type="text" placeholder="토픽 필터  /" spellcheck="false">
  </div>
  <nav class="tree">
${nav}
    <p class="nav-empty hide">일치하는 토픽이 없습니다.</p>
  </nav>
</aside>
<main class="main">
  <div class="topbar"><span class="crumb">전체 토픽</span><span class="pos"></span>
    <span class="keys"><kbd>/</kbd> 검색 <kbd>Esc</kbd> 지우기</span>
    <button type="button" class="zoom" title="화면 배율 (100 → 125 → 150 → 175%)">150%</button></div>
  <div class="scroll">
    <div class="wrap" id="top">
      <p class="eyebrow">벤더별 색인</p>
      <h1>IT 학습자료</h1>
      <div class="stats"><span class="stat"><b>${topics.length}</b>토픽</span><span class="stat"><b>${groups.length}</b>벤더</span><span class="stat"><b>${totalItems.toLocaleString('en-US')}</b>항목</span></div>
      <div class="resume"><a href="#"><span class="tag">이어서 읽기</span><b></b><em></em></a></div>
      <section class="panel">
        <p class="lead">공식 문서를 근거로 만든 IT 학습자료 모음이다. 만든 회사·재단 기준으로 묶었고, 카드를 누르면 해당 자료로 바로 넘어간다. 읽은 진도는 각 자료가 이 브라우저에 남긴 기록을 그대로 읽어 표시한다.</p>
        <dl class="kv">
          <div><dt>분류</dt><dd>벤더 · 제조사 · 개발사</dd></div>
          <div><dt>갱신</dt><dd>${updated}</dd></div>
          <div><dt>색인</dt><dd>검색엔진 비노출</dd></div>
        </dl>
      </section>
${cards}
      <p class="note">읽은 진도와 화면 배율은 이 브라우저에만 저장된다. 다른 기기에서는 따로 쌓인다.</p>
    </div>
  </div>
</main>
</div>
<button type="button" class="burger" aria-label="목록 열기">☰</button>
<script>
(function(){
  var cards=[].slice.call(document.querySelectorAll('.st-card'));
  var navs=[].slice.call(document.querySelectorAll('.nav-item'));
  var groups=[].slice.call(document.querySelectorAll('.vgroup'));
  var stages=[].slice.call(document.querySelectorAll('.nav-stage'));
  var filter=document.querySelector('.filter');
  var empty=document.querySelector('.nav-empty');
  var pos=document.querySelector('.topbar .pos');
  var side=document.querySelector('.side');
  var scrim=document.querySelector('.scrim');
  var NS='it-2026-09-05:';

  // ── 읽은 진도 : 학습자료 페이지들과 같은 오리진이라 그 기록을 그대로 읽을 수 있다
  var best=null;
  cards.forEach(function(c){
    var total=+c.getAttribute('data-total')||0, seen=0;
    try{
      var raw=localStorage.getItem(NS+c.getAttribute('data-key'));
      if(raw){
        var o=JSON.parse(raw);
        if(o&&Array.isArray(o.seen)) seen=o.seen.length;
        if(o&&o.last&&seen&&(!best||seen>best.seen)) best={card:c,seen:seen,total:total,last:o.last};
      }
    }catch(e){}
    if(!total||!seen) return;
    var p=Math.min(100,Math.round(seen/total*100));
    c.querySelector('.bar i').style.width=p+'%';
    c.querySelector('.pct').textContent=p+'%';
    if(p>=100) c.classList.add('done');
  });
  if(best){
    var r=document.querySelector('.resume');
    r.classList.add('on');
    var a=r.querySelector('a');
    a.href=best.card.getAttribute('href')+'#'+best.last;
    a.querySelector('b').textContent=best.card.querySelector('b').textContent;
    a.querySelector('em').textContent=best.seen+' / '+best.total+' 읽음';
  }

  // ── 필터 : 사이드바와 카드를 같이 걸러 낸다
  function apply(){
    var q=filter.value.trim().toLowerCase(), n=0;
    cards.forEach(function(c){
      var hit=!q||c.getAttribute('data-text').indexOf(q)>-1;
      c.classList.toggle('hide',!hit); if(hit) n++;
    });
    navs.forEach(function(a){
      a.classList.toggle('hide',!(!q||a.getAttribute('data-text').indexOf(q)>-1));
    });
    groups.forEach(function(g){ g.classList.toggle('hide',!g.querySelector('.st-card:not(.hide)')); });
    stages.forEach(function(s){ s.classList.toggle('hide',!s.querySelector('.nav-item:not(.hide)')); });
    empty.classList.toggle('hide',n>0);
    pos.textContent=q?(n+' / '+cards.length):'';
  }
  filter.addEventListener('input',apply);
  document.addEventListener('keydown',function(e){
    if(e.key==='/'&&document.activeElement!==filter){ e.preventDefault(); filter.focus(); filter.select(); }
    else if(e.key==='Escape'&&document.activeElement===filter){ filter.value=''; apply(); filter.blur(); }
  });

  // ── 화면 배율 : 학습자료 페이지와 같은 키를 써서 설정이 이어진다
  var ZK=NS+'zoom', ZS=[1,1.25,1.5,1.75], z=1.5;
  try{ var zz=parseFloat(localStorage.getItem(ZK)); if(ZS.indexOf(zz)>-1) z=zz; }catch(e){}
  var zb=document.querySelector('.zoom');
  function narrow(){ document.documentElement.classList.toggle('narrow', window.innerWidth/z<900); }
  function applyZoom(){ document.documentElement.style.setProperty('--zoom',z); zb.textContent=Math.round(z*100)+'%';
    try{ localStorage.setItem(ZK,z); }catch(e){} narrow(); }
  zb.addEventListener('click',function(){ z=ZS[(ZS.indexOf(z)+1)%ZS.length]; applyZoom(); });
  window.addEventListener('resize',narrow);
  applyZoom();

  // ── 모바일 서랍
  var burger=document.querySelector('.burger');
  function drawer(on){ side.classList.toggle('open',on); scrim.classList.toggle('on',on); }
  burger.addEventListener('click',function(){ drawer(!side.classList.contains('open')); });
  scrim.addEventListener('click',function(){ drawer(false); });
})();
</script>
</body></html>
`;
}
