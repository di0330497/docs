// 빌드 → 커밋 → push 한 번에. 학습자료를 새로 만든 뒤 이걸 돌리면 게이트웨이까지 갱신된다.
//   node tools/publish.mjs            전체 갱신
//   node tools/publish.mjs Kubernetes 갱신 후 그 토픽 URL 을 따로 찍어 준다
import { execFileSync } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const run = (cmd, args) => execFileSync(cmd, args, { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
const topic = process.argv[2];

// 1. 배치 — 소스 out/ 을 다시 훑어 새 토픽을 집어넣고 게이트웨이를 다시 그린다
process.stdout.write(run('node', [join(ROOT, 'tools', 'build.mjs')]));

// 2. 변경분이 있을 때만 커밋
const dirty = run('git', ['status', '--porcelain']).trim();
if (!dirty) {
  console.log('\n바뀐 내용이 없어 push 를 건너뛴다.');
} else {
  const n = dirty.split('\n').length;
  run('git', ['add', '-A']);
  run('git', ['commit', '-m', topic ? `${topic} 학습자료 게시` : '학습자료 갱신']);
  run('git', ['push', 'origin', 'main']);
  console.log(`\n파일 ${n}개 push 완료.`);
}

// 3. 주소 안내
const base = existsSync(join(ROOT, '.baseurl'))
  ? readFileSync(join(ROOT, '.baseurl'), 'utf8').trim().replace(/\/$/, '')
  : 'https://<USER>.github.io/<REPO>';
const slugs = JSON.parse(readFileSync(join(ROOT, 'slugs.json'), 'utf8'));
console.log(`\n전체 토픽: ${base}/h/${slugs.hub}/`);
if (topic) {
  // 폴더명이 정확히 안 맞아도 대소문자·밑줄 무시하고 찾아 준다
  const norm = (s) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
  const hit = Object.keys(slugs.pages).find((k) => norm(k) === norm(topic))
    || Object.keys(slugs.pages).find((k) => norm(k).includes(norm(topic)));
  console.log(hit
    ? `${hit}: ${base}/p/${slugs.pages[hit]}/`
    : `'${topic}' 에 해당하는 토픽을 slugs.json 에서 못 찾았다. 소스 out/ 폴더 이름을 확인할 것.`);
}
console.log('\nGitHub Pages 반영에는 1~3분 걸린다.');
