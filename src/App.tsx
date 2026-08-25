import { useEffect, useMemo, useState } from "react";
import {
  BicepsFlexed,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Dumbbell,
  Footprints,
  Heart,
  Pencil,
  Plus,
  Settings,
  Trash2,
  Zap,
} from "lucide-react";
import {
  bootstrap,
  deleteWorkout,
  getGoal,
  getWorkouts,
  saveGoal,
  saveWorkout,
} from "./db";
import {
  addDays,
  displayDate,
  monthName,
  pace,
  parseDuration,
  parsePace,
  progress,
  runningSummary,
  shiftMonth,
  today,
  typeLabel,
  weekStart,
} from "./domain";
import {
  defaultGoals,
  type GoalVersion,
  type StrengthFocus,
  type Workout,
  type WorkoutType,
} from "./types";
type Page = "calendar" | "add" | "runs" | "functional" | "settings" | "week";
const Icon = ({ type }: { type: WorkoutType }) =>
  type === "run" ? (
    <Footprints />
  ) : type === "strength" ? (
    <Dumbbell />
  ) : (
    <Zap />
  );
const focusLabel = (focus?: StrengthFocus) =>
  focus === "upper" ? "Верх" : focus === "lower" ? "Низ" : "Всё тело";
const LegIcon = () => (
  <svg
    aria-hidden="true"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M3.5 3.5h8.4c4.5 0 8.1 3.6 8.1 8.1v4.2c0 1.5.7 2.9 1.9 3.8" />
    <path d="M3.5 3.5v5.8c0 1.4 1.1 2.5 2.5 2.5h7.1l-.7 3.2c-.4 2.1.2 4.4 1.7 6l.3.3c.5.5 1.1.7 1.8.7h4.9c.8 0 1.5-.6 1.5-1.4 0-.7-.5-1.3-1.2-1.4l-3.5-.6c-1.1-.2-2.1-.8-2.8-1.7l-1.5-1.9" />
    <path d="M7 6.5h4" />
  </svg>
);
const FocusIcon = ({ focus }: { focus?: StrengthFocus }) =>
  focus === "upper" ? <BicepsFlexed /> : focus === "lower" ? <LegIcon /> : <Dumbbell />;
