// Lista unica de PINs validos, compartida entre auth.js y data.js.
// El prefijo "_" en el nombre de la carpeta hace que Cloudflare NO la trate
// como una ruta publica -- solo es un archivo compartido interno.

export const PINS = {
    '6284': 'Admin 1',
    '1121': 'Admin 2',
    '4980': 'Admin 3',
};
