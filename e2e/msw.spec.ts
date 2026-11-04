import { expect, test } from '@playwright/test'

test('mock service worker 以 JavaScript 提供，而不是 SPA 回退的 HTML', async ({ request }) => {
  const response = await request.get('/mockServiceWorker.js')

  expect(response.status()).toBe(200)
  expect(response.headers()['content-type']).toContain('text/javascript')
  expect(await response.text()).toContain('Mock Service Worker')
})