const newId = () => crypto.randomUUID();
export default function App() {
  const [items, setItems] = useState<Workout[]>([]);
  const [page, setPage] = useState<Page>("calendar");
  const [month, setMonth] = useState(today().slice(0, 7) + "-01");
  const [selectedWeek, setSelectedWeek] = useState(weekStart(today()));
  const [toast, setToast] = useState("");
  const [editing, setEditing] = useState<Workout | null>(null);
  const reload = async () => setItems(await getWorkouts());
  useEffect(() => {
    bootstrap().then(reload);
  }, []);
  const go = (p: Page) => setPage(p);
  const notify = (s: string) => {
    setToast(s);
    setTimeout(() => setToast(""), 2500);
  };
  const openAdd = () => {
    setEditing(null);
    go("add");
  };
  const openEdit = (workout: Workout) => {
    setEditing(workout);
    go("add");
  };
  const removeWorkout = async (workout: Workout) => {
    if (confirm("Удалить тренировку? Это действие нельзя отменить")) {
      await deleteWorkout(workout.id);
      await reload();
      notify("Тренировка удалена");
    }
  };
  return (
    <main>
      <div className="app">
        {page === "calendar" && (
          <CalendarPage
            items={items}
            month={month}
            setMonth={setMonth}
            openWeek={(w) => {
              setSelectedWeek(w);
              go("week");
            }}
            onAdd={openAdd}
          />
        )}{" "}
        {page === "week" && (
          <WeekPage
            items={items}
            start={selectedWeek}
            onBack={() => go("calendar")}
            onAdd={openAdd}
            reload={reload}
            notify={notify}
          />
        )}{" "}
        {page === "add" && (
          <WorkoutForm
            items={items}
            initialWorkout={editing}
            onBack={() => {
              setEditing(null);
              go("calendar");
            }}
            onSave={async (w) => {
              await saveWorkout(w);
              await reload();
              notify(editing ? "Тренировка обновлена" : "Тренировка сохранена");
              setEditing(null);
              go("calendar");
            }}
          />
        )}
        {page === "runs" && (
          <RunsPage items={items} onEdit={openEdit} onDelete={removeWorkout} />
        )}{" "}
        {page === "functional" && (
          <FunctionalPage items={items} onEdit={openEdit} onDelete={removeWorkout} />
        )}
        {page === "settings" && <SettingsPage onSave={notify} />}{" "}
        {page !== "week" && <Nav page={page} go={go} />}{" "}
        {toast && (
          <div role="status" className="toast">
            {toast}
          </div>
        )}
      </div>
    </main>
  );
}
function Nav({ page, go }: { page: Page; go: (p: Page) => void }) {
  const links = [
    { id: "calendar" as Page, Icon: CalendarDays, label: "Календарь" },
    { id: "runs" as Page, Icon: Footprints, label: "Бег" },
    { id: "functional" as Page, Icon: Dumbbell, label: "Функц.-силовые" },
    { id: "settings" as Page, Icon: Settings, label: "Настройки" },
  ];
  return (
    <nav aria-label="Основная навигация">
      {links.map(({ id, Icon, label }) => (
        <button
          className={page === id ? "active" : ""}
          onClick={() => go(id)}
          key={id}
        >
          <Icon />
          <span>{label}</span>
        </button>
      ))}
    </nav>
  );
}
function CalendarPage({
  items,
  month,
  setMonth,
  openWeek,
  onAdd,
}: {
  items: Workout[];
  month: string;
  setMonth: (x: string) => void;
  openWeek: (x: string) => void;
  onAdd: () => void;
}) {
  const first = new Date(`${month}T12:00:00`),
    start = weekStart(month),
    weeks = Array.from({ length: 6 }, (_, i) => addDays(start, i * 7));
  const [goalsByWeek, setGoalsByWeek] = useState<Record<string, GoalVersion["goals"]>>({});
  useEffect(() => {
    let active = true;
    Promise.all(
      weeks.map(async (week) => [week, (await getGoal(week)) || defaultGoals] as const),
    ).then((entries) => {
      if (active) setGoalsByWeek(Object.fromEntries(entries));
    });
    return () => {
      active = false;
    };
  }, [month]);
  const current = weekStart(today());
  return (
    <>
      <header>
        <h1>Календарь</h1>
        <button className="round" aria-label="Добавить тренировку" onClick={onAdd}><Plus /></button>
      </header>
      <section className="month-switch">
        <button
          aria-label="Предыдущий месяц"
          onClick={() => setMonth(shiftMonth(month, -1))}
        >
          <ChevronLeft />
        </button>
        <h2>{monthName(month)}</h2>
        <button
          aria-label="Следующий месяц"
          onClick={() => setMonth(shiftMonth(month, 1))}
        >
          <ChevronRight />
        </button>
      </section>
      <section className="calendar card">
        <div className="weekdays">
          {["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"].map((x) => (
            <span key={x}>{x}</span>
          ))}
        </div>
        {weeks.map((ws) => {
          const inWeek = items.filter((w) => weekStart(w.date) === ws),
            p = progress(inWeek, goalsByWeek[ws] || defaultGoals, ws === current);
          return (
            <button
              className={`calendar-week ${statusClass(p.status)}`}
              onClick={() => openWeek(ws)}
              key={ws}
            >
              {Array.from({ length: 7 }, (_, i) => {
                const date = addDays(ws, i),
                  d = new Date(`${date}T12:00:00`);
                return (
                  <span
                    className={`${date === today() ? "today" : ""} ${d.getMonth() !== first.getMonth() ? "muted" : ""}`}
                    key={date}
                  >
                    {d.getDate()}
                  </span>
                );
              })}
            </button>
          );
        })}
      </section>
      <CurrentWeek items={items} onAdd={onAdd} />
    </>
  );
}
function CurrentWeek({
  items,
  onAdd,
}: {
  items: Workout[];
  onAdd: () => void;
}) {
  const start = weekStart(today());
  const [goals, setGoals] = useState(defaultGoals);
  useEffect(() => { getGoal(start).then((goal) => setGoals(goal || defaultGoals)); }, [start]);
  const p = progress(items.filter((w) => weekStart(w.date) === start), goals, true);
  return (
    <section className="card current">
      <div>
        <h2>Эта неделя</h2>
        <span className="badge progress">{p.status}</span>
      </div>
      <strong>
        {p.completed} <small>из {p.total} тренировок</small>
      </strong>
      <Progress
        label="Бег"
        value={p.counts.run}
        goal={goals.run}
        icon={<Footprints />}
      />
      <Progress
        label="Функционально-силовые"
        value={p.counts.functionalStrength}
        goal={goals.functionalStrength}
        icon={<Zap />}
      />
      <button className="primary" onClick={onAdd}>
        <Plus />
        Добавить тренировку
      </button>
    </section>
  );
}
function Progress({
  label,
  value,
  goal,
  icon,
}: {
  label: string;
  value: number;
  goal: number;
  icon: React.ReactNode;
}) {
  return (
    <div className="progress-row">
      <span className="type-icon">{icon}</span>
      <span>{label}</span>
      <i>
        <b
          style={{
            width: `${Math.min(100, (value / Math.max(goal, 1)) * 100)}%`,
          }}
        />
      </i>
      <em>
        {value} / {goal}
      </em>
    </div>
  );
}
function WeekPage({
  items,
  start,
  onBack,
  onAdd,
  reload,
  notify,
}: {
  items: Workout[];
  start: string;
  onBack: () => void;
  onAdd: () => void;
  reload: () => Promise<void>;
  notify: (x: string) => void;
}) {
  const [goals, setGoals] = useState(defaultGoals);
  useEffect(() => {
    getGoal(start).then((x) => setGoals(x || defaultGoals));
  }, [start]);
  const work = items.filter((w) => weekStart(w.date) === start),
    p = progress(work, goals, start === weekStart(today())),
    summary = runningSummary(work);
  return (
    <>
      <header>
        <button className="round" onClick={onBack}>
          <ChevronLeft />
        </button>
        <h1>Детали недели</h1>
      </header>
      <section className="card hero">
        <span className={`badge ${statusClass(p.status)}`}>{p.status}</span>
        <h2>
          {displayDate(start)} — {displayDate(addDays(start, 6))}
        </h2>
        <strong>
          {p.completed} <small>из {p.total} тренировок</small>
        </strong>
      </section>
      <section className="card">
        <h2>Цели</h2>
        <Progress
          label="Бег"
          value={p.counts.run}
          goal={goals.run}
          icon={<Footprints />}
        />
      <Progress
        label="Функционально-силовые"
          value={p.counts.functionalStrength}
          goal={goals.functionalStrength}
          icon={<Zap />}
        />
      </section>
      {summary.distance > 0 && (
        <section className="card">
          <h2>Бег за неделю</h2>
          <div className="metrics">
            <Metric
              label="Километры"
              value={`${summary.distance.toFixed(1)} км`}
            />
            <Metric label="Время" value={`${summary.minutes} мин`} />
            <Metric label="Темп" value={`${pace(summary.pace)} /км`} />
            <Metric label="Пульс" value={`${summary.heartRate} уд/мин`} />
          </div>
        </section>
      )}
      <section>
        <h2 className="section-title">Тренировки</h2>
        {work.length ? (
          work.map((w) => (
            <article className="workout" key={w.id}>
              <span className="type-icon">
                <Icon type={w.type} />
              </span>
              <div>
                <b>{typeLabel(w.type)}</b>
                <small>
                  {displayDate(w.date)} ·{" "}
                  {w.type === "run"
                    ? `${w.distanceKm} км · ${pace(w.paceSecondsPerKm)}/км`
                    : w.type === "strength"
                      ? focusLabel(w.strengthFocus)
                      : w.notes || "Состоялась"}
                </small>
              </div>
              <button
                className="icon-danger"
                aria-label="Удалить тренировку"
                onClick={async () => {
                  if (
                    confirm("Удалить тренировку? Это действие нельзя отменить")
                  ) {
                    await deleteWorkout(w.id);
                    await reload();
                    notify("Тренировка удалена");
                  }
                }}
              >
                <Trash2 />
              </button>
            </article>
          ))
        ) : (
          <p className="empty">В этой неделе пока нет тренировок.</p>
        )}
      </section>
      <button className="primary sticky" onClick={onAdd}>
        <Plus />
        Добавить тренировку
      </button>
    </>
  );
}
function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <small>{label}</small>
      <b>{value}</b>
    </div>
  );
}
function WorkoutForm({
  items,
  initialWorkout,
  onBack,
  onSave,
}: {
  items: Workout[];
  initialWorkout: Workout | null;
  onBack: () => void;
  onSave: (w: Workout) => void;
}) {
  const [type, setType] = useState<WorkoutType>(
      initialWorkout?.type === "run" ? "run" : "functional_strength",
    ),
    [date, setDate] = useState(initialWorkout?.date || today()),
    [focus, setFocus] = useState<StrengthFocus>(initialWorkout?.strengthFocus || "upper"),
    [notes, setNotes] = useState(initialWorkout?.notes || ""),
    [distance, setDistance] = useState(
      initialWorkout?.distanceKm?.toString().replace(".", ",") || "",
    ),
    [paceValue, setPaceValue] = useState(pace(initialWorkout?.paceSecondsPerKm)),
    [minutes, setMinutes] = useState(
      initialWorkout?.durationMinutes?.toString() || "",
    ),
    [hr, setHr] = useState(initialWorkout?.heartRate?.toString() || ""),
    [error, setError] = useState(""),
    [repeatMessage, setRepeatMessage] = useState("");
  const submit = () => {
    const now = new Date().toISOString();
    if (type === "run") {
      const p = parsePace(paceValue);
      const duration = parseDuration(minutes);
      const distanceKm = Number(distance.replace(",", "."));
      if (
        !date ||
        !(distanceKm > 0) ||
        p === null ||
        duration === null ||
        !(duration > 0) ||
        !(+hr > 0)
      ) {
        setError(
          "Заполните дату, километраж, темп мм:сс, длительность (минуты или ч:мм) и пульс.",
        );
        return;
      }
      onSave({
        id: initialWorkout?.id || newId(),
        type,
        date,
        createdAt: initialWorkout?.createdAt || now,
        updatedAt: now,
        distanceKm,
        paceSecondsPerKm: p,
        durationMinutes: duration,
        heartRate: +hr,
      });
    } else
      onSave({
        id: initialWorkout?.id || newId(),
        type,
        date,
        createdAt: initialWorkout?.createdAt || now,
        updatedAt: now,
        strengthFocus: type === "functional_strength" ? focus : undefined,
        notes: notes.trim() || undefined,
      });
  };
  const repeat = () => {
    const isFunctional = (w: Workout) =>
      (w.type === "functional_strength" || w.type === "strength") &&
      Boolean(w.notes?.trim());
    const newest = (workouts: Workout[]) =>
      workouts.sort((a, b) => b.date.localeCompare(a.date))[0];
    const latest =
      newest(items.filter((w) => isFunctional(w) && w.strengthFocus === focus)) ||
      newest(items.filter(isFunctional));
    if (latest?.notes) {
      setNotes(latest.notes);
      setRepeatMessage(`Программа из тренировки ${displayDate(latest.date)} добавлена.`);
    } else {
      setRepeatMessage("Пока нет прошлой тренировки с сохранённой программой.");
    }
  };
  return (
    <>
      <header>
        <button className="round" onClick={onBack}>
          <ChevronLeft />
        </button>
        <h1>{initialWorkout ? "Редактировать тренировку" : "Новая тренировка"}</h1>
      </header>
      <section className="card">
        <h2>Тип тренировки</h2>
        <div className="types">
          {(["run", "functional_strength"] as WorkoutType[]).map(
            (t) => (
              <button
                className={type === t ? "selected" : ""}
                onClick={() => setType(t)}
                key={t}
              >
                <Icon type={t} />
                <span>{typeLabel(t)}</span>
              </button>
            ),
          )}
        </div>
      </section>
      <section className="card form">
        <label>
          Дата
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </label>
        {type === "run" && (
          <>
            <label>
              Дистанция, км
              <input
                inputMode="decimal"
                value={distance}
                onChange={(e) => setDistance(e.target.value)}
                placeholder="5,2"
              />
            </label>
            <label>
              Темп, мм:сс / км
              <input
                inputMode="text"
                autoCapitalize="none"
                autoCorrect="off"
                value={paceValue}
                onChange={(e) => setPaceValue(e.target.value)}
                placeholder="6:10"
              />
            </label>
            <label>
              Длительность, мин или ч:мм
              <input
                inputMode="text"
                autoCapitalize="none"
                autoCorrect="off"
                value={minutes}
                onChange={(e) => setMinutes(e.target.value)}
                placeholder="32 или 1:20"
              />
            </label>
            <label>
              Средний пульс, уд/мин
              <input
                inputMode="numeric"
                value={hr}
                onChange={(e) => setHr(e.target.value)}
                placeholder="148"
              />
            </label>
          </>
        )}
        {type === "functional_strength" && (
          <>
            <div className="segmented">
              <button
                className={focus === "upper" ? "chosen" : ""}
                onClick={() => setFocus("upper")}
              >
                Верх
              </button>
              <button
                className={focus === "lower" ? "chosen" : ""}
                onClick={() => setFocus("lower")}
              >
                Низ
              </button>
              <button
                className={focus === "full_body" ? "chosen" : ""}
                onClick={() => setFocus("full_body")}
              >
                Всё тело
              </button>
            </div>
            <button className="secondary" onClick={repeat}>
              Повторить прошлую тренировку
            </button>
            {repeatMessage && <p className="repeat-message">{repeatMessage}</p>}
          </>
        )}{" "}
        {type !== "run" && (
          <label>
            {type === "strength"
              ? "Упражнения и подходы"
              : "Программа тренировки"}
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={
                type === "strength"
                  ? "Жим гантелей — 3×10"
                  : "Берпи — 3×12\nПланка — 3×45 сек"
              }
            />
          </label>
        )}
        {error && <p className="error">{error}</p>}
      </section>
      <button className="primary sticky" onClick={submit}>
        Сохранить тренировку
      </button>
    </>
  );
}
function RunsPage({
  items,
  onEdit,
  onDelete,
}: {
  items: Workout[];
  onEdit: (w: Workout) => void;
  onDelete: (w: Workout) => void;
}) {
  const runs = items.filter((w) => w.type === "run"),
    s = runningSummary(
      runs.filter((w) => w.date.slice(0, 7) === today().slice(0, 7)),
    );
  return (
    <>
      <header>
        <h1>Бег</h1>
      </header>
      <section className="card hero">
        <small>Этот месяц</small>
        <strong>
          {s.distance.toFixed(1)} <small>км</small>
        </strong>
        <p>
          {
            runs.filter((w) => w.date.slice(0, 7) === today().slice(0, 7))
              .length
          }{" "}
          пробежек за месяц
        </p>
      </section>
      <h2 className="section-title">Все пробежки</h2>
      {runs.map((w) => (
        <article className="run-card" key={w.id}>
          <WorkoutActions workout={w} onEdit={onEdit} onDelete={onDelete} />
          <small>{displayDate(w.date)}</small>
          <b>
            {w.distanceKm?.toFixed(2).replace(".", ",")} <small>км</small>
          </b>
          <div>
            <span>
              <Clock3 />
              {pace(w.paceSecondsPerKm)} /км
            </span>
            <span>
              <CalendarDays />
              {w.durationMinutes} мин
            </span>
            <span>
              <Heart />
              {w.heartRate} уд/мин
            </span>
          </div>
        </article>
      ))}
    </>
  );
}
function WorkoutActions({
  workout,
  onEdit,
  onDelete,
}: {
  workout: Workout;
  onEdit: (workout: Workout) => void;
  onDelete: (workout: Workout) => void;
}) {
  return (
    <span className="workout-actions" aria-label="Действия с тренировкой">
      <button aria-label="Редактировать тренировку" onClick={() => onEdit(workout)}>
        <Pencil />
      </button>
      <button
        className="delete-action"
        aria-label="Удалить тренировку"
        onClick={() => onDelete(workout)}
      >
        <Trash2 />
      </button>
    </span>
  );
}
function FunctionalPage({
  items,
  onEdit,
  onDelete,
}: {
  items: Workout[];
  onEdit: (workout: Workout) => void;
  onDelete: (workout: Workout) => void;
}) {
  const [opened, setOpened] = useState<string | null>(null);
  const workouts = items.filter(
    (w) => w.type === "functional_strength" || w.type === "strength",
  );
  return (
    <>
      <header>
        <h1>Функционально-силовые</h1>
      </header>
      <h2 className="section-title">Все тренировки</h2>
      {workouts.length ? (
        <section className="functional-list" aria-label="Список тренировок">
          {workouts.map((workout) => {
            const isOpened = opened === workout.id;
            const focus = focusLabel(workout.strengthFocus);
            return (
              <article
                className={`functional-card ${isOpened ? "opened" : ""}`}
                key={workout.id}
              >
                <WorkoutActions workout={workout} onEdit={onEdit} onDelete={onDelete} />
                <button
                  className="functional-card-main"
                  aria-expanded={isOpened}
                  onClick={() => setOpened(isOpened ? null : workout.id)}
                >
                <span className="type-icon">
                  <FocusIcon focus={workout.strengthFocus} />
                </span>
                <span className="functional-card-content">
                  <b>{displayDate(workout.date)}</b>
                  <small className="functional-preview">
                    {workout.notes || `${focus} · программа не указана`}
                  </small>
                  {isOpened && (
                    <small className="functional-program">
                      {workout.notes || "Программа не указана"}
                    </small>
                  )}
                </span>
                </button>
              </article>
            );
          })}
        </section>
      ) : (
        <p className="empty">Здесь появятся функционально-силовые тренировки.</p>
      )}
    </>
  );
}
function SettingsPage({ onSave }: { onSave: (x: string) => void }) {
  const [date, setDate] = useState(weekStart(today())),
    [goals, setGoals] = useState(defaultGoals),
    [theme, setTheme] = useState<"light" | "dark" | "system">("system");
  useEffect(() => {
    getGoal(date).then((g) => setGoals(g || defaultGoals));
  }, [date]);
  useEffect(() => {
    document.documentElement.dataset.theme = theme === "system" ? "" : theme;
  }, [theme]);
  return (
    <>
      <header>
        <h1>Настройки</h1>
      </header>
      <section className="card form">
        <h2>Цели на неделю</h2>
        <label>
          Неделя начинается
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(weekStart(e.target.value))}
          />
        </label>
        {(["run", "functionalStrength"] as const).map((k) => (
          <label key={k}>
            {k === "run"
              ? "Бег"
              : "Функционально-силовые"}
            <input
              type="number"
              min="0"
              value={goals[k]}
              onChange={(e) =>
                setGoals({ ...goals, [k]: Math.max(0, +e.target.value) })
              }
            />
          </label>
        ))}
        <button
          className="primary"
          onClick={async () => {
            await saveGoal({ weekStart: date, goals } as GoalVersion);
            onSave("Цели недели сохранены");
          }}
        >
          Сохранить цели
        </button>
      </section>
      <section className="card">
        <h2>Тема</h2>
        <div className="segmented">
          {(["system", "light", "dark"] as const).map((x) => (
            <button
              className={theme === x ? "chosen" : ""}
              onClick={() => setTheme(x)}
              key={x}
            >
              {x === "system"
                ? "Как в системе"
                : x === "light"
                  ? "Светлая"
                  : "Тёмная"}
            </button>
          ))}
        </div>
      </section>
      <p className="privacy">
        Данные хранятся только на этом устройстве, в браузере.
      </p>
    </>
  );
}
const statusClass = (s: string) =>
  s === "Идеальная"
    ? "ideal"
    : s === "Хорошая"
      ? "good"
      : s === "Средняя"
        ? "medium"
        : s === "Слабая"
          ? "low"
          : s === "В процессе"
            ? "progress"
            : "empty";
