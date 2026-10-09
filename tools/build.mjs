// 소스 out/ 폴더들을 훑어 최신본만 골라 랜덤 해시 경로로 배치한다.
// 재실행해도 기존 슬러그는 slugs.json 에서 그대로 재사용된다.
import { readdirSync, statSync, readFileSync, writeFileSync, mkdirSync, rmSync, existsSync } from 'node:fs';
import { randomBytes } from 'node:crypto';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { vendorOf, kindOf } from './vendors.mjs';
import { renderGateway } from './gateway.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
// NB_LANG=en 로 영문 책을 배치한다. 소스 폴더·슬러그 버킷·출력 경로만 갈라지고,
// 페이지 HTML 은 원본 그대로 복사한다. 한국어 폴더(p/,h/)와 영문 폴더(en/p,en/h)는 겹치지 않는다.
const LANG = String(process.env.NB_LANG || 'ko').toLowerCase() === 'en' ? 'en' : 'ko';
const SUB = LANG === 'en' ? 'en' : '';
const SOURCES = LANG === 'en'
  ? ['C:/Users/user/Downloads/it-course-pipeline-eng/out']
  : ['C:/Users/user/Downloads/it-course-pipeline/out'];
const PAGES_KEY = LANG === 'en' ? 'pagesEn' : 'pages';
const HUB_KEY = LANG === 'en' ? 'hubEn' : 'hub';
const outDir = (...p) => (SUB ? join(ROOT, SUB, ...p) : join(ROOT, ...p));

// 같은 시험의 신·구 폴더명은 하나로 합친다. 후보 중 생성일 최신본이 이긴다.
const ALIASES = new Map([
  ['Implementing_and_Administering_Cisco_Solutions_200-301_CCNA', 'CCNA_200-301'],
  ['Implementing_Cisco_Enterprise_Network_Core_Technologies_350-401_ENCOR', '350-401_ENCOR_Cisco_Enterprise_Network_Core_Technologies'],
]);

// 게이트웨이·표지에 그려질 짧은 표시명. 원본 out/은 손대지 않고 배포본에만 반영한다.
// (var TITLE 키는 그대로 둬 읽음 진도가 이어진다)
const SHORT_TITLES = {
  'CCNA_200-301': 'CCNA 200-301',
  '350-401_ENCOR_Cisco_Enterprise_Network_Core_Technologies': '350-401 ENCOR',
  '350-601_DCCOR_Cisco_Data_Center_Core_Technologies': '350-601 DCCOR',
  '350-701_SCOR_Implementing_and_Operating_Cisco_Security_Core_Technologies': '350-701 SCOR',
  'CCNA_200-201_CCNACBR_Understanding_Cisco_Cybersecurity_Operations_Fundamentals': 'CCNA 200-201',
  'FortiGate_7.6_Administrator': 'FortiGate 7.6 Administrator',
  'podman': 'Podman', // 공식 표기(https://podman.io). 키는 그대로 둬 URL·읽음 진도 유지
};
const NOINDEX =
  '<meta name="robots" content="noindex,nofollow,noarchive,nosnippet,noimageindex">' +
  '<meta name="googlebot" content="noindex,nofollow">' +
  '<meta name="referrer" content="no-referrer">';

// ── 1. 후보 수집 ────────────────────────────────────────────────
const candidates = new Map(); // normKey -> {topic, file, mtime, ver, size}

