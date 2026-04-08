import { useAuth } from '@/context/AuthContext';
import { fetchMyDashboard, updateMyDashboard } from '@/api/users';
import { useEffect, useMemo, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import Navbar from '@/components/layout/Navbar';

const WEEK_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const dateKey = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

export default function Dashboard() {
  const { user } = useAuth();
  const isHydrated = useRef(false);
  const saveTimeout = useRef(null);
  const [loadingDashboard, setLoadingDashboard] = useState(true);
  const [saveError, setSaveError] = useState('');
  const [lastSyncedAt, setLastSyncedAt] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const [workoutDone, setWorkoutDone] = useState(3);
  const workoutGoal = 5;

  const [food, setFood] = useState({ calories: 1560, target: 2200, protein: 92, water: 5 });
  const [sleepHours, setSleepHours] = useState(7.2);

  const [taskInput, setTaskInput] = useState('');
  const [tasks, setTasks] = useState([
    { id: 1, label: 'Morning stretch (15 min)', done: true },
    { id: 2, label: '30 min cardio session', done: false },
    { id: 3, label: 'Log meals for today', done: false },
  ]);

  const [completedDates, setCompletedDates] = useState([]);
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  const [steps, setSteps] = useState(6400);
  const [targetSteps, setTargetSteps] = useState(10000);
  const [activeMinutes, setActiveMinutes] = useState(46);
  const [targetActiveMinutes, setTargetActiveMinutes] = useState(60);
  const [weightKg, setWeightKg] = useState(72);
  const [heightCm, setHeightCm] = useState(173);
  const [restingHeartRate, setRestingHeartRate] = useState(62);
  const [mood, setMood] = useState('Focused');

  useEffect(() => {
    let mounted = true;

    const loadDashboard = async () => {
      try {
        const { data } = await fetchMyDashboard();
        const dashboard = data?.data?.dashboard;
        if (!mounted || !dashboard) return;

        setWorkoutDone(Number(dashboard.workoutDone ?? 3));
        setFood({
          calories: Number(dashboard.food?.calories ?? 1560),
          target: Number(dashboard.food?.target ?? 2200),
          protein: Number(dashboard.food?.protein ?? 92),
          water: Number(dashboard.food?.water ?? 5),
        });
        setSleepHours(Number(dashboard.sleepHours ?? 7.2));
        setSteps(Number(dashboard.steps ?? 6400));
        setTargetSteps(Number(dashboard.targetSteps ?? 10000));
        setActiveMinutes(Number(dashboard.activeMinutes ?? 46));
        setTargetActiveMinutes(Number(dashboard.targetActiveMinutes ?? 60));
        setWeightKg(Number(dashboard.weightKg ?? 72));
        setHeightCm(Number(dashboard.heightCm ?? 173));
        setRestingHeartRate(Number(dashboard.restingHeartRate ?? 62));
        setMood(typeof dashboard.mood === 'string' ? dashboard.mood : 'Focused');

        const mappedTasks = Array.isArray(dashboard.tasks)
          ? dashboard.tasks
              .filter((task) => task?.label)
              .map((task) => ({ id: task._id || String(Date.now() + Math.random()), label: task.label, done: !!task.done }))
          : [];

        if (mappedTasks.length) setTasks(mappedTasks);

        const mappedCompletedDates = Array.isArray(dashboard.completedDates)
          ? dashboard.completedDates.filter((item) => typeof item === 'string')
          : [];
        setCompletedDates(mappedCompletedDates);

        setLastSyncedAt(new Date().toLocaleTimeString());
      } catch {
        toast.error('Could not load dashboard data. Using local defaults.');
      } finally {
        if (mounted) {
          isHydrated.current = true;
          setLoadingDashboard(false);
        }
      }
    };

    loadDashboard();
    return () => {
      mounted = false;
    };
  }, []);

  const dashboardPayload = useMemo(
    () => ({
      workoutDone,
      workoutGoal,
      food,
      sleepHours,
      tasks: tasks.map((task) => ({ label: task.label, done: task.done })),
      completedDates,
      steps,
      targetSteps,
      activeMinutes,
      targetActiveMinutes,
      weightKg,
      heightCm,
      restingHeartRate,
      mood,
    }),
    [
      workoutDone,
      workoutGoal,
      food,
      sleepHours,
      tasks,
      completedDates,
      steps,
      targetSteps,
      activeMinutes,
      targetActiveMinutes,
      weightKg,
      heightCm,
      restingHeartRate,
      mood,
    ]
  );

  const saveDashboardNow = async () => {
    try {
      setIsSaving(true);
      await updateMyDashboard(dashboardPayload);
      setSaveError('');
      setLastSyncedAt(new Date().toLocaleTimeString());
      toast.success('Dashboard saved');
    } catch {
      setSaveError('Unable to save changes. Retrying on next update.');
      toast.error('Save failed');
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    if (!isHydrated.current) return;

    if (saveTimeout.current) clearTimeout(saveTimeout.current);
    saveTimeout.current = setTimeout(async () => {
      try {
        setIsSaving(true);
        await updateMyDashboard(dashboardPayload);
        setSaveError('');
        setLastSyncedAt(new Date().toLocaleTimeString());
      } catch {
        setSaveError('Unable to save changes. Retrying on next update.');
      } finally {
        setIsSaving(false);
      }
    }, 500);

    return () => {
      if (saveTimeout.current) clearTimeout(saveTimeout.current);
    };
  }, [dashboardPayload]);

  const addTask = (e) => {
    e.preventDefault();
    const cleaned = taskInput.trim();
    if (!cleaned) return;
    setTasks((prev) => [...prev, { id: Date.now(), label: cleaned, done: false }]);
    setTaskInput('');
  };

  const toggleTask = (id) => {
    setTasks((prev) => prev.map((task) => (task.id === id ? { ...task, done: !task.done } : task)));
  };

  const deleteTask = (id) => {
    setTasks((prev) => prev.filter((task) => task.id !== id));
  };

  const completedTasks = tasks.filter((task) => task.done).length;
  const todayTasksComplete = tasks.length > 0 && completedTasks === tasks.length;
  const workoutPercent = Math.min(100, Math.round((workoutDone / workoutGoal) * 100));
  const caloriePercent = Math.min(100, Math.round((food.calories / food.target) * 100));
  const proteinPercent = Math.min(100, Math.round((food.protein / 130) * 100));
  const waterPercent = Math.min(100, Math.round((food.water / 8) * 100));
  const stepsPercent = Math.min(100, Math.round((steps / targetSteps) * 100));
  const activeMinutesPercent = Math.min(100, Math.round((activeMinutes / targetActiveMinutes) * 100));

  const bmi = useMemo(() => {
    const meterHeight = heightCm / 100;
    if (!meterHeight) return 0;
    return weightKg / (meterHeight * meterHeight);
  }, [heightCm, weightKg]);

  const todayKey = useMemo(() => dateKey(new Date()), []);

  useEffect(() => {
    if (!isHydrated.current) return;
    setCompletedDates((prev) => {
      const hasToday = prev.includes(todayKey);
      if (todayTasksComplete && !hasToday) return [...prev, todayKey];
      if (!todayTasksComplete && hasToday) return prev.filter((item) => item !== todayKey);
      return prev;
    });
  }, [todayTasksComplete, todayKey]);

  const completedDateSet = useMemo(() => new Set(completedDates), [completedDates]);

  const calendarDays = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const first = new Date(year, month, 1);
    const startOffset = first.getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();

    const cells = [];
    for (let i = 0; i < startOffset; i += 1) cells.push(null);
    for (let day = 1; day <= totalDays; day += 1) cells.push(new Date(year, month, day));
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
  }, [currentMonth]);

  const monthLabel = currentMonth.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });

  const currentStreak = useMemo(() => {
    let streak = 0;
    const cursor = new Date();
    while (completedDateSet.has(dateKey(cursor))) {
      streak += 1;
      cursor.setDate(cursor.getDate() - 1);
    }
    return streak;
  }, [completedDateSet]);

  const monthCompletionRate = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const totalDays = new Date(year, month + 1, 0).getDate();
    let completed = 0;
    for (let day = 1; day <= totalDays; day += 1) {
      const key = dateKey(new Date(year, month, day));
      if (completedDateSet.has(key)) completed += 1;
    }
    return Math.round((completed / totalDays) * 100);
  }, [completedDateSet, currentMonth]);

  const weeklyWorkouts = [
    { name: 'Mon', done: true },
    { name: 'Tue', done: true },
    { name: 'Wed', done: false },
    { name: 'Thu', done: true },
    { name: 'Fri', done: false },
    { name: 'Sat', done: false },
    { name: 'Sun', done: false },
  ];

  const moodOptions = ['Focused', 'Energized', 'Tired', 'Stressed', 'Balanced'];

  return (
    <>
      <Navbar />
      <main className="dashboard dashboard-long">
        <div className="dashboard-header">
          <h1>Fitness Dashboard</h1>
          <p>Welcome back, <strong>{user?.name}</strong>. Here is your daily wellness snapshot.</p>
          <button className="save-btn" type="button" onClick={saveDashboardNow} disabled={isSaving || loadingDashboard}>
            {isSaving ? 'Saving...' : 'Save Now'}
          </button>
          {loadingDashboard ? <p className="dashboard-status">Syncing dashboard...</p> : null}
          {!loadingDashboard && !saveError && lastSyncedAt ? (
            <p className="dashboard-status">Auto-save enabled. Last synced at {lastSyncedAt}</p>
          ) : null}
          {saveError ? <p className="dashboard-status dashboard-status-error">{saveError}</p> : null}
        </div>

        <div className="dashboard-grid">
          <section className="card card-wide">
            <h3>Month-wise Task Heatmap</h3>
            <p className="card-subtitle">Calendar view with small cells. Today fills when all today's tasks are complete.</p>
            <div className="calendar-top">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setCurrentMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))}
              >
                Prev
              </button>
              <strong>{monthLabel}</strong>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setCurrentMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))}
              >
                Next
              </button>
            </div>

            <div className="calendar-grid" aria-label="Monthly task completion heatmap">
              {WEEK_DAYS.map((day) => (
                <span key={day} className="calendar-weekday">{day}</span>
              ))}
              {calendarDays.map((date, index) => {
                if (!date) return <span key={`blank-${index}`} className="calendar-cell is-empty" />;
                const key = dateKey(date);
                const isToday = key === todayKey;
                const isDone = completedDateSet.has(key) || (isToday && todayTasksComplete);
                const levelClass = isDone ? 'level-4' : 'level-0';

                return (
                  <span
                    key={key}
                    className={`calendar-cell ${levelClass} ${isToday ? 'is-today' : ''}`}
                    title={`${key} - ${isDone ? 'Completed' : 'Not completed'}`}
                  >
                    {date.getDate()}
                  </span>
                );
              })}
            </div>

            <div className="heatmap-legend">
              <span>Low</span>
              <div className="legend-scale">
                {[0, 1, 2, 3, 4].map((level) => (
                  <span key={level} className={`heat-cell level-${level}`} />
                ))}
              </div>
              <span>High</span>
            </div>
            <p className="task-summary">Month completion: <b>{monthCompletionRate}%</b> | Current streak: <b>{currentStreak}</b> days</p>
          </section>

          <section className="card">
            <h3>Workout Complete</h3>
            <p className="card-subtitle">Weekly goal tracking</p>
            <p><b>{workoutDone}</b> / {workoutGoal} workouts completed</p>
            <div className="meter" role="progressbar" aria-valuenow={workoutPercent} aria-valuemin="0" aria-valuemax="100">
              <div className="meter-fill meter-workout" style={{ width: `${workoutPercent}%` }} />
            </div>
            <div className="inline-actions">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setWorkoutDone((prev) => Math.max(0, prev - 1))}
              >
                Undo
              </button>
              <button
                type="button"
                className="btn-accent"
                onClick={() => setWorkoutDone((prev) => Math.min(workoutGoal, prev + 1))}
              >
                Mark Complete
              </button>
            </div>
          </section>

          <section className="card">
            <h3>Food Intake</h3>
            <p className="card-subtitle">Calories, protein, and hydration</p>
            <div className="metric-row">
              <span>Calories</span>
              <strong>{food.calories} / {food.target} kcal</strong>
            </div>
            <div className="meter"><div className="meter-fill meter-calories" style={{ width: `${caloriePercent}%` }} /></div>

            <div className="metric-row">
              <span>Protein</span>
              <strong>{food.protein} / 130 g</strong>
            </div>
            <div className="meter"><div className="meter-fill meter-protein" style={{ width: `${proteinPercent}%` }} /></div>

            <div className="metric-row">
              <span>Water</span>
              <strong>{food.water} / 8 glasses</strong>
            </div>
            <div className="meter"><div className="meter-fill meter-water" style={{ width: `${waterPercent}%` }} /></div>

            <div className="food-controls">
              <label>
                Calories
                <input
                  type="number"
                  min="0"
                  value={food.calories}
                  onChange={(e) => setFood((prev) => ({ ...prev, calories: Number(e.target.value) || 0 }))}
                />
              </label>
              <label>
                Protein (g)
                <input
                  type="number"
                  min="0"
                  value={food.protein}
                  onChange={(e) => setFood((prev) => ({ ...prev, protein: Number(e.target.value) || 0 }))}
                />
              </label>
              <label>
                Water (glasses)
                <input
                  type="number"
                  min="0"
                  value={food.water}
                  onChange={(e) => setFood((prev) => ({ ...prev, water: Number(e.target.value) || 0 }))}
                />
              </label>
            </div>
          </section>

          <section className="card">
            <h3>Sleeping Hours</h3>
            <p className="card-subtitle">Recovery and rest quality</p>
            <p>
              <b>{sleepHours.toFixed(1)} hrs</b> last night
            </p>
            <input
              className="sleep-range"
              type="range"
              min="3"
              max="10"
              step="0.1"
              value={sleepHours}
              onChange={(e) => setSleepHours(Number(e.target.value))}
            />
            <p className="sleep-label">
              {sleepHours < 6 ? 'Low sleep' : sleepHours < 8 ? 'Good sleep' : 'Excellent recovery'}
            </p>
          </section>

          <section className="card">
            <h3>Task Options</h3>
            <p className="card-subtitle">Plan and track your day</p>
            <form className="task-form" onSubmit={addTask}>
              <input
                type="text"
                placeholder="Add a new fitness task"
                value={taskInput}
                onChange={(e) => setTaskInput(e.target.value)}
              />
              <button type="submit" className="btn-accent">Add</button>
            </form>

            <ul className="task-list">
              {tasks.map((task) => (
                <li key={task.id} className={task.done ? 'is-done' : ''}>
                  <label>
                    <input type="checkbox" checked={task.done} onChange={() => toggleTask(task.id)} />
                    <span>{task.label}</span>
                  </label>
                  <button type="button" className="btn-link" onClick={() => deleteTask(task.id)}>Remove</button>
                </li>
              ))}
            </ul>

            <p className="task-summary">
              Completed <b>{completedTasks}</b> of <b>{tasks.length}</b> tasks
            </p>
          </section>

          <section className="card">
            <h3>Steps and Active Minutes</h3>
            <p className="card-subtitle">Daily movement targets</p>
            <div className="metric-row">
              <span>Steps</span>
              <strong>{steps} / {targetSteps}</strong>
            </div>
            <div className="meter"><div className="meter-fill meter-workout" style={{ width: `${stepsPercent}%` }} /></div>
            <div className="metric-row">
              <span>Active Minutes</span>
              <strong>{activeMinutes} / {targetActiveMinutes} min</strong>
            </div>
            <div className="meter"><div className="meter-fill meter-water" style={{ width: `${activeMinutesPercent}%` }} /></div>
            <div className="food-controls">
              <label>
                Steps
                <input type="number" min="0" value={steps} onChange={(e) => setSteps(Number(e.target.value) || 0)} />
              </label>
              <label>
                Active Minutes
                <input
                  type="number"
                  min="0"
                  value={activeMinutes}
                  onChange={(e) => setActiveMinutes(Number(e.target.value) || 0)}
                />
              </label>
            </div>
          </section>

          <section className="card">
            <h3>Body Metrics</h3>
            <p className="card-subtitle">Track weight and body composition indicators</p>
            <p><b>BMI:</b> {bmi.toFixed(1)}</p>
            <p><b>Resting Heart Rate:</b> {restingHeartRate} bpm</p>
            <p><b>Recovery Mood:</b> {mood}</p>
            <div className="food-controls">
              <label>
                Weight (kg)
                <input type="number" min="20" value={weightKg} onChange={(e) => setWeightKg(Number(e.target.value) || 0)} />
              </label>
              <label>
                Height (cm)
                <input type="number" min="100" value={heightCm} onChange={(e) => setHeightCm(Number(e.target.value) || 0)} />
              </label>
              <label>
                Resting HR (bpm)
                <input
                  type="number"
                  min="30"
                  value={restingHeartRate}
                  onChange={(e) => setRestingHeartRate(Number(e.target.value) || 0)}
                />
              </label>
              <label>
                Recovery Mood
                <select value={mood} onChange={(e) => setMood(e.target.value)}>
                  {moodOptions.map((item) => (
                    <option key={item} value={item}>{item}</option>
                  ))}
                </select>
              </label>
            </div>
          </section>

          <section className="card">
            <h3>Weekly Training Plan</h3>
            <p className="card-subtitle">Planned sessions for this week</p>
            <ul className="week-plan">
              {weeklyWorkouts.map((entry) => (
                <li key={entry.name} className={entry.done ? 'done' : ''}>
                  <span>{entry.name}</span>
                  <b>{entry.done ? 'Done' : 'Pending'}</b>
                </li>
              ))}
            </ul>
          </section>

          <section className="card card-wide">
            <h3>Performance Insights</h3>
            <p className="card-subtitle">Quick analytics for motivation and planning</p>
            <div className="insight-grid">
              <div>
                <p><b>Workout Goal Progress</b></p>
                <p>{workoutPercent}% complete this week</p>
              </div>
              <div>
                <p><b>Nutrition Consistency</b></p>
                <p>{Math.round((caloriePercent + proteinPercent + waterPercent) / 3)}% adherence today</p>
              </div>
              <div>
                <p><b>Recovery Score</b></p>
                <p>{sleepHours >= 8 ? 'Excellent' : sleepHours >= 7 ? 'Good' : 'Needs improvement'}</p>
              </div>
              <div>
                <p><b>Task Completion</b></p>
                <p>{tasks.length ? Math.round((completedTasks / tasks.length) * 100) : 0}% today</p>
              </div>
            </div>
          </section>

          <section className="card">
            <h3>Your Profile</h3>
            <p><b>Name:</b> {user?.name}</p>
            <p><b>Email:</b> {user?.email}</p>
            <p><b>Role:</b> {user?.role}</p>
            <p><b>Status:</b> {user?.isActive ? 'Active' : 'Inactive'}</p>
          </section>

          <section className="card">
            <h3>Account Info</h3>
            <p><b>Member since:</b> {new Date(user?.createdAt).toLocaleDateString()}</p>
            <p><b>User ID:</b> <code style={{ fontSize: '0.75rem' }}>{user?._id}</code></p>
          </section>

          <section className="card">
            <h3>Quick Links</h3>
            <p>Auth: JWT with auto-refresh</p>
            <p>DB: MongoDB + Mongoose</p>
            <p>API: Express REST</p>
          </section>
        </div>
      </main>
    </>
  );
}
