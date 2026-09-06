# notes

정적 페이지 저장소. `tools/build.mjs` 가 소스 폴더에서 최신본을 골라 배치한다.

## 갱신

```
node tools/build.mjs
git add -A && git commit -m "update" && git push
```

`slugs.json` 은 토픽별 경로를 고정해 둔 파일이다. 지우면 모든 URL 이 바뀐다.
로컬 `LINKS.md` 에 전체 링크 목록이 들어 있다(git 에 올라가지 않음).
