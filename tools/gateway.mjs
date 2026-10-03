// 게이트웨이(색인) 페이지 — 실제 학습자료 페이지와 같은 토큰·클래스·조작감을 쓴다.
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { VENDORS, KINDS } from './vendors.mjs';

// 학습자료 파이프라인의 폰트(IBM Plex Mono, base64)를 그대로 심는다. 없으면 시스템 폴백.
const fontsCss = (() => {
  try {
    const p = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'IT-2026-09-05-v2', 'pipeline', 'fonts.css');
    return existsSync(p) ? readFileSync(p, 'utf8') : '';
  } catch { return ''; }
})();

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

const CSS = `${fontsCss}
:root{
  color-scheme:light;
  /* Mintlify 표준 라이트 — 흰 바탕·슬레이트 글자·시맨틱 액센트(기본값) */
  --bg:#ffffff; --bg-deep:#ffffff; --surface:#ffffff; --surface-2:#f3f5f7;
  --line:#e4e7ec; --line-2:#d0d5dd;
  --fg:#101828; --fg-dim:#344054; --muted:#667085; --faint:#98a2b3;
  --primary:#16a34a; --primary-ink:#15803d;
  --blue:#2563eb; --cyan:#3b82f6; --magenta:#16a34a;
  --green:#16a34a; --orange:#b54708; --yellow:#b54708; --red:#d92d20;
  --info-bg:#eff6ff; --info-bd:#bfdbfe; --tip-bg:#f0fdf4; --tip-bd:#bbf7d0;
  --mono:"IBM Plex Mono",ui-monospace,SFMono-Regular,Menlo,Consolas,"Malgun Gothic","맑은 고딕",monospace;
  --sans:"Inter",-apple-system,BlinkMacSystemFont,"Segoe UI","Malgun Gothic","맑은 고딕",system-ui,sans-serif;
}
:root[data-theme="dark"]{
  color-scheme:dark;
  /* Mintlify식 다크 */
  --bg:#0d1117; --bg-deep:#0d1117; --surface:#161b22; --surface-2:#1c2128;
  --line:#2a3139; --line-2:#3d444d;
  --fg:#e8ecf1; --fg-dim:#b6bec9; --muted:#8b949e; --faint:#6e7681;
  --primary:#3fb950; --primary-ink:#3fb950;
  --blue:#58a6ff; --cyan:#79c0ff; --magenta:#3fb950; --green:#3fb950;
  --mono:"IBM Plex Mono",ui-monospace,SFMono-Regular,Menlo,Consolas,"Malgun Gothic","맑은 고딕",monospace;
  --sans:"Inter",-apple-system,BlinkMacSystemFont,"Segoe UI","Malgun Gothic","맑은 고딕",system-ui,sans-serif;
}
*{box-sizing:border-box}
html,body{margin:0;padding:0;height:100%}
body{background:var(--bg);color:var(--fg-dim);font-family:var(--sans);font-size:14px;line-height:1.6875;
  word-break:keep-all;
  -webkit-font-smoothing:antialiased;text-rendering:optimizeLegibility}
a{color:inherit}
::selection{background:color-mix(in srgb,var(--blue) 28%,transparent)}
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
.theme{all:unset;cursor:pointer;margin-left:8px;padding:2px 8px;border:1px solid var(--line-2);border-radius:5px;
  color:var(--muted);font-family:var(--mono);font-size:12px;line-height:1.6;white-space:nowrap}
.theme:hover{color:var(--fg);border-color:var(--blue)}
.search-btn{all:unset;cursor:pointer;margin-left:auto;display:flex;align-items:center;gap:8px;
  padding:4px 6px 4px 10px;border:1px solid var(--line-2);border-radius:7px;color:var(--muted);
  font-family:var(--mono);font-size:12px;white-space:nowrap}
.search-btn:hover{color:var(--fg);border-color:var(--blue)}
.search-btn kbd{margin:0}
.skip{position:fixed;left:12px;top:-60px;z-index:99;padding:8px 14px;background:var(--surface-2);
  border:1px solid var(--blue);border-radius:8px;color:var(--fg);text-decoration:none;font-size:13px;
  transition:top .15s ease}
.skip:focus{top:12px}
:focus-visible{outline:2px solid var(--blue);outline-offset:2px}

/* ── 사이드바 ── */
.side{width:300px;flex:0 0 300px;background:var(--bg-deep);border-right:1px solid var(--line);
  display:flex;flex-direction:column;min-height:0}
.side-head{padding:16px 14px 12px;border-bottom:1px solid var(--line)}
.brand{display:block;font-weight:600;font-size:14px;text-decoration:none;letter-spacing:-.01em;color:var(--fg)}
.side-head .meta{margin:3px 0 10px;font-size:11.5px;color:var(--faint);font-family:var(--mono)}
.filter{width:100%;background:var(--surface-2);border:1px solid var(--line-2);border-radius:7px;
  color:var(--fg);font-family:var(--sans);font-size:13px;padding:7px 10px;outline:none}
.filter::placeholder{color:var(--faint)}
.filter:focus{border-color:var(--blue);box-shadow:0 0 0 3px color-mix(in srgb,var(--blue) 14%,transparent)}
.filter.hero{max-width:520px;margin:0 0 20px;font-size:14px;padding:10px 14px;border-radius:9px}
.tree{flex:1;overflow-y:auto;padding:10px 8px 60px;min-height:0}
.nav-stage{margin-bottom:12px}
.nav-stage+.nav-stage{border-top:1px solid var(--line);padding-top:12px}
.nav-stage-t{display:flex;align-items:baseline;gap:8px;width:100%;padding:6px 8px;font-size:11px;font-weight:500;
  color:var(--faint);letter-spacing:.06em;font-family:var(--mono);
  background:none;border:0;border-radius:6px;text-align:left;cursor:pointer}
.nav-stage-t:hover{color:var(--fg)}
.nav-stage-t .nm{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.cx{flex:0 0 9px;font-size:11px;line-height:1;color:var(--faint);
  transition:transform .15s ease;transform:rotate(90deg)}
.nav-stage-t:hover .cx,.vh:hover .cx{color:var(--fg)}
.nav-stage.collapsed .nav-stage-t .cx{transform:none}
.nav-stage.collapsed .nav-item{display:none}
/* 검색 중에는 접어 둔 묶음도 결과를 보여 준다 — 안 그러면 "없다"고 오해한다 */
body.searching .nav-stage.collapsed .nav-item:not(.hide){display:flex}
.sn{font-family:var(--mono);font-size:12px;font-weight:500;color:var(--faint)}
.nav-item{display:flex;align-items:baseline;gap:8px;padding:5px 8px 5px 12px;font-size:14px;
  color:var(--fg-dim);text-decoration:none;border-radius:6px;line-height:1.5;cursor:pointer}
.nav-item:hover{background:transparent;color:var(--fg)}
.nav-item .nid{font-family:var(--mono);font-size:10px;color:var(--faint);flex:0 0 auto;margin-left:auto}
.nav-item.hide,.nav-stage.hide{display:none}
.nav-empty{padding:14px 12px;font-size:12.5px;color:var(--faint)}
.nav-empty.hide{display:none}

/* ── 본문 ── */
.main{flex:1;min-width:0;display:flex;flex-direction:column}
.topbar{position:relative;height:44px;flex:0 0 44px;display:flex;align-items:center;gap:12px;padding:0 22px;
  border-bottom:1px solid var(--line);background:color-mix(in srgb,var(--bg) 86%,transparent);backdrop-filter:blur(8px);
  font-size:12.5px;color:var(--muted);font-family:var(--mono)}
.topbar .crumb{font-weight:500;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;min-width:0}
.topbar .pos{margin-left:auto;color:var(--faint);flex:0 0 auto}
.topbar .keys{flex:0 0 auto}
.topbar kbd{font-family:var(--mono);font-size:10.5px;background:var(--surface-2);border:1px solid var(--line-2);
  border-bottom-width:2px;border-radius:4px;padding:1px 5px;color:var(--muted)}
.scroll{flex:1;overflow-y:auto;min-height:0;scroll-behavior:smooth}
.wrap{max-width:660px;margin:0 auto;padding:44px 28px 120px}

/* ── 표지 ── */
.eyebrow{margin:0 0 10px;font-size:12px;color:var(--muted);font-weight:600;letter-spacing:.06em;
  text-transform:uppercase;font-family:var(--mono)}
h1{margin:0;font-size:32px;line-height:1.2;letter-spacing:-.02em;font-weight:500;text-wrap:balance}
.stats{display:flex;flex-wrap:wrap;gap:10px;margin:22px 0 26px}
.stat{display:flex;align-items:baseline;gap:6px;padding:7px 12px;background:var(--surface);
  border:1px solid var(--line);border-radius:8px;font-size:12px;color:var(--muted)}
.stat b{font-family:var(--mono);font-size:15px;color:var(--fg);font-weight:600}

.panel{padding:18px 20px;background:var(--surface);border:1px solid var(--line);border-radius:12px;margin-bottom:34px}
.panel .lead{margin:0 0 14px;font-size:14px;color:var(--fg-dim);line-height:1.6875;text-wrap:pretty}
.kv{display:flex;flex-wrap:wrap;gap:10px 26px;margin:0}
.kv>div{display:flex;align-items:baseline;gap:8px}
.kv dt{font-size:10.5px;font-weight:500;color:var(--faint);letter-spacing:.06em;white-space:nowrap;
  text-transform:uppercase;font-family:var(--mono)}
.kv dd{margin:0;font-size:13px;color:var(--fg-dim)}

/* 이어서 읽기 — 가장 많이 읽어 둔 자료로 한 번에 돌아간다 */
.resume{display:none;margin:0 0 26px}
.resume.on{display:block}
.resume a{display:flex;align-items:center;gap:12px;padding:13px 16px;text-decoration:none;
  background:var(--surface);border:1px solid color-mix(in srgb,var(--blue) 35%,transparent);border-radius:10px}
.resume a:hover{border-color:var(--blue);background:var(--surface-2)}
.resume .tag{font-family:var(--mono);font-size:10px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;
  color:var(--blue);flex:0 0 auto}
.resume b{font-size:14.5px;font-weight:700;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.resume em{font-style:normal;margin-left:auto;font-family:var(--mono);font-size:11.5px;color:var(--faint);flex:0 0 auto}

/* ── 벤더 묶음 ── */
.vgroup{margin:0 0 38px;scroll-margin-top:20px}
.vgroup.hide{display:none}
.vh{display:flex;align-items:center;gap:10px;width:100%;margin:0 0 3px;padding:4px 6px 4px 0;
  background:none;border:0;color:inherit;font-family:inherit;text-align:left;cursor:pointer;border-radius:8px}
.vh:hover{background:transparent}
.vh h2{margin:0;font-size:17px;font-weight:600;letter-spacing:-.015em}
.vh .vn{margin-left:auto;font-family:var(--mono);font-size:11.5px;color:var(--faint);
  background:var(--surface);border:1px solid var(--line);border-radius:5px;padding:2px 7px}
.vgroup.collapsed .vh .cx{transform:none}
.vgroup.collapsed .vsub{display:none}
.vgroup.collapsed .stage-grid{display:none}
.vgroup.collapsed{margin-bottom:10px}
body.searching .vgroup.collapsed .stage-grid{display:grid}
body.searching .vgroup.collapsed .vsub{display:block}
.vsub{margin:0 0 14px 29px;font-size:12.5px;color:var(--muted)}
/* 벤더 안의 소분류 — 서비스·제품 / 공인 자격증 */
.kpart{margin:0 0 20px}
.kpart:last-child{margin-bottom:0}
.kpart.hide{display:none}
.kh{display:flex;align-items:center;gap:9px;margin:0 0 9px 2px;font-family:var(--mono);font-size:10.5px;
  font-weight:600;letter-spacing:.07em;text-transform:uppercase;color:var(--muted)}
.kh .kc{font-weight:400;color:var(--faint)}
.kh::after{content:"";flex:1;height:1px;background:var(--line)}
.vgroup.collapsed .kpart{display:none}
body.searching .vgroup.collapsed .kpart{display:block}
.nav-kgrp.hide{display:none}
.nav-kh{margin:7px 0 2px 12px;font-family:var(--mono);font-size:10px;font-weight:600;
  letter-spacing:.06em;text-transform:uppercase;color:var(--faint)}
.nav-stage.collapsed .nav-kh{display:none}
body.searching .nav-stage.collapsed .nav-kh{display:block}

/* 모두 접기·펴기 */
.foldall{display:flex;gap:6px;margin:0 0 18px}
.foldall button{all:unset;cursor:pointer;padding:4px 10px;border:1px solid var(--line-2);border-radius:6px;
  color:var(--muted);font-family:var(--mono);font-size:11px}
.foldall button:hover{color:var(--fg);border-color:var(--blue)}
.side-foldall{all:unset;cursor:pointer;float:right;color:var(--faint);font-family:var(--sans);font-size:11px;margin-top:4px;padding:2px 6px;border:1px solid var(--line);border-radius:6px}
.side-foldall:hover{color:var(--fg);border-color:var(--blue)}
.stage-grid{display:grid;gap:8px}
.st-card{display:flex;align-items:flex-start;gap:12px;padding:14px 16px;background:var(--surface);
  border:1px solid var(--line);border-radius:10px;text-decoration:none;transition:border-color .12s,background .12s}
.st-card:hover{border-color:var(--blue);background:var(--surface-2);transform:translateY(-1px)}
.st-card.hide{display:none}
.st-card .sn{margin-top:3px}
.st-body{display:flex;flex-direction:column;gap:3px;min-width:0;flex:1}
.st-body b{display:flex;align-items:center;gap:8px;font-size:15px;font-weight:600;letter-spacing:-.01em}
.st-body b::after{content:"↗";font-size:11px;color:var(--faint);font-weight:400}
.st-card:hover .st-body b::after{color:var(--fg)}
/* ── Mintlify 테마 ── */
.nav-item:hover{background:var(--surface-2);color:var(--fg)}
h1{font-weight:700}
.st-card{background:var(--surface)}
.st-card:hover{border-color:var(--line-2);box-shadow:0 6px 18px rgba(16,24,40,.08)}
/* ── Mintlify full-fidelity ── */
.side-head .meta,.pos,.topbar,.topbar kbd,.search-btn,.search-btn kbd,.nav-item .nid,.sn{font-family:var(--sans)}
body{zoom:1;font-size:16px}
.app{height:100vh}
html.narrow .side{height:100vh}
.zoom{display:none}
:root{--sans:"Inter","Pretendard Variable","Pretendard",-apple-system,BlinkMacSystemFont,"Segoe UI","Malgun Gothic","맑은 고딕",system-ui,sans-serif}
.st-body em{font-style:normal;font-size:12.5px;color:var(--muted);line-height:1.6}
.st-n{font-family:var(--mono);font-size:11.5px;color:var(--faint);flex:0 0 auto;
  display:flex;flex-direction:column;align-items:flex-end;gap:5px;padding-top:2px}
/* 읽은 비율 — 각 토픽 페이지가 localStorage 에 남긴 기록을 그대로 읽는다 */
.bar{display:none;width:54px;height:3px;border-radius:2px;background:var(--line-2);overflow:hidden}
.st-card.read .bar{display:block}
.bar i{display:block;height:100%;width:0;background:var(--blue);border-radius:2px}
.st-card.done .bar i{background:var(--green)}
.pct{font-size:10px;color:var(--faint)}
.st-card.done .pct{color:var(--green)}

.note{margin-top:26px;padding-top:18px;border-top:1px solid var(--line);
  font-size:12.5px;color:var(--faint);line-height:1.7}
.zq{font-size:12px;color:var(--faint);line-height:1.7}

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
  width:50px;height:50px;border-radius:14px;background:var(--blue);color:var(--bg);border:0;
  font-size:19px;cursor:pointer;box-shadow:0 8px 24px rgba(0,0,0,.5)}
@media print{ .side,.topbar,.burger,.scrim,.resume,.skip,.search-btn{display:none!important}
  .app,.scroll{display:block;height:auto;overflow:visible} body{background:#fff;color:#111;zoom:1} }
`;

