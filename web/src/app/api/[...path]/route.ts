// Proxy de mismo origen: el web reenvía /api/* a la API interna (Easypanel).
// Así la app y la API viven bajo UN dominio → la cookie de sesión queda en el
// dominio del web, el middleware la ve y no hay rebotes ni CORS cross-subdominio.
//
// API_INTERNAL_URL se lee en RUNTIME (no se hornea en el build): host interno de
// la API sin el prefijo /api. Ej. en Easypanel: http://boxit_api:3001
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const API_INTERNAL_URL = process.env.API_INTERNAL_URL ?? 'http://localhost:3001';

// Headers que no deben cruzar el proxy (los recalcula fetch / rompen el body).
const STRIP_REQUEST = new Set(['host', 'connection', 'content-length']);
const STRIP_RESPONSE = new Set([
  'content-encoding',
  'content-length',
  'transfer-encoding',
  'connection',
]);

async function proxy(req: NextRequest): Promise<NextResponse> {
  // pathname ya viene con el prefijo /api → lo reenviamos tal cual a la API.
  const target = `${API_INTERNAL_URL}${req.nextUrl.pathname}${req.nextUrl.search}`;

  const headers = new Headers();
  req.headers.forEach((value, key) => {
    if (!STRIP_REQUEST.has(key.toLowerCase())) headers.set(key, value);
  });

  const hasBody = req.method !== 'GET' && req.method !== 'HEAD';
  const body = hasBody ? await req.arrayBuffer() : undefined;

  let upstream: Response;
  try {
    upstream = await fetch(target, {
      method: req.method,
      headers,
      body,
      redirect: 'manual',
      cache: 'no-store',
    });
  } catch {
    return NextResponse.json(
      { message: 'La API no está disponible.' },
      { status: 502 },
    );
  }

  const res = new NextResponse(upstream.body, {
    status: upstream.status,
    statusText: upstream.statusText,
  });
  upstream.headers.forEach((value, key) => {
    if (!STRIP_RESPONSE.has(key.toLowerCase()) && key.toLowerCase() !== 'set-cookie') {
      res.headers.set(key, value);
    }
  });
  // Set-Cookie hay que reenviarlas una por una (la API las setea host-only →
  // el browser las asocia al dominio del web, que es lo que queremos).
  for (const cookie of upstream.headers.getSetCookie()) {
    res.headers.append('set-cookie', cookie);
  }
  return res;
}

export {
  proxy as GET,
  proxy as POST,
  proxy as PUT,
  proxy as PATCH,
  proxy as DELETE,
  proxy as HEAD,
  proxy as OPTIONS,
};
