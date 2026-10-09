// 빌드 → 커밋 → push 한 번에. 학습자료를 새로 만든 뒤 이걸 돌리면 게이트웨이까지 갱신된다.
//   node tools/publish.mjs            전체 갱신 (한국어 + 영문)
//   node tools/publish.mjs Kubernetes 갱신 후 그 토픽 URL 을 따로 찍어 준다
//   node tools/publish.mjs --en       영문만 갱신 (영문 책을 만들었을 때)
import { execFileSync } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const run = (cmd, args, opts) => execFileSync(cmd, args, { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], ...opts });
const argv = process.argv.slice(2);
const onlyEn = argv.includes('--en');
const onlyKo = argv.includes('--ko');
const topic = argv.find((a) => !a.startsWith('--'));

// 1. 배치 — 소스 out/ 을 다시 훑어 새 토픽을 집어넣고 게이트웨이를 다시 그린다.
//    한국어(it-course-pipeline/out → p,h)와 영문(it-course-pipeline-eng/out → en/p,en/h)을 각각 돌린다.
//    영문 책이 아직 없으면 build 가 "영문 책이 없다" 하고 en/ 을 그대로 두고 나온다.
const BUILD = join(ROOT, 'tools', 'build.mjs');
if (!onlyEn) process.stdout.write(run('node', [BUILD]));
if (!onlyKo) process.stdout.write(run('node', [BUILD], { env: { ...process.env, NB_LANG: 'en' } }));

// 2. 변경분이 있을 때만 커밋
const dirty = run('git', ['status', '--porcelain']).trim();
if (!dirty) {
  console.log('\n바뀐 내용이 없어 push 를 건너뛴다.');
} else {
  const n = dirty.split('\n').length;
  run('git', ['add', '-A']);
  run('git', ['commit', '-m', topic
    ? `${topic} ${onlyKo ? 'English learning book' : '학습자료'} 게시`
    : (onlyKo ? 'English learning material update' : '학습자료 갱신')]);
  run('git', ['push', 'origin', 'main']);
  console.log(`\n파일 ${n}개 push 완료.`);
}

// 3. 주소 안내
const base = existsSync(join(ROOT, '.baseurl'))
  ? readFileSync(join(ROOT, '.baseurl'), 'utf8').trim().replace(/\/$/, '')
  : 'https://<USER>.github.io/<REPO>';
const slugs = JSON.parse(readFileSync(join(ROOT, 'slugs.json'), 'utf8'));
if (!onlyKo && slugs.hub) console.log(`\n전체 토픽: ${base}/h/${slugs.hub}/`);
if (!onlyEn && slugs.hubEn) console.log(`\n영문 토픽: ${base}/en/h/${slugs.hubEn}/`);
if (topic) {
  // 폴더명이 정확히 안 맞아도 대소문자·밑줄 무시하고 찾아 준다
  const norm = (s) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
  for (const [bucket, dir, label] of [['pages', '', '한국어'], ['pagesEn', 'en/', '영문']]) {
    const map = slugs[bucket];
    if (!map) continue;
    const hit = Object.keys(map).find((k) => norm(k) === norm(topic))
      || Object.keys(map).find((k) => norm(k).includes(norm(topic)));
    console.log(hit
      ? `[${label}] ${hit}: ${base}/${dir}p/${map[hit]}/`
      : `[${label}] '${topic}' 에 해당하는 토픽을 찾지 못했다. 소스 out/ 폴더 이름을 확인할 것.`);
  }
}
console.log('\nGitHub Pages 반영에는 1~3분 걸린다.');
