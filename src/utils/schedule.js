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

// De una lista de eventos (en cualquier orden, puede incluir pasados o "en
// vivo" — se filtra acá adentro) y días de oración recurrentes, arma el
// candidato con la fecha/hora futura más cercana a `now`. Mismo criterio
// para el home de miembro y el de staff, sin asumir ningún orden previo de
// `events` (el endpoint público y el autenticado no ordenan igual, y
// ninguno de los dos garantiza excluir eventos ya empezados).
export function pickNextItem(events, prayerDays, now = new Date()) {
  const candidates = [];
  const nextEvent = events
    .filter((e) => new Date(e.date) >= now)
    .sort((a, b) => new Date(a.date) - new Date(b.date))[0];
  if (nextEvent) candidates.push({ ...nextEvent, _sortDate: new Date(nextEvent.date) });
  for (const pd of prayerDays) {
    candidates.push({ ...pd, kind: "prayer", _sortDate: nextPrayerOccurrence(pd.day_of_week, pd.start_time, now) });
  }
  if (candidates.length === 0) return null;
  candidates.sort((a, b) => a._sortDate - b._sortDate);
  return candidates[0];
}

// Ni `events` ni `prayer_days` guardan una duración explícita — se asume
// una ventana razonable para un culto/reunión típico. Si más adelante se
// agrega una hora de fin real, esto deja de hacer falta.
const DEFAULT_EVENT_DURATION_MS = 2 * 60 * 60 * 1000; // 2 horas
const DEFAULT_PRAYER_DURATION_MS = 90 * 60 * 1000; // 90 minutos

function timeOnDate(baseDate, timeStr) {
  const [h, m] = timeStr.split(":").map(Number);
  return new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate(), h, m, 0, 0);
}

// Conferencias quedan afuera: su end_date es de calendario (día), no de
// horario — no hay forma de saber si "ahora mismo" cae dentro de una
// sesión sin consultar cada conference_session por separado.
export function isEventLiveNow(event, now = new Date()) {
  if (event.kind === "conference") return false;
  const start = new Date(event.date);
  const end = new Date(start.getTime() + DEFAULT_EVENT_DURATION_MS);
  return now >= start && now <= end;
}

export function isPrayerLiveNow(prayerDay, now = new Date()) {
  if (now.getDay() !== prayerDay.day_of_week) return false;
  const start = timeOnDate(now, prayerDay.start_time);
  const end = prayerDay.end_time
    ? timeOnDate(now, prayerDay.end_time)
    : new Date(start.getTime() + DEFAULT_PRAYER_DURATION_MS);
  return now >= start && now <= end;
}

// Primer ítem "en vivo ahora mismo" entre eventos y días de oración — para
// el banner "EN VIVO" de los dos homes. Si hay más de uno solapado (caso
// raro), se prioriza el que empezó más recientemente.
export function pickLiveNow(events, prayerDays, now = new Date()) {
  const live = [
    ...events.filter((e) => isEventLiveNow(e, now)).map((e) => ({ ...e, _startDate: new Date(e.date) })),
    ...prayerDays.filter((pd) => isPrayerLiveNow(pd, now)).map((pd) => ({
      ...pd, kind: "prayer", _startDate: timeOnDate(now, pd.start_time),
    })),
  ];
  if (live.length === 0) return null;
  live.sort((a, b) => b._startDate - a._startDate);
  return live[0];
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
