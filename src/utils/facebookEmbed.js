// URL del plugin de video de Facebook — carga la página de embed oficial
// de Facebook (no necesita App ID para videos/transmisiones públicas de
// una Página). Se le pasa a un WebView, que renderiza esa página tal cual
// — mismo mecanismo que usaría un <iframe> en la web.
// width/height: sin esto, la página del plugin renderiza el video en un
// tamaño fijo pequeño arriba a la izquierda con un montón de espacio en
// blanco abajo (reproducido y confirmado navegando directo a la URL del
// plugin) — pasándole el tamaño real que le vamos a dar en pantalla,
// Facebook escala el video a ese tamaño en vez de dejarlo en su default.
export function buildFacebookEmbedUrl(streamUrl, width, height) {
  const encoded = encodeURIComponent(streamUrl);
  const w = Math.round(width);
  const h = Math.round(height);
  // controls=true: barra de controles de Facebook visible (play/pause,
  // volumen, pantalla completa). mute=0: pide arrancar con audio — el
  // WebView ya tiene mediaPlaybackRequiresUserAction=false para permitir
  // esto, aunque Facebook puede igual arrancar muteado la primera vez
  // según sus propias políticas de autoplay (mismo comportamiento que
  // tiene en cualquier navegador).
  return `https://www.facebook.com/plugins/video.php?href=${encoded}&show_text=false&autoplay=true&mute=0&controls=true&width=${w}&height=${h}`;
}
