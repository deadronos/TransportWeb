# Contributing

Thanks for contributing! This file contains a short note on running end-to-end tests locally with Playwright.

## Running Playwright E2E tests locally

Quick checklist:

1. Install dependencies

```bash
npm ci
```

2. Install Playwright browser binaries

- Standard (Windows/macOS):

```bash
npx playwright install
```

- On Linux CI containers or where system deps are missing, include system dependencies:

```bash
npx playwright install --with-deps
```

3. Start the app

- Development (fast, hot-reload):

```bash
npm run dev
```

- Production-like preview (recommended to reproduce CI behavior):

```bash
npm run build
npm run preview
```

> The CI pipeline expects the app to be available at `http://localhost:3000`. Ensure port 3000 is available; Vite may pick another port if 3000 is in use which will cause tests that assume `:3000` to fail.

4. Run Playwright tests

```bash
npm run test:e2e
# or directly
npx playwright test
```

5. Debugging tips

- Run tests in a visible browser for debugging:

```bash
npx playwright test --headed --project=chromium
```

- Use the Playwright inspector:

```bash
npx playwright test --debug
```

6. If the e2e tests hang

- Make sure the app is running and reachable at `http://localhost:3000` (use `npx wait-on http://localhost:3000` to block until it is ready).

That's it — thanks for helping improve the project!
