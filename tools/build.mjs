// 소스 out/ 폴더들을 훑어 최신본만 골라 랜덤 해시 경로로 배치한다.
// 재실행해도 기존 슬러그는 slugs.json 에서 그대로 재사용된다.
import { readdirSync, statSync, readFileSync, writeFileSync, mkdirSync, rmSync, existsSync } from 'node:fs';
import { randomBytes } from 'node:crypto';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { vendorOf } from './vendors.mjs';
import { renderGateway } from './gateway.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SOURCES = [
  'C:/Users/user/Downloads/IT-2026-09-05-v2/out',
  'C:/Users/user/Downloads/IT-eli5/out',
];

const NOINDEX =
  '<meta name="robots" content="noindex,nofollow,noarchive,nosnippet,noimageindex">' +
  '<meta name="googlebot" content="noindex,nofollow">' +
  '<meta name="referrer" content="no-referrer">';

// ── 1. 후보 수집 ────────────────────────────────────────────────
const candidates = new Map(); // normKey -> {topic, file, mtime, ver, size}

for (const src of SOURCES) {
  if (!existsSync(src)) { console.warn(`  (없음) ${src}`); continue; }
  for (const name of readdirSync(src)) {
    if (/-backup$/i.test(name) || name === 'old') continue;      // 백업본 제외
    const file = join(src, name, 'index.html');
    if (!existsSync(file)) continue;
    const m = name.match(/^(.*?)(?:[._]v(\d+))?$/);              // Amazon_S3_v2 -> Amazon_S3 / 2
    const key = m[1];
    const ver = m[2] ? Number(m[2]) : 1;
    const st = statSync(file);
    const cur = { topic: key, file, mtime: st.mtimeMs, ver, size: st.size, src };
    const prev = candidates.get(key);
    // 최신 생성일 우선 → 동률이면 높은 버전 → 그래도 동률이면 큰 파일
    const better = !prev
      || cur.mtime > prev.mtime
      || (cur.mtime === prev.mtime && cur.ver > prev.ver)
      || (cur.mtime === prev.mtime && cur.ver === prev.ver && cur.size > prev.size);
    if (better) candidates.set(key, cur);
  }
}

const topics = [...candidates.values()].sort((a, b) => a.topic.localeCompare(b.topic, 'ko'));
if (!topics.length) { console.error('소스에서 index.html 을 하나도 못 찾았습니다.'); process.exit(1); }

// ── 2. 슬러그 배정 (기존 것 유지) ───────────────────────────────
const slugPath = join(ROOT, 'slugs.json');
const slugs = existsSync(slugPath) ? JSON.parse(readFileSync(slugPath, 'utf8')) : { hub: null, pages: {} };
slugs.hub ??= randomBytes(9).toString('hex');
for (const t of topics) slugs.pages[t.topic] ??= randomBytes(8).toString('hex');

// ── 3. 출력 ────────────────────────────────────────────────────
for (const d of ['p', 'h']) rmSync(join(ROOT, d), { recursive: true, force: true });

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
    items: Number(stats['항목']) || 0,
    stages: Number(stats['단계']) || 0,
    lead: short,
  };
}

// 학습자료 쪽에서도 색인으로 한 번에 돌아올 수 있게 사이드바 맨 위에 링크를 넣는다.
const BACK_CSS = '<style>.gw-back{display:block;margin:0 0 8px;font-family:var(--mono);font-size:11px;' +
  'color:var(--faint);text-decoration:none}.gw-back:hover{color:var(--blue)}</style>';
const addBackLink = (html, hub) => html
  .replace(/<\/head>/i, BACK_CSS + '</head>')
  .replace(/<a class="brand"/, `<a class="gw-back" href="../../h/${hub}/">← 전체 목록</a><a class="brand"`);

for (const t of topics) {
  const dir = join(ROOT, 'p', slugs.pages[t.topic]);
  mkdirSync(dir, { recursive: true });
  const src = readFileSync(t.file, 'utf8');
  Object.assign(t, meta(src), {
    vendor: vendorOf(t.topic).id,
    href: `../../p/${slugs.pages[t.topic]}/`,
  });
  if (!t.title) t.title = t.topic.replace(/_/g, ' ');
  if (!t.key) t.key = t.title;
  writeFileSync(join(dir, 'index.html'), addBackLink(inject(src), slugs.hub));
}

const esc = (s) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const label = (s) => s.replace(/_/g, ' ');
const fmt = (ms) => { const d = new Date(ms); const z = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${z(d.getMonth() + 1)}-${z(d.getDate())}`; };  // 로컬 시각 기준

mkdirSync(join(ROOT, 'h', slugs.hub), { recursive: true });
writeFileSync(join(ROOT, 'h', slugs.hub, 'index.html'),
  renderGateway({ topics, noindex: NOINDEX, updated: fmt(Date.now()) }));

// 루트/404 — 아무 정보도 링크도 없는 껍데기
const blank = `<!doctype html>
<html lang="en"><head><meta charset="utf-8">${NOINDEX}<title>404</title>
<style>body{margin:0;display:grid;place-items:center;height:100vh;background:#111;color:#555;
font:14px system-ui,sans-serif}</style></head><body>404</body></html>
`;
writeFileSync(join(ROOT, 'index.html'), blank);
writeFileSync(join(ROOT, '404.html'), blank);
writeFileSync(join(ROOT, 'robots.txt'), 'User-agent: *\nDisallow: /\n');
writeFileSync(join(ROOT, '.nojekyll'), '');
writeFileSync(slugPath, JSON.stringify(slugs, null, 2) + '\n');

// ── 4. 로컬 링크 목록 (git 에 안 올라감) ────────────────────────
const base = existsSync(join(ROOT, '.baseurl'))
  ? readFileSync(join(ROOT, '.baseurl'), 'utf8').trim().replace(/\/$/, '')
  : 'https://<USER>.github.io/<REPO>';
const links = [
  `# 링크 목록 (${fmt(Date.now())})`, '',
  `허브: ${base}/h/${slugs.hub}/`, '',
  ...topics.map((t) => `- ${label(t.topic)}\n  ${base}/p/${slugs.pages[t.topic]}/`),
].join('\n') + '\n';
writeFileSync(join(ROOT, 'LINKS.md'), links);

console.log(`토픽 ${topics.length}개 배치 완료`);
for (const t of topics) console.log(`  ${fmt(t.mtime)}  ${t.topic.padEnd(56)} <- ${t.src.split('/').slice(-2)[0]}`);
console.log(`\n허브: ${base}/h/${slugs.hub}/`);
