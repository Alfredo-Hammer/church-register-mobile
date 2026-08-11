// Bus mínimo para que el interceptor de axios (fuera de React) pueda avisarle
// a AuthContext que el token ya no sirve (401), sin acoplar api.js al estado
// de React directamente.
const listeners = new Set();

export const authEvents = {
  emit(event) {
    listeners.forEach((fn) => fn(event));
  },
  addListener(event, fn) {
    const wrapped = (e) => { if (e === event) fn(); };
    listeners.add(wrapped);
    return { remove: () => listeners.delete(wrapped) };
  },
};
