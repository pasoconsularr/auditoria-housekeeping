// Cloudflare Pages Function: guarda y sirve las fotos de evidencia.
//
// Las fotos se guardan en entradas independientes de KV ("photo:<id>") en vez
// de meterlas dentro del estado principal. Asi el archivo de sincronizacion
// se mantiene pequeno y rapido, y cada foto se descarga solo cuando alguien
// la abre.
//
// SEGURIDAD: igual que /api/data, toda peticion exige el header "X-App-Pin"
// con un PIN valido.

import { PINS } from '../_shared/pins.js';

function json(data, status) {
  return new Response(JSON.stringify(data), {
    status: status || 200,
    headers: { 'Content-Type': 'application/json' }
  });
}

function unauthorized() {
  return json({ error: 'No autorizado' }, 401);
}

// Limite defensivo: una foto ya comprimida por el navegador ronda los 150 KB.
// 6 MB deja margen de sobra y evita que un fallo de compresion llene el KV.
const MAX_PHOTO_CHARS = 6 * 1024 * 1024;

export async function onRequestGet(context) {
  const { env, request } = context;
  const pin = request.headers.get('X-App-Pin') || '';
  if (!PINS[pin]) return unauthorized();

  const id = new URL(request.url).searchParams.get('id') || '';
  if (!id) return json({ error: 'Falta el id de la foto.' }, 400);

  try {
    const dataUrl = await env.DATA_KV.get('photo:' + id);
    if (!dataUrl) return json({ error: 'Foto no encontrada.' }, 404);
    return json({ id, dataUrl });
  } catch (e) {
    return json({ error: 'Error interno del almacenamiento.', detail: String(e) }, 502);
  }
}

export async function onRequestPost(context) {
  const { env, request } = context;
  const pin = request.headers.get('X-App-Pin') || '';
  if (!PINS[pin]) return unauthorized();

  try {
    const dataUrl = await request.text();
    if (!dataUrl || !dataUrl.startsWith('data:image/')) {
      return json({ error: 'El contenido no es una imagen valida.' }, 400);
    }
    if (dataUrl.length > MAX_PHOTO_CHARS) {
      return json({ error: 'La imagen es demasiado grande.' }, 413);
    }

    const id = crypto.randomUUID();
    await env.DATA_KV.put('photo:' + id, dataUrl);
    return json({ ok: true, id, length: dataUrl.length });
  } catch (e) {
    return json({ error: 'Error interno del almacenamiento.', detail: String(e) }, 502);
  }
}
