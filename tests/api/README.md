# API tests (scaffolded)

Route-level tests (hitting `app/api/**/route.ts` handlers directly with
mocked `Request` objects) belong here. Not yet implemented — see the
README "Known limitations". Suggested first candidates:
`generate.test.ts` (mock `CacheAgent`), `kaomoji.test.ts` (real, since
it has no external dependency), `admin-login.test.ts`.