for (const src of SOURCES) {
  if (!existsSync(src)) { console.warn(`  (없음) ${src}`); continue; }
  for (const name of readdirSync(src)) {
    if (/-backup/i.test(name) || name === 'old') continue;      // 백업본 제외 (-backup-날짜형 포함. 하이픈 없는 AWS_Backup은 유지)
    const file = join(src, name, 'index.html');
    if (!existsSync(file)) continue;
    const m = name.match(/^(.*?)(?:[._]v(\d+))?$/);              // Amazon_S3_v2 -> Amazon_S3 / 2
    const key = ALIASES.get(m[1]) ?? ALIASES.get(name) ?? m[1];
    const ver = m[2] ? Number(m[2]) : 1;
    const st = statSync(join(src, name)); // 폴더 날짜가 곧 올린 시점 (index.html은 후처리로 건드려질 수 있다)
    const cur = { topic: key, file, mtime: st.mtimeMs, ver, size: statSync(file).size, src };
    const prev = candidates.get(key);
    // 최신 생성일 우선 → 동률이면 높은 버전 → 그래도 동률이면 큰 파일
    const better = !prev
      || cur.mtime > prev.mtime
      || (cur.mtime === prev.mtime && cur.ver > prev.ver)
      || (cur.mtime === prev.mtime && cur.ver === prev.ver && cur.size > prev.size);
    if (better) candidates.set(key, cur);
  }
}

const topics = [...candidates.values()].sort((a, b) => a.topic.localeCompare(b.topic, LANG === 'en' ? 'en' : 'ko'));
if (!topics.length) {
  // 영문 책이 아직 없는 동안에는 en/ 을 지우지도, 실패로 보고하지도 않는다 — 한국어 책만 있는 상태가 정상이다.
  if (LANG === 'en') {
    console.log('영문 책이 없다 — en/ 은 그대로 둔다.');
    process.exit(0);
  }
  console.error('소스에서 index.html 을 하나도 못 찾았습니다.');
  process.exit(1);
}

// ── 2. 슬러그 배정 (기존 것 유지) ───────────────────────────────
// 언어마다 버킷이 다르다. pages 를 건드리면 영문 책이 한국어 페이지 자리를 덮어쓴다.
const slugPath = join(ROOT, 'slugs.json');
const slugs = existsSync(slugPath) ? JSON.parse(readFileSync(slugPath, 'utf8')) : { hub: null, pages: {} };
slugs.pages ??= {};
slugs[PAGES_KEY] ??= {};
slugs[HUB_KEY] ??= randomBytes(9).toString('hex');
const pages = slugs[PAGES_KEY];
for (const t of topics) pages[t.topic] ??= randomBytes(8).toString('hex');
// 합병·백업 제외로 사라진 토픽의 슬러그는 함께 정리한다 (기존 키의 URL은 그대로 재사용)
for (const k of Object.keys(pages)) if (!topics.some((t) => t.topic === k)) delete pages[k];

// ── 3. 출력 ────────────────────────────────────────────────────
rmSync(outDir('p'), { recursive: true, force: true });
rmSync(outDir('h'), { recursive: true, force: true });

const inject = (html) => {
  if (/name=["']robots["']/i.test(html)) return html;
  // charset 선언은 문서 앞쪽에 그대로 두고 그 바로 뒤에 끼워 넣는다.
  const charset = html.match(/<meta\s+charset=[^>]*>/i);
  if (charset) return html.replace(charset[0], charset[0] + NOINDEX);
  return html.replace(/<head(\s[^>]*)?>/i, (m) => m + NOINDEX);
};

// 게이트웨이가 쓸 정보를 페이지에서 직접 뽑는다 — 목록과 본문이 어긋날 일이 없다.
const strip = (s) => s.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
const pick = (html, re) => (html.match(re) || [])[1];

function meta(html) {
  const stats = [...html.matchAll(/<span class="stat"><b>([^<]*)<\/b>([^<]*)<\/span>/g)]
    .reduce((o, m) => ({ ...o, [m[2].trim()]: m[1].trim() }), {});
  const lead = strip(pick(html, /<p class="lead">([\s\S]*?)<\/p>/) || '');
  // 첫 문장만. 그래도 길면 잘라서 말줄임표.
  let short = (lead.split(/(?<=[.。])\s/)[0] || lead).trim();
  if (short.length > 170) short = short.slice(0, 168).replace(/[\s,·]+\S*$/, '') + '…';
  return {
    title: strip(pick(html, /<article class="page cover"[^>]*>[\s\S]*?<h1>([\s\S]*?)<\/h1>/) || pick(html, /<title>([^<]*)<\/title>/) || ''),
    key: pick(html, /var TITLE\s*=\s*"((?:[^"\\]|\\.)*)"/) || '',
    items: Number(stats['항목'] ?? stats['items']) || 0,      // 영문 표지는 "items"
    stages: Number(stats['단계'] ?? stats['stages']) || 0,    // 영문 표지는 "stages"
    lead: short,
  };
}

