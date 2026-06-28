import { promises as fs } from 'fs';
import path from 'path';

const distClientDir = path.resolve(process.cwd(), 'dist/client');
const assetsDir = path.join(distClientDir, 'assets');

const assets = await fs.readdir(assetsDir);
const jsIndexFiles = assets.filter((file) => /^index-.*\.js$/.test(file));
const cssFiles = assets.filter((file) => /^styles-.*\.css$/.test(file));

if (jsIndexFiles.length === 0) {
  throw new Error('No client index JS file found in dist/client/assets');
}

let entryScript = jsIndexFiles[0];
for (const file of jsIndexFiles) {
  const content = await fs.readFile(path.join(assetsDir, file), 'utf8');
  if (content.includes('const __vite__mapDeps')) {
    entryScript = file;
    break;
  }
}

const cssLinks = cssFiles
  .map((file) => `    <link rel="stylesheet" href="./assets/${file}" />`)
  .join('\n');

const html = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="description" content="Sarthi — Real-Time Public Transport for Small Cities" />
    <title>Sarthi</title>
${cssLinks}
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="./assets/${entryScript}"></script>
  </body>
</html>
`;

await fs.writeFile(path.join(distClientDir, 'index.html'), html, 'utf8');

const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>/</loc><changefreq>weekly</changefreq></url>
  <url><loc>/live</loc><changefreq>weekly</changefreq></url>
  <url><loc>/driver</loc><changefreq>weekly</changefreq></url>
  <url><loc>/authority</loc><changefreq>weekly</changefreq></url>
  <url><loc>/rewards</loc><changefreq>weekly</changefreq></url>
  <url><loc>/channels</loc><changefreq>weekly</changefreq></url>
</urlset>
`;
await fs.writeFile(path.join(distClientDir, 'sitemap.xml'), sitemapXml, 'utf8');

console.log(`Generated dist/client/index.html and sitemap.xml using ${entryScript}`);
