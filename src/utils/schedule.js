// Formatea el "próximo" ítem de agenda (evento, conferencia u ocurrencia de
// oración) — compartido entre MemberHomeScreen y HomeScreen, que necesitan
// exactamente el mismo cálculo desde dos fuentes de datos distintas
// (endpoints públicos vs. autenticados).

export function formatEventDate(iso) {
  const d = new Date(iso);
  const date = d.toLocaleDateString("es", { weekday: "long", day: "numeric", month: "long" });
  const time = d.toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit" });
  return `${date} · ${time}`;
}

// Una conferencia dura varios días — mostrar el rango completo en vez de
// una sola fecha/hora, que solo tendría sentido para un evento puntual.
export function formatDateRange(startIso, endIso) {
  const start = new Date(startIso);
  const end = new Date(endIso);
  const startLabel = start.toLocaleDateString("es", { day: "numeric", month: "long" });
  const endLabel = end.toLocaleDateString("es", { day: "numeric", month: "long" });
  return startLabel === endLabel ? startLabel : `${startLabel} – ${endLabel}`;
}

// "HH:MM:SS" tal como lo devuelve Postgres para una columna TIME — se arma
// una fecha cualquiera solo para reusar el formateador de hora del sistema.
export function formatTime(timeStr) {
  if (!timeStr) return "";
  const [h, m] = timeStr.split(":");
  const d = new Date(2000, 0, 1, Number(h), Number(m));
  return d.toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit" });
}

// Próxima fecha/hora concreta en la que cae un día de oración recurrente
// (hoy mismo si todavía no pasó su hora, si no la semana que viene) — para
// poder compararlo de igual a igual contra eventos con fecha fija y saber
// cuál mostrar como "Próximo".
export function nextPrayerOccurrence(dayOfWeek, startTime, now = new Date()) {
  const [h, m] = startTime.split(":").map(Number);
  const result = new Date(now);
  const diff = (dayOfWeek - now.getDay() + 7) % 7;
  result.setDate(now.getDate() + diff);
  result.setHours(h, m, 0, 0);
  if (result < now) result.setDate(result.getDate() + 7);
  return result;
}

// De una lista de eventos (ordenada por fecha, el próximo primero) y días
// de oración recurrentes, arma el candidato con la fecha/hora más cercana
// a `now` — mismo criterio para el home de miembro y el de staff.
export function pickNextItem(events, prayerDays, now = new Date()) {
  const candidates = [];
  if (events[0]) candidates.push({ ...events[0], _sortDate: new Date(events[0].date) });
  for (const pd of prayerDays) {
    candidates.push({ ...pd, kind: "prayer", _sortDate: nextPrayerOccurrence(pd.day_of_week, pd.start_time, now) });
  }
  if (candidates.length === 0) return null;
  candidates.sort((a, b) => a._sortDate - b._sortDate);
  return candidates[0];
}

// Próximo cumpleaños de un miembro (mismo día/mes, año que sea) — para
// ordenar y filtrar birthdays por "cuántos días faltan" sin importar en
// qué año nació. El backend manda ISO con hora en UTC (ej.
// "1990-03-15T05:00:00.000Z") — se reconstruye a mediodía local para que
// el día no se corra por huso horario, mismo truco que ya usa
// BirthdaysPage.jsx en la web (su `localDate`).
export function daysUntilBirthday(birthDate, now = new Date()) {
  const b = new Date(birthDate.slice(0, 10) + "T12:00:00");
  const next = new Date(now.getFullYear(), b.getMonth(), b.getDate());
  next.setHours(0, 0, 0, 0);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (next < today) next.setFullYear(next.getFullYear() + 1);
  return Math.round((next - today) / 86400000);
}
