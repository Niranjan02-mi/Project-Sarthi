import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { Readable } from 'node:stream';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const serverModulePath = path.join(__dirname, '..', 'dist', 'server', 'index.js');

async function getServerHandler() {
  const mod = await import(serverModulePath);
  return mod.default ?? mod;
}

function buildRequest(req) {
  const protocol = req.headers['x-forwarded-proto'] || 'https';
  const host = req.headers.host;
  const url = new URL(req.url, `${protocol}://${host}`);

  const headers = new Headers();
  for (const [key, value] of Object.entries(req.headers)) {
    if (value === undefined) continue;
    if (Array.isArray(value)) {
      for (const v of value) {
        headers.append(key, v);
      }
    } else {
      headers.set(key, value);
    }
  }

  let body = null;
  if (req.method && req.method !== 'GET' && req.method !== 'HEAD') {
    body = req;
  }

  return new Request(url.toString(), {
    method: req.method,
    headers,
    body,
    duplex: 'half',
  });
}

async function sendResponse(res, response) {
  res.statusCode = response.status;

  response.headers.forEach((value, key) => {
    if (key.toLowerCase() === 'transfer-encoding') return;
    res.setHeader(key, value);
  });

  const body = response.body;
  if (!body) {
    res.end();
    return;
  }

  if (body instanceof Readable) {
    body.pipe(res);
    return;
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  res.end(buffer);
}

export default async function handler(req, res) {
  try {
    const server = await getServerHandler();
    const request = buildRequest(req);
    const response = await server.fetch(request, {}, { waitUntil: () => {} });
    await sendResponse(res, response);
  } catch (error) {
    console.error(error);
    res.statusCode = 500;
    res.setHeader('content-type', 'text/plain; charset=utf-8');
    res.end('Internal Server Error');
  }
}