// 학습자료 쪽에서도 색인으로 한 번에 돌아올 수 있게 사이드바 맨 위에 링크를 넣는다.
const BACK_CSS = '<style>.gw-back{display:block;margin:0 0 8px;font-family:var(--mono);font-size:11px;' +
  'color:var(--faint);text-decoration:none}.gw-back:hover{color:var(--blue)}</style>';
const addBackLink = (html, hub) => html
  .replace(/<\/head>/i, BACK_CSS + '</head>')
  .replace(/<a class="brand"/, `<a class="gw-back" href="../../h/${hub}/">${LANG === 'en' ? '← All English books' : '← 전체 목록'}</a><a class="brand"`);

for (const t of topics) {
  const dir = outDir('p', pages[t.topic]);
  mkdirSync(dir, { recursive: true });
  let src = readFileSync(t.file, 'utf8');
  Object.assign(t, meta(src), {
    vendor: vendorOf(t.topic).id,
    kind: kindOf(t.topic).id,
    href: `../../p/${pages[t.topic]}/`,
  });
  if (!t.title) t.title = t.topic.replace(/_/g, ' ');
  if (t.title.includes('_')) t.title = t.title.replace(/_/g, ' '); // 구 파이프라인의 밑줄 제목 보정
  if (!t.key) t.key = t.title;
  const short = SHORT_TITLES[t.topic];
  if (short) {
    t.title = short; // 게이트웨이 카드 표시명. t.key(var TITLE)는 그대로 둬 읽음 진도가 이어진다
    src = src
      .replace(/(<article class="page cover"[^>]*>[\s\S]*?<h1>)[\s\S]*?(<\/h1>)/, `$1${short}$2`)
      .replace(/(<title>)[^<]*(<\/title>)/, `$1${short}$2`);
  }
  writeFileSync(join(dir, 'index.html'), addBackLink(inject(src), slugs[HUB_KEY]));
}

const esc = (s) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const label = (s) => s.replace(/_/g, ' ');
const fmt = (ms) => { const d = new Date(ms); const z = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${z(d.getMonth() + 1)}-${z(d.getDate())}`; };  // 로컬 시각 기준

// 영문 책은 한국어 게이트웨이를 재사용하지 않는다 — 카드 UI 문구가 한국어로 새면 영문 책 목록이 반쪽 한국어가 된다.
// 각 책이 self-contained HTML 이므로 링크·개수·한 줄 요약만 잇는 얇은 목록이면 충분하다.
function renderEnHub(list, noindex, updated) {
  const cards = list.map((t) => `<li><a href="../../p/${t.slug}/">${esc(t.title)}</a>` +
    `<span class="m">${t.items} items · ${t.stages} stages · ${esc(updated)}</span>` +
    (t.lead ? `<p>${esc(t.lead)}</p>` : '') + `</li>`).join('\n');
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8">${noindex}
<title>English books</title>
<meta name="viewport" content="width=device-width,initial-scale=1">
<style>
:root{color-scheme:dark}
body{margin:0;background:#0d1117;color:#c9d1d9;font:15px/1.6 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}
main{max-width:860px;margin:0 auto;padding:40px 20px 72px}
h1{font-size:26px;margin:0 0 4px}
p.sub{color:#8b949e;margin:0 0 28px}
ul{list-style:none;padding:0;margin:0}
li{border:1px solid #21262d;border-radius:10px;padding:14px 16px;margin-bottom:10px}
a{color:#58a6ff;text-decoration:none;font-weight:600;font-size:16px}
a:hover{text-decoration:underline}
.m{display:block;color:#8b949e;font-size:12px;margin-top:2px}
li p{margin:6px 0 0;color:#b1bac4;font-size:14px}
</style></head>
<body><main>
<h1>English books</h1>
<p class="sub">${list.length} book(s) · generated from official documentation · ${esc(updated)}</p>
<ul>
${cards}
</ul>
</main></body></html>
`;
}

