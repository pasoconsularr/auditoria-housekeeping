// Cloudflare Pages Function: lee y guarda los datos en Workers KV.
//
// SEGURIDAD: toda peticion (lectura y escritura) debe incluir el header
// "X-App-Pin" con un PIN valido. Sin esto, el servidor responde 401 y no
// entrega ni acepta ningun dato -- el candado ya no es solo visual.

import { PINS } from '../_shared/pins.js';

function unauthorized() {
    return new Response(JSON.stringify({ error: 'No autorizado' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' }
    });
}

export async function onRequestGet(context) {
    const { env, request } = context;
    const pin = request.headers.get('X-App-Pin') || '';
    if (!PINS[pin]) return unauthorized();

  try {
        const value = await env.DATA_KV.get('store-data');
        const minVersion = await env.DATA_KV.get('min-version');
        const payload = JSON.stringify({
                value: value || '',
                minVersion: Number(minVersion) || 1
        });
        return new Response(payload, { headers: { 'Content-Type': 'application/json' } });
  } catch (e) {
        return new Response(
                JSON.stringify({ error: 'Error interno del almacenamiento.', detail: String(e) }),
          { status: 502, headers: { 'Content-Type': 'application/json' } }
              );
  }
}

export async function onRequestPost(context) {
    const { env, request } = context;
    const pin = request.headers.get('X-App-Pin') || '';
    if (!PINS[pin]) return unauthorized();

  try {
        const body = await request.text();
        await env.DATA_KV.put('store-data', body || '');
        return new Response(
                JSON.stringify({ ok: true, length: (body || '').length }),
          { headers: { 'Content-Type': 'application/json' } }
              );
  } catch (e) {
        return new Response(
                JSON.stringify({ error: 'Error interno del almacenamiento.', detail: String(e) }),
          { status: 502, headers: { 'Content-Type': 'application/json' } }
              );
  }
}
