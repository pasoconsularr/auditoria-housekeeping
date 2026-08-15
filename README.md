# Auditoría Integral — Housekeeping

Aplicación web para auditar limpieza y mantenimiento de habitaciones, con historial semanal/mensual/anual y reportes PDF.

## Contenido del paquete

| Archivo | Para qué sirve |
|---|---|
| `index.html` | La aplicación completa |
| `manifest.json` | Permite "instalarla" como app en el móvil |
| `sw.js` | Service Worker: funciona sin internet |
| `icon.svg`, `icon-192.png`, `icon-512.png` | Iconos de la app |
| `netlify.toml` | Configuración de Netlify |
| `_headers`, `_redirects` | Configuración de Cloudflare Pages / Netlify |
| `robots.txt` | Evita que buscadores indexen la app |

---

## Opción A — Netlify (lo más rápido, sin cuenta técnica)

### Método 1: arrastrar y soltar
1. Entra a **https://app.netlify.com/drop**
2. Arrastra **toda la carpeta** (no solo el `index.html`)
3. Listo. Netlify te da una URL tipo `https://nombre-aleatorio.netlify.app`
4. En *Site settings → Change site name* puedes ponerle un nombre propio

### Método 2: desde GitHub (recomendado si vas a hacer cambios)
1. Sube la carpeta a un repositorio de GitHub
2. En Netlify: *Add new site → Import an existing project → GitHub*
3. Selecciona el repositorio
4. **Build command:** dejar vacío
5. **Publish directory:** `.`
6. Deploy

---

## Opción B — Cloudflare Pages

1. Entra a **https://dash.cloudflare.com** → *Workers & Pages* → *Create* → *Pages*
2. **Upload assets** (subir carpeta) o *Connect to Git*
3. Si usas Git:
   - **Framework preset:** None
   - **Build command:** dejar vacío
   - **Build output directory:** `/`
4. Deploy

---

## Después de desplegar

**Instalar en el móvil de las supervisoras:**
- **Android/Chrome:** abre la URL → menú ⋮ → "Instalar aplicación"
- **iPhone/Safari:** abre la URL → botón compartir → "Añadir a pantalla de inicio"

Queda como un icono más en el teléfono y funciona sin internet.

---

## 🔐 Acceso

La app está protegida con un **PIN de 4 dígitos** (definidos en `functions/_shared/pins.js`).
El PIN no es solo visual: el servidor exige la cabecera `X-App-Pin` en cada lectura y
escritura, así que sin PIN válido no se entrega ni se acepta ningún dato.

---

## ☁️ Almacenamiento de los datos

El historial es **compartido entre todos los dispositivos** que abran la misma URL.

| Dónde | Qué guarda |
|---|---|
| Cloudflare Workers KV (`DATA_KV`) | Historial de auditorías, lista de supervisoras y fotos |
| Navegador (localStorage) | Copia local, para que la app siga funcionando sin internet |

Al guardar, la app **combina** lo local con lo que ya hay en la nube antes de escribir, así
nunca pisa lo que otro dispositivo registró. Mientras estás en la pestaña *Historial*,
consulta la nube cada 20 segundos para reflejar lo que registran las demás supervisoras.

### Límites del plan gratuito de Cloudflare

| Recurso | Límite | Equivalencia práctica |
|---|---|---|
| Espacio total | 1 GB | ~5.000–7.000 fotos, o decenas de miles de auditorías de solo texto |
| Tamaño por archivo | 25 MB | Cada foto comprimida pesa ~150 KB |
| Lecturas / día | 100.000 | Muy holgado |
| Escrituras / día | 1.000 | ~200–300 auditorías con foto al día |

Una auditoría sin fotos ocupa ~1 KB; el peso real lo ponen las fotos, por eso se comprimen
en el propio teléfono antes de subirlas.

**Recomendación:** exporta el CSV periódicamente (botón *Exportar CSV*) como respaldo adicional.

---

## 📷 Evidencia fotográfica

- Botón **📷 Añadir foto** en cada ítem, y un botón destacado cuando un ítem **no cumple**.
- En el móvil abre directamente la cámara trasera.
- La foto se **redimensiona a 1200 px y se comprime en el navegador** antes de subirla:
  una foto de 4 MB queda en ~150 KB sin perder legibilidad.
- Se guarda en una entrada independiente de la nube, así el archivo de sincronización
  sigue siendo pequeño y la app rápida.
- Máximo 4 fotos por ítem.
- Las fotos aparecen en el detalle de la auditoría y en el **reporte PDF**.

---

## 📊 Qué información da sobre cada supervisora

En la pestaña *Historial y Métricas*:

**Con "Todas" seleccionado — Comparativa de Supervisoras**
Ranking por puntaje acumulado, con auditorías realizadas, desglose Limpieza/Mantenimiento,
variación frente al mes anterior y su punto más débil.

**Con una supervisora seleccionada — Ficha individual**

| Sección | Qué responde |
|---|---|
| Cabecera | Puntaje acumulado, estado (Excelencia / Aceptable / Riesgo), Limpieza vs Mantenimiento y tendencia mensual |
| Indicadores | Ítems evaluados, incumplimientos, % de cumplimiento y evidencias adjuntas |
| 🎯 Lo que más falla | Los puntos que más incumple, con frecuencia y porcentaje — dónde reforzar la capacitación |
| 📋 Auditoría por auditoría | Cada visita, con cuántos puntos falló y cuánta evidencia tiene |

Al tocar cualquier auditoría se abre el detalle completo: **qué cumplió, qué no cumplió y
las fotos de evidencia** de cada punto.

> Las auditorías guardadas **antes** de esta versión no tienen el detalle ítem por ítem
> (solo el puntaje). La app lo indica claramente en lugar de mostrar datos vacíos.

---

## Cómo se calcula la puntuación

Cada ítem evaluado vale **2 puntos**:
- Cumple / Buen Estado = 2 pts
- No Cumple / Averiado = 0 pts

**Puntaje de una auditoría** = puntos obtenidos ÷ puntos posibles × 100

**Puntaje acumulado de un periodo** (semana, mes, año) = suma de puntos obtenidos ÷ suma de puntos posibles × 100

Esto es una **media ponderada**, no un promedio de porcentajes. Una auditoría de 16 ítems pesa cuatro veces más que una de 4 ítems, que es lo correcto.

**Escala:**
| Puntaje | Estado |
|---|---|
| 90–100% | Excelencia |
| 80–89% | Aceptable |
| menos de 80% | Riesgo |
