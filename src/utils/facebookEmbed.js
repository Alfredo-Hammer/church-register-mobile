// URL del plugin de video de Facebook — carga la página de embed oficial
// de Facebook (no necesita App ID para videos/transmisiones públicas de
// una Página). Se le pasa a un WebView, que renderiza esa página tal cual
// — mismo mecanismo que usaría un <iframe> en la web.
export function buildFacebookEmbedUrl(streamUrl) {
  const encoded = encodeURIComponent(streamUrl);
  return `https://www.facebook.com/plugins/video.php?href=${encoded}&show_text=false&autoplay=true`;
}
