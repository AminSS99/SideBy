import { readFile, realpath } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/** Static checks only: passing does not prove auth, worker control, or device behavior. */
export async function checkArtifacts(directory, canonicalOrigin = 'https://sideby.ink') {
  const root = await realpath(directory);
  const canonical = new URL(canonicalOrigin);
  if (canonical.protocol !== 'https:' || canonical.pathname !== '/' || canonical.search || canonical.hash) {
    throw new Error('Canonical origin must be an HTTPS origin without a path, query, or fragment.');
  }
  const checks = [];
  const check = async (name, operation) => {
    try { await operation(); checks.push({ name, status: 'passed' }); }
    catch (error) { checks.push({ name, status: 'failed', reason: error instanceof Error ? error.message : String(error) }); }
  };
  const require = (condition, message) => { if (!condition) throw new Error(message); };
  const asset = async (url) => {
    require(typeof url === 'string' && url.startsWith('/') && !url.startsWith('//'), 'Expected a root-relative asset URL.');
    const parsed = new URL(url, canonical.origin);
    require(parsed.origin === canonical.origin && !parsed.search && !parsed.hash, 'Asset must be local and unversioned.');
    const filename = await realpath(path.resolve(root, `.${decodeURIComponent(parsed.pathname)}`));
    require(filename.startsWith(`${root}${path.sep}`), 'Asset escapes artifact directory.');
    return readFile(filename);
  };
  let manifest;
  await check('manifest identity and scope', async () => {
    manifest = JSON.parse(await readFile(path.join(root, 'manifest.webmanifest'), 'utf8'));
    require(manifest.id === '/' && manifest.scope === '/', 'Installed app identity/scope changed; review migration first.');
    require(manifest.start_url === '/app', 'Expected /app launch route.');
    require(manifest.display === 'standalone' && manifest.short_name === 'SideBy', 'Missing SideBy standalone metadata.');
    require(Array.isArray(manifest.icons), 'Manifest icons are missing.');
  });
  const verifyPng = (buffer, width, height) => {
    require(buffer.length >= 33 && buffer.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10])), 'Missing PNG signature/header.');
    require(buffer.toString('ascii', 12, 16) === 'IHDR', 'Missing PNG dimensions header.');
    require(buffer.readUInt32BE(16) === width && buffer.readUInt32BE(20) === height, 'PNG dimensions do not match required size.');
  };
  for (const purpose of ['any', 'maskable']) {
    for (const size of [192, 512]) {
      await check(`${purpose} ${size}px icon header`, async () => {
        const icon = manifest?.icons?.find((item) => item.sizes === `${size}x${size}` && (item.purpose ?? 'any').split(/\s+/).includes(purpose));
        require(icon?.type === 'image/png', 'Required PNG icon declaration missing.');
        verifyPng(await asset(icon.src), size, size);
      });
    }
  }
  await check('HTML mobile metadata', async () => {
    const html = await readFile(path.join(root, 'index.html'), 'utf8');
    const tags = [...html.matchAll(/<(?:meta|link)\b[^>]*>/gi)].map(([tag]) => {
      const attrs = {};
      for (const match of tag.matchAll(/([\w-]+)\s*=\s*(["'])(.*?)\2/g)) attrs[match[1].toLowerCase()] = match[3];
      return attrs;
    });
    const viewport = tags.find((tag) => tag.name === 'viewport')?.content ?? '';
    require(/width\s*=\s*device-width/i.test(viewport) && /viewport-fit\s*=\s*cover/i.test(viewport), 'Missing mobile viewport/safe-area metadata.');
    require(!/user-scalable\s*=\s*(no|0)|maximum-scale\s*=/i.test(viewport), 'Viewport must not restrict zoom.');
    require(tags.some((tag) => tag.rel === 'manifest' && tag.href === '/manifest.webmanifest'), 'Generated manifest link missing.');
    const apple = tags.find((tag) => tag.rel === 'apple-touch-icon');
    require(apple, 'Apple touch icon link missing.');
    verifyPng(await asset(apple.href), 180, 180);
  });
  await check('worker artifact exists', async () => {
    const worker = await readFile(path.join(root, 'sw.js'), 'utf8');
    require(worker.trim().length > 0, 'Empty worker artifact.');
  });
  await check('sitemap public canonical URLs', async () => {
    const xml = await readFile(path.join(root, 'sitemap.xml'), 'utf8');
    require(/<urlset\b[^>]*xmlns=["']http:\/\/www.sitemaps.org\/schemas\/sitemap\/0.9["']/.test(xml), 'Expected generated sitemap urlset namespace.');
    // This checks the repository's generated urlset contract, not arbitrary XML documents.
    const locations = [...xml.matchAll(/<loc>\s*([^<]+?)\s*<\/loc>/g)].map((match) => match[1].replaceAll('&amp;', '&'));
    require(locations.length > 0 && locations.length <= 50_000, 'Sitemap URL count is outside the supported range.');
    const seen = new Set();
    for (const location of locations) {
      const url = new URL(location);
      require(url.origin === canonical.origin && !url.username && !url.password && !url.search && !url.hash, 'Noncanonical or parameterized sitemap URL.');
      const pathname = decodeURIComponent(url.pathname);
      require(!/^\/(app|auth|api|webhooks)(\/|$)/i.test(pathname), 'Private/system route in sitemap.');
      require(!seen.has(url.href), 'Duplicate sitemap URL.');
      seen.add(url.href);
    }
  });
  return { kind: 'static-artifact-check', passed: checks.every((item) => item.status === 'passed'), checks,
    notVerified: ['browser worker registration/update/offline behavior', 'authentication and tenant isolation', 'live billing and entitlements', 'visual icon quality and full PNG decoding', 'physical iPhone behavior', 'capacity and availability'] };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const result = await checkArtifacts(process.argv[2] ?? 'dist', process.argv[3] ?? 'https://sideby.ink');
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
    process.exitCode = result.passed ? 0 : 1;
  } catch (error) {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 1;
  }
}
