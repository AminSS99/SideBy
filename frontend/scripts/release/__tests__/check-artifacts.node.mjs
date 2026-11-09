import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, rm, symlink } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { checkArtifacts } from '../check-artifacts.mjs';

async function fixture(t) {
  const root = await mkdtemp(path.join(os.tmpdir(), 'sideby-artifacts-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const icons = [];
  for (const purpose of ['any', 'maskable']) for (const size of [192, 512]) {
    const src = `/icon-${purpose}-${size}.png`;
    const header = Buffer.alloc(33);
    Buffer.from([137,80,78,71,13,10,26,10]).copy(header);
    header.write('IHDR', 12); header.writeUInt32BE(size, 16); header.writeUInt32BE(size, 20);
    await writeFile(path.join(root, src), header);
    icons.push({ src, type: 'image/png', sizes: `${size}x${size}`, purpose });
  }
  const apple = Buffer.alloc(33);
  Buffer.from([137,80,78,71,13,10,26,10]).copy(apple);
  apple.write('IHDR', 12); apple.writeUInt32BE(180, 16); apple.writeUInt32BE(180, 20);
  await writeFile(path.join(root, 'apple.png'), apple);
  const manifest = { id: '/', scope: '/', start_url: '/app', display: 'standalone', short_name: 'SideBy', icons };
  await writeFile(path.join(root, 'manifest.webmanifest'), JSON.stringify(manifest));
  await writeFile(path.join(root, 'index.html'), '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover"><link rel="manifest" href="/manifest.webmanifest"><link rel="apple-touch-icon" href="/apple.png">');
  await writeFile(path.join(root, 'sw.js'), 'self.addEventListener("fetch", () => {});');
  await writeFile(path.join(root, 'sitemap.xml'), '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>https://sideby.ink/</loc></url></urlset>');
  return { root, manifest };
}

test('accepts a matching static artifact and declares runtime checks unverified', async (t) => {
  const { root } = await fixture(t);
  const result = await checkArtifacts(root);
  assert.equal(result.passed, true);
  assert.ok(result.notVerified.includes('physical iPhone behavior'));
});

test('fails private, duplicate, and foreign sitemap URLs', async (t) => {
  const { root } = await fixture(t);
  for (const locations of [['https://sideby.ink/app/comparisons'], ['https://other.example/'], ['https://sideby.ink/', 'https://sideby.ink/']]) {
    await writeFile(path.join(root, 'sitemap.xml'), `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${locations.map((url) => `<url><loc>${url}</loc></url>`).join('')}</urlset>`);
    const result = await checkArtifacts(root);
    assert.equal(result.checks.find((check) => check.name === 'sitemap public canonical URLs').status, 'failed');
  }
});

test('fails declared icons with mismatched real dimensions', async (t) => {
  const { root } = await fixture(t);
  await writeFile(path.join(root, 'icon-any-192.png'), 'not a PNG');
  const result = await checkArtifacts(root);
  assert.equal(result.passed, false);
  assert.equal(result.checks.find((check) => check.name === 'any 192px icon header').status, 'failed');
});

test('rejects icons that resolve outside the release directory', async (t) => {
  const { root, manifest } = await fixture(t);
  const outside = await mkdtemp(path.join(os.tmpdir(), 'sideby-external-'));
  t.after(() => rm(outside, { recursive: true, force: true }));
  await writeFile(path.join(outside, 'private.png'), 'private');
  await mkdir(path.join(root, 'links'));
  await symlink(path.join(outside, 'private.png'), path.join(root, 'links/icon.png'));
  manifest.icons[0].src = '/links/icon.png';
  await writeFile(path.join(root, 'manifest.webmanifest'), JSON.stringify(manifest));
  const result = await checkArtifacts(root);
  assert.match(result.checks.find((check) => check.name === 'any 192px icon header').reason, /escapes/);
});

test('rejects a release that disables user zoom', async (t) => {
  const { root } = await fixture(t);
  await writeFile(path.join(root, 'index.html'), '<meta name="viewport" content="width=device-width, viewport-fit=cover, user-scalable=no">');
  const result = await checkArtifacts(root);
  assert.equal(result.checks.find((check) => check.name === 'HTML mobile metadata').status, 'failed');
});