mkdirSync(outDir('h', slugs[HUB_KEY]), { recursive: true });
if (LANG === 'en') {
  const updated = fmt(Date.now());
  const list = topics.map((t) => ({ title: t.title, items: t.items, stages: t.stages, lead: t.lead, slug: pages[t.topic] }));
  writeFileSync(outDir('h', slugs[HUB_KEY], 'index.html'), renderEnHub(list, NOINDEX, updated));
  // en/ 루트는 항상 살아 있는 주소로 두기 위해 허브로 넘긴다 (URL이 바뀌어도 링크는 안 죽는다)
  writeFileSync(outDir('index.html'),
    `<!doctype html>\n<html lang="en"><head><meta charset="utf-8">${NOINDEX}<title>English books</title>` +
    `<meta http-equiv="refresh" content="0; url=h/${slugs[HUB_KEY]}/"></head>` +
    `<body><a href="h/${slugs[HUB_KEY]}/">English books</a></body></html>\n`);
} else {
  writeFileSync(outDir('h', slugs[HUB_KEY], 'index.html'),
    renderGateway({ topics, noindex: NOINDEX, updated: fmt(Date.now()) }));
}

// 루트/404 — 아무 정보도 링크도 없는 껍데기. 영문 배치는 한국어 루트를 건드리지 않는다.
if (LANG === 'ko') {
  const blank = `<!doctype html>
<html lang="en"><head><meta charset="utf-8">${NOINDEX}<title>404</title>
<style>body{margin:0;display:grid;place-items:center;height:100vh;background:#111;color:#555;
font:14px system-ui,sans-serif}</style></head><body>404</body></html>
`;
  writeFileSync(join(ROOT, 'index.html'), blank);
  writeFileSync(join(ROOT, '404.html'), blank);
  writeFileSync(join(ROOT, 'robots.txt'), 'User-agent: *\nDisallow: /\n');
  writeFileSync(join(ROOT, '.nojekyll'), '');
}
writeFileSync(slugPath, JSON.stringify(slugs, null, 2) + '\n');

// ── 4. 로컬 링크 목록 (git 에 안 올라감) ────────────────────────
const base = existsSync(join(ROOT, '.baseurl'))
  ? readFileSync(join(ROOT, '.baseurl'), 'utf8').trim().replace(/\/$/, '')
  : 'https://<USER>.github.io/<REPO>';
const links = [
  `# ${LANG === 'en' ? 'Link list (EN)' : '링크 목록'} (${fmt(Date.now())})`, '',
  `${LANG === 'en' ? 'Hub' : '허브'}: ${base}/${SUB ? SUB + '/' : ''}h/${slugs[HUB_KEY]}/`, '',
  ...topics.map((t) => `- ${label(t.topic)}\n  ${base}/${SUB ? SUB + '/' : ''}p/${pages[t.topic]}/`),
].join('\n') + '\n';
writeFileSync(outDir('LINKS.md'), links);

console.log(LANG === 'en'
  ? `영문 토픽 ${topics.length}개 배치 완료`
  : `토픽 ${topics.length}개 배치 완료`);
for (const t of topics) console.log(`  ${fmt(t.mtime)}  ${t.topic.padEnd(56)} <- ${t.src.split('/').slice(-2)[0]}`);
console.log(`\n${LANG === 'en' ? '영문 허브' : '허브'}: ${base}/${SUB ? SUB + '/' : ''}h/${slugs[HUB_KEY]}/`);