export function renderGateway({ topics, noindex, updated }) {
  // 벤더별로 묶고 정의된 순서대로 늘어놓는다. 해당 토픽이 없는 벤더는 뺀다.
  // 벤더 안에서 다시 서비스·제품 / 공인 자격증으로 가른다.
  // 한 종류뿐인 벤더는 소분류 라벨 없이 예전처럼 한 덩어리로 그린다.
  const groups = VENDORS
    .map((v) => {
      const items = topics.filter((t) => t.vendor === v.id);
      const parts = KINDS
        .map((k) => ({ ...k, items: items.filter((t) => t.kind === k.id) }))
        .filter((p) => p.items.length);
      return { ...v, items, parts, split: parts.length > 1 };
    })
    .filter((g) => g.items.length);

  const totalItems = topics.reduce((n, t) => n + (t.items || 0), 0);

  const navItem = (g, t) => `        <a class="nav-item" href="${t.href}" data-text="${esc((t.title + ' ' + g.name).toLowerCase())}">${esc(t.title)}<span class="nid">${t.items || ''}</span></a>`;

  const nav = groups.map((g, gi) => `    <div class="nav-stage" data-v="${g.id}">
      <button type="button" class="nav-stage-t" aria-expanded="true"><span class="cx">▸</span><span class="nm">${esc(g.name)}</span></button>
${g.parts.map((p) => `      <div class="nav-kgrp" data-k="${p.id}">
${g.split ? `        <p class="nav-kh">${esc(p.name)}</p>\n` : ''}${p.items.map((t) => navItem(g, t)).join('\n')}
      </div>`).join('\n')}
    </div>`).join('\n');

  const card = (g, p, t, i) => `            <a class="st-card" href="${t.href}" data-key="${esc(t.key)}" data-total="${t.items || 0}" data-text="${esc((t.title + ' ' + g.name + ' ' + p.name + ' ' + t.lead).toLowerCase())}"><span class="st-body"><b>${esc(t.title)}</b><em>${esc(t.lead)}</em></span><span class="st-n"><span>${t.items || '?'}항목</span><span class="bar"><i></i></span><span class="pct"></span></span></a>`;

  const cards = groups.map((g, gi) => `      <section class="vgroup" id="v-${g.id}" data-v="${g.id}">
        <button type="button" class="vh" aria-expanded="true"><span class="cx">▸</span><h2>${esc(g.name)}</h2><span class="vn">${g.items.length}</span></button>
        <p class="vsub">${esc(g.sub)}</p>
${g.parts.map((p) => `        <div class="kpart" data-k="${p.id}">
${g.split ? `          <p class="kh"><span class="kn">${esc(p.name)}</span><span class="kc">${p.items.length}</span></p>\n` : ''}          <div class="stage-grid">
${p.items.map((t, i) => card(g, p, t, i)).join('\n')}
          </div>
        </div>`).join('\n')}
      </section>`).join('\n');

  return `<!doctype html>
<html lang="ko"><head><meta charset="utf-8">${noindex}
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="dark light">
<title>IT 학습자료</title>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css">
<style>${CSS}</style></head>
<body>
<a class="skip" href="#top">본문으로 건너뛰기</a>
<div class="scrim"></div>
<div class="app">
<aside class="side">
  <div class="side-head">
    <a class="brand" href="#top">IT 학습자료</a><button type="button" class="side-foldall">모두 접기</button>
  </div>
  <nav class="tree">
${nav}
    <p class="nav-empty hide">일치하는 토픽이 없습니다.</p>
  </nav>
</aside>
<main class="main">
  <div class="topbar"><span class="pos"></span>
    <button type="button" class="search-btn" title="검색 (Ctrl/⌘+K)">검색 <kbd>⌘K</kbd></button>
    <button type="button" class="theme" title="테마 전환 (다크/라이트)">☾</button></div>
  <div class="scroll">
    <div class="wrap" id="top">
      <p class="eyebrow">벤더별 색인</p>
      <h1>IT 학습자료</h1>
      <div class="stats"><span class="stat"><b>${topics.length}</b>토픽</span><span class="stat"><b>${groups.length}</b>벤더</span><span class="stat"><b>${totalItems.toLocaleString('en-US')}</b>항목</span></div>
      <div class="resume"><a href="#"><span class="tag">이어서 읽기</span><b></b><em></em></a></div>
      <section class="panel">
        <p class="lead">공식 문서를 근거로 만든 IT 학습자료 모음이다. 만든 회사·재단 기준으로 묶고, 그 안에서 다시 서비스·제품과 공인 자격증으로 갈랐다. 카드를 누르면 해당 자료로 바로 넘어간다. 읽은 진도는 각 자료가 이 브라우저에 남긴 기록을 그대로 읽어 표시한다.</p>
        <dl class="kv">
          <div><dt>분류</dt><dd>벤더 → 서비스 · 자격증</dd></div>
          <div><dt>갱신</dt><dd>${updated}</dd></div>
          <div><dt>색인</dt><dd>검색엔진 비노출</dd></div>
        </dl>
      </section>
      <div class="foldall"><button type="button" data-all="open">모두 펴기</button><button type="button" data-all="close">모두 접기</button></div>
      <input class="filter hero" type="text" placeholder="토픽 검색…" spellcheck="false" aria-label="토픽 검색">
${cards}
      <p class="note">읽은 진도와 화면 배율은 이 브라우저에만 저장된다. 다른 기기에서는 따로 쌓인다.</p>
      <p class="zq"></p>
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
  var kparts=[].slice.call(document.querySelectorAll('.kpart'));
  var kgrps=[].slice.call(document.querySelectorAll('.nav-kgrp'));
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
    c.classList.add('read');
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

  // ── 접기·펴기 : 사이드바와 본문이 각자 기억한다
  var FK=NS+'gw-fold', fold={nav:[],main:[]};
  try{ var fr=JSON.parse(localStorage.getItem(FK)||'null');
    if(fr&&typeof fr==='object'){ fold.nav=fr.nav||[]; fold.main=fr.main||[]; } }catch(e){}
  function saveFold(){ try{ localStorage.setItem(FK,JSON.stringify(fold)); }catch(e){} }
  function paintFold(){
    stages.forEach(function(s){ s.classList.toggle('collapsed',fold.nav.indexOf(s.getAttribute('data-v'))>-1);
      s.querySelector('.nav-stage-t').setAttribute('aria-expanded',!s.classList.contains('collapsed')); });
    groups.forEach(function(g){ g.classList.toggle('collapsed',fold.main.indexOf(g.getAttribute('data-v'))>-1);
      g.querySelector('.vh').setAttribute('aria-expanded',!g.classList.contains('collapsed')); });
    var allNav=fold.nav.length===stages.length;
    document.querySelector('.side-foldall').textContent=allNav?'모두 펴기':'모두 접기';
  }
  function toggle(where,id){
    var i=fold[where].indexOf(id);
    if(i>-1) fold[where].splice(i,1); else fold[where].push(id);
    saveFold(); paintFold();
  }
  stages.forEach(function(s){
    s.querySelector('.nav-stage-t').addEventListener('click',function(){ toggle('nav',s.getAttribute('data-v')); });
  });
  groups.forEach(function(g){
    g.querySelector('.vh').addEventListener('click',function(){ toggle('main',g.getAttribute('data-v')); });
  });
  document.querySelector('.side-foldall').addEventListener('click',function(){
    fold.nav = fold.nav.length===stages.length ? [] : stages.map(function(s){ return s.getAttribute('data-v'); });
    saveFold(); paintFold();
  });
  [].slice.call(document.querySelectorAll('.foldall button')).forEach(function(b){
    b.addEventListener('click',function(){
      fold.main = b.getAttribute('data-all')==='close' ? groups.map(function(g){ return g.getAttribute('data-v'); }) : [];
      saveFold(); paintFold();
    });
  });
  paintFold();

  // ── 필터 : 사이드바와 카드를 같이 걸러 낸다
  var ZQKEY=NS+'hub:zq', lastZq='';
  function logZq(q){
    q=(q||'').trim(); if(!q||q===lastZq) return; lastZq=q;
    try{ var a=JSON.parse(localStorage.getItem(ZQKEY)||'[]'); if(a[0]!==q){ a=[q].concat(a).slice(0,6); localStorage.setItem(ZQKEY,JSON.stringify(a)); } }catch(e){}
  }
  function paintZq(){
    var box=document.querySelector('.zq');
    if(!box) return;
    try{
      var a=JSON.parse(localStorage.getItem(ZQKEY)||'[]');
      box.textContent=a.length?('최근 못 찾은 검색: '+a.join(', ')):'';
    }catch(e){ box.textContent=''; }
  }
  function apply(){
    var q=filter.value.trim().toLowerCase(), n=0;
    document.body.classList.toggle('searching',!!q);
    cards.forEach(function(c){
      var hit=!q||c.getAttribute('data-text').indexOf(q)>-1;
      c.classList.toggle('hide',!hit); if(hit) n++;
    });
    navs.forEach(function(a){
      a.classList.toggle('hide',!(!q||a.getAttribute('data-text').indexOf(q)>-1));
    });
    kparts.forEach(function(k){ k.classList.toggle('hide',!k.querySelector('.st-card:not(.hide)')); });
    kgrps.forEach(function(k){ k.classList.toggle('hide',!k.querySelector('.nav-item:not(.hide)')); });
    groups.forEach(function(g){ g.classList.toggle('hide',!g.querySelector('.st-card:not(.hide)')); });
    stages.forEach(function(s){ s.classList.toggle('hide',!s.querySelector('.nav-item:not(.hide)')); });
    empty.classList.toggle('hide',n>0);
    pos.textContent=q?(n+' / '+cards.length):'';
    if(q&&n===0) logZq(q);
  }
  filter.addEventListener('input',apply);
  var sbtn=document.querySelector('.search-btn');
  if(sbtn) sbtn.addEventListener('click',function(){ filter.focus(); filter.select(); });
  document.addEventListener('keydown',function(e){
    if((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==='k'){ e.preventDefault(); filter.focus(); filter.select(); }
    else if(e.key==='/'&&document.activeElement!==filter){ e.preventDefault(); filter.focus(); filter.select(); }
    else if(e.key==='Escape'&&document.activeElement===filter){ filter.value=''; apply(); filter.blur(); }
  });

  function narrow(){ document.documentElement.classList.toggle('narrow', window.innerWidth<1024); }
  window.addEventListener('resize',narrow);
  narrow();

  // ── 테마 전환 : 학습자료 페이지와 같은 키를 써서 설정이 이어진다
  var TK=NS+'theme', tb=document.querySelector('.theme'), th='dark';
  try{ th=localStorage.getItem(TK)||'light'; }catch(e){}
  function applyTheme(){ document.documentElement.dataset.theme=th; if(tb) tb.textContent=th==='light'?'☀':'☾'; }
  if(tb) tb.addEventListener('click',function(){ th=th==='light'?'dark':'light';
    try{ localStorage.setItem(TK,th); }catch(e){} applyTheme(); });
  applyTheme();

  // ── 모바일 서랍
  var burger=document.querySelector('.burger');
  function drawer(on){ side.classList.toggle('open',on); scrim.classList.toggle('on',on); }
  burger.addEventListener('click',function(){ drawer(!side.classList.contains('open')); });
  scrim.addEventListener('click',function(){ drawer(false); });
  paintZq();
})();
</script>
</body></html>
`;
}
