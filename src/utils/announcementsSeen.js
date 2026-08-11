import * as SecureStore from "expo-secure-store";

// Recordatorio local de "hasta qué aviso ya vi", por dispositivo — no hay
// push real (Expo Go no lo soporta desde el SDK 53 sin un development
// build propio), así que esto es la versión ligera: comparar la fecha del
// aviso más reciente contra la última vez que el usuario abrió Avisos.
const KEY = "lastSeenAnnouncementAt";

export async function getLastSeenAnnouncementAt() {
  return await SecureStore.getItemAsync(KEY);
}

export async function markAnnouncementsSeen(latestCreatedAt) {
  if (!latestCreatedAt) return;
  await SecureStore.setItemAsync(KEY, latestCreatedAt);
}

export function hasUnseenAnnouncement(announcements, lastSeenAt) {
  if (!announcements?.length) return false;
  if (!lastSeenAt) return true;
  return new Date(announcements[0].created_at) > new Date(lastSeenAt);
}
