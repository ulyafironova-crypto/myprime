import type { Workout, WeeklyGoals } from "./types";
export const today = () => new Date().toISOString().slice(0, 10);
export const weekStart = (date: string) => {
  const d = new Date(`${date}T12:00:00`);
  const day = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - day);
  return d.toISOString().slice(0, 10);
};
export const addDays = (date: string, n: number) => {
  const d = new Date(`${date}T12:00:00`);
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
};
export const parsePace = (value: string) => {
  const m = value.trim().match(/^(\d{1,2})[:.,](\d{2})$/);
  if (!m || +m[2] > 59) return null;
  return +m[1] * 60 + +m[2];
};
export const parseDuration = (value: string) => {
  const normalized = value.trim();
  if (/^\d+$/.test(normalized)) return +normalized;
  const m = normalized.match(/^(\d{1,2}):(\d{2})$/);
  if (!m || +m[2] > 59) return null;
  return +m[1] * 60 + +m[2];
};
export const pace = (seconds?: number) =>
  seconds === undefined
    ? "—"
    : `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
export const displayDate = (date: string) =>
  new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "short",
    weekday: "short",
  }).format(new Date(`${date}T12:00:00`));
export const monthName = (date: string) =>
  new Intl.DateTimeFormat("ru-RU", { month: "long", year: "numeric" }).format(
    new Date(`${date}T12:00:00`),
  );
export const typeLabel = (t: Workout["type"]) =>
  ({ run: "Бег", strength: "Функционально-силовая", functional_strength: "Функционально-силовая" })[
    t
  ];
export function progress(
  workouts: Workout[],
  goals: WeeklyGoals,
  isCurrent = false,
) {
  const counts = { run: 0, strength: 0, functionalStrength: 0 };
  workouts.forEach((w) => {
    if (w.type === "run") counts.run++;
    if (w.type === "strength" || w.type === "functional_strength") counts.functionalStrength++;
  });
  const total = goals.run + goals.strength + goals.functionalStrength;
  const completed =
    Math.min(counts.run, goals.run) +
    Math.min(counts.strength, goals.strength) +
    Math.min(counts.functionalStrength, goals.functionalStrength);
  const percent = total ? Math.min(100, (completed / total) * 100) : 100;
  const status = isCurrent
    ? "В процессе"
    : percent === 100
      ? "Идеальная"
      : percent >= 80
        ? "Хорошая"
        : percent >= 50
          ? "Средняя"
          : percent > 0
            ? "Слабая"
            : "Нет тренировок";
  return { counts, total, completed, percent, status };
}
export function runningSummary(workouts: Workout[]) {
  const runs = workouts.filter((w) => w.type === "run");
  const distance = runs.reduce((s, w) => s + (w.distanceKm || 0), 0);
  const minutes = runs.reduce((s, w) => s + (w.durationMinutes || 0), 0);
  const paceValue = distance
    ? Math.round(
        runs.reduce(
          (s, w) => s + (w.paceSecondsPerKm || 0) * (w.distanceKm || 0),
          0,
        ) / distance,
      )
    : 0;
  const hrMinutes = runs.reduce(
    (s, w) => s + (w.heartRate || 0) * (w.durationMinutes || 0),
    0,
  );
  return {
    distance,
    minutes,
    pace: paceValue,
    heartRate: minutes ? Math.round(hrMinutes / minutes) : 0,
  };
}
