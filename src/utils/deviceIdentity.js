import * as SecureStore from "expo-secure-store";

// Identidad anónima para likes/comentarios en fotos — no hay cuenta de
// miembro real todavía (ver AGENTS.md/memoria del proyecto). Un UUID
// generado una vez y guardado en el dispositivo sirve como "quién" sin
// pedir cuenta ni login; el nombre para comentar se pide la primera vez
// y se recuerda para la próxima. Deliberadamente no es una identidad
// verificada — reinstalar la app genera un device_id nuevo.
function uuidv4() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

const DEVICE_ID_KEY = "photoDeviceId";
const NAME_KEY = "photoCommentName";

export async function getDeviceId() {
  let id = await SecureStore.getItemAsync(DEVICE_ID_KEY);
  if (!id) {
    id = uuidv4();
    await SecureStore.setItemAsync(DEVICE_ID_KEY, id);
  }
  return id;
}

export async function getRememberedName() {
  return (await SecureStore.getItemAsync(NAME_KEY)) || "";
}

export async function rememberName(name) {
  await SecureStore.setItemAsync(NAME_KEY, name);
}
