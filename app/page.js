'use client';


import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Activity,
  AlertCircle,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  BarChart3,
  Battery,
  BatteryCharging,
  Bike,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Circle,
  Clock,
  Dumbbell,
  Flame,
  Footprints,
  Heart,
  History,
  Home,
  Info,
  Minus,
  Pause,
  Play,
  Plus,
  RotateCcw,
  Save,
  Settings,
  ShieldCheck,
  SkipForward,
  Target,
  Timer as TimerIcon,
  Trash2,
  TrendingUp,
  Trophy,
  Waves,
  Weight,
  X,
  Zap,
} from 'lucide-react';

import { ThemeControl } from '../components/ceed/CeedAppearance';
import GymCloudSync from '../components/GymCloudSync';
import TrainingCoach from '../components/TrainingCoach';
import { useGymCloudSync } from '../hooks/useGymCloudSync';
import { GymSyncStatus } from '../components/GymCloudSync';

const STORAGE = 'gym-training-os-v8';
const WATER_GOAL = 2500;


const BLUE = '#3984ff';


const PROGRAM = {
  'Chest & Triceps': {
    category: 'UPPER BODY',
    focus: 'Chest strength and pressing power',
    exercises: [
      { name: 'Barbell Bench Press', sets: 4, reps: '6–8', target: 8, rest: 120, muscle: 'Chest' },
      { name: 'Incline Dumbbell Press', sets: 3, reps: '8–12', target: 12, rest: 90, muscle: 'Chest' },
      { name: 'Cable Chest Fly', sets: 3, reps: '12–15', target: 15, rest: 60, muscle: 'Chest' },
      { name: 'Seated Chest Press', sets: 3, reps: '8–12', target: 12, rest: 90, muscle: 'Chest' },
      { name: 'Rope Triceps Pushdown', sets: 3, reps: '10–15', target: 15, rest: 60, muscle: 'Triceps' },
      { name: 'Overhead Triceps Extension', sets: 3, reps: '10–12', target: 12, rest: 60, muscle: 'Triceps' },
    ],
  },
  'Back & Biceps': {
    category: 'UPPER BODY',
    focus: 'Back development and pulling strength',
    exercises: [
      { name: 'Lat Pulldown', sets: 4, reps: '8–12', target: 12, rest: 90, muscle: 'Back' },
      { name: 'Seated Cable Row', sets: 3, reps: '8–12', target: 12, rest: 90, muscle: 'Back' },
      { name: 'Chest-Supported Row', sets: 3, reps: '8–12', target: 12, rest: 90, muscle: 'Back' },
      { name: 'Face Pull', sets: 3, reps: '12–15', target: 15, rest: 60, muscle: 'Rear delts' },
      { name: 'Dumbbell Bicep Curl', sets: 3, reps: '10–12', target: 12, rest: 60, muscle: 'Biceps' },
      { name: 'Hammer Curl', sets: 3, reps: '10–12', target: 12, rest: 60, muscle: 'Biceps' },
    ],
  },
  Shoulders: {
    category: 'UPPER BODY',
    focus: 'Shoulder strength and balanced development',
    exercises: [
      { name: 'Seated Dumbbell Shoulder Press', sets: 4, reps: '6–10', target: 10, rest: 120, muscle: 'Shoulders' },
      { name: 'Dumbbell Lateral Raise', sets: 4, reps: '12–15', target: 15, rest: 60, muscle: 'Shoulders' },
      { name: 'Rear Delt Fly', sets: 3, reps: '12–15', target: 15, rest: 60, muscle: 'Rear delts' },
      { name: 'Cable Lateral Raise', sets: 3, reps: '12–15', target: 15, rest: 60, muscle: 'Shoulders' },
      { name: 'Face Pull', sets: 3, reps: '12–15', target: 15, rest: 60, muscle: 'Rear delts' },
    ],
  },
  Legs: {
    category: 'LOWER BODY',
    focus: 'Strength, stability and jumping power',
    exercises: [
      { name: 'Barbell Back Squat', sets: 4, reps: '5–8', target: 8, rest: 180, muscle: 'Quads' },
      { name: 'Romanian Deadlift', sets: 3, reps: '6–10', target: 10, rest: 150, muscle: 'Hamstrings' },
      { name: 'Bulgarian Split Squat', sets: 3, reps: '8–10', target: 10, rest: 90, muscle: 'Quads' },
      { name: 'Leg Curl', sets: 3, reps: '10–15', target: 15, rest: 75, muscle: 'Hamstrings' },
      { name: 'Standing Calf Raise', sets: 4, reps: '12–20', target: 20, rest: 60, muscle: 'Calves' },
      { name: 'Tibialis Raise', sets: 3, reps: '15–20', target: 20, rest: 45, muscle: 'Shins' },
    ],
  },
  'Upper Body': {
    category: 'UPPER BODY',
    focus: 'Balanced upper-body strength',
    exercises: [
      { name: 'Barbell Bench Press', sets: 3, reps: '6–10', target: 10, rest: 120, muscle: 'Chest' },
      { name: 'Lat Pulldown', sets: 3, reps: '8–12', target: 12, rest: 90, muscle: 'Back' },
      { name: 'Incline Dumbbell Press', sets: 3, reps: '8–12', target: 12, rest: 90, muscle: 'Chest' },
      { name: 'Seated Cable Row', sets: 3, reps: '8–12', target: 12, rest: 90, muscle: 'Back' },
      { name: 'Dumbbell Lateral Raise', sets: 3, reps: '12–15', target: 15, rest: 60, muscle: 'Shoulders' },
      { name: 'Dumbbell Bicep Curl', sets: 2, reps: '10–12', target: 12, rest: 60, muscle: 'Biceps' },
    ],
  },
  'Full Body': {
    category: 'FULL BODY',
    focus: 'Efficient full-body strength',
    exercises: [
      { name: 'Barbell Back Squat', sets: 3, reps: '6–8', target: 8, rest: 150, muscle: 'Quads' },
      { name: 'Barbell Bench Press', sets: 3, reps: '6–10', target: 10, rest: 120, muscle: 'Chest' },
      { name: 'Lat Pulldown', sets: 3, reps: '8–12', target: 12, rest: 90, muscle: 'Back' },
      { name: 'Romanian Deadlift', sets: 3, reps: '8–10', target: 10, rest: 120, muscle: 'Hamstrings' },
      { name: 'Seated Dumbbell Shoulder Press', sets: 2, reps: '8–12', target: 12, rest: 90, muscle: 'Shoulders' },
      { name: 'Plank', sets: 3, reps: '30–60 sec', target: 60, rest: 45, muscle: 'Core' },
    ],
  },
};


const BASKETBALL = {
  'Jump Training': {
    focus: 'Explosive power and vertical jump',
    duration: 35,
    impact: 'HIGH',
    exercises: [
      { name: 'Dynamic Warm-up', sets: 1, reps: '5 min', target: 5, rest: 30, muscle: 'Warm-up' },
      { name: 'Pogo Jumps', sets: 3, reps: '10', target: 10, rest: 60, muscle: 'Plyometrics' },
      { name: 'Countermovement Jumps', sets: 4, reps: '4', target: 4, rest: 120, muscle: 'Plyometrics' },
      { name: 'Approach Jumps', sets: 4, reps: '3', target: 3, rest: 120, muscle: 'Jumping' },
      { name: 'Single-Leg Calf Raises', sets: 3, reps: '12 each', target: 12, rest: 60, muscle: 'Calves' },
    ],
  },
  'Shooting Session': {
    focus: 'Shooting technique and consistency',
    duration: 45,
    impact: 'LOW',
    exercises: [
      { name: 'Close-Range Form Shooting', sets: 3, reps: '10 shots', target: 10, rest: 30, muscle: 'Shooting' },
      { name: 'Mid-Range Shooting', sets: 5, reps: '10 shots', target: 10, rest: 45, muscle: 'Shooting' },
      { name: 'Catch-and-Shoot', sets: 5, reps: '10 shots', target: 10, rest: 45, muscle: 'Shooting' },
      { name: 'Free Throws', sets: 5, reps: '10 shots', target: 10, rest: 30, muscle: 'Shooting' },
    ],
  },
  'Ball Handling': {
    focus: 'Control, coordination and speed',
    duration: 30,
    impact: 'LOW',
    exercises: [
      { name: 'Stationary Pound Dribbles', sets: 3, reps: '30 sec each hand', target: 30, rest: 30, muscle: 'Handling' },
      { name: 'Crossovers', sets: 3, reps: '30 sec', target: 30, rest: 30, muscle: 'Handling' },
      { name: 'Between-the-Legs Dribbles', sets: 3, reps: '30 sec', target: 30, rest: 30, muscle: 'Handling' },
      { name: 'Cone Dribbling', sets: 4, reps: '1 run', target: 1, rest: 45, muscle: 'Handling' },
      { name: 'Full-Speed Change of Direction', sets: 4, reps: '1 run', target: 1, rest: 60, muscle: 'Agility' },
    ],
  },
  'Conditioning': {
    focus: 'Basketball-specific endurance',
    duration: 30,
    impact: 'HIGH',
    exercises: [
      { name: 'Dynamic Warm-up', sets: 1, reps: '5 min', target: 5, rest: 30, muscle: 'Warm-up' },
      { name: 'Court Suicides', sets: 4, reps: '1 run', target: 1, rest: 90, muscle: 'Conditioning' },
      { name: 'Defensive Slides', sets: 4, reps: '20 sec', target: 20, rest: 60, muscle: 'Defence' },
      { name: 'Transition Sprints', sets: 4, reps: '1 run', target: 1, rest: 75, muscle: 'Conditioning' },
    ],
  },
  'Open Run': {
    focus: 'Pickup games and match conditioning',
    duration: 60,
    impact: 'HIGH',
    exercises: [
      { name: 'Dynamic Warm-up', sets: 1, reps: '8 min', target: 8, rest: 30, muscle: 'Warm-up' },
      { name: 'Skill Preparation', sets: 1, reps: '10 min', target: 10, rest: 30, muscle: 'Skills' },
      { name: 'Pickup Games', sets: 4, reps: '10 min', target: 10, rest: 120, muscle: 'Gameplay' },
      { name: 'Cool-down', sets: 1, reps: '5 min', target: 5, rest: 30, muscle: 'Recovery' },
    ],
  },
};


const ALTERNATIVES = {
  'Barbell Bench Press': ['Dumbbell Bench Press', 'Machine Chest Press', 'Smith Machine Bench Press', 'Push-ups', 'Close-Grip Bench Press', 'Floor Press', 'Resistance-Band Chest Press'],
  'Incline Dumbbell Press': ['Incline Barbell Press', 'Incline Machine Press', 'Incline Push-ups', 'Smith Machine Incline Press', 'Low-Incline Dumbbell Press'],
  'Cable Chest Fly': ['Dumbbell Fly', 'Pec Deck', 'Resistance Band Fly', 'Low-to-High Cable Fly', 'High-to-Low Cable Fly', 'Single-Arm Cable Fly'],
  'Seated Chest Press': ['Dumbbell Bench Press', 'Machine Chest Press', 'Push-ups', 'Smith Machine Bench Press', 'Floor Press'],
  'Rope Triceps Pushdown': ['Straight-Bar Pushdown', 'Single-Arm Cable Pushdown', 'Dumbbell Kickback', 'Close-Grip Push-ups', 'Assisted Dip', 'EZ-Bar Pushdown'],
  'Overhead Triceps Extension': ['Dumbbell Overhead Extension', 'Cable Overhead Extension', 'Skull Crushers', 'Single-Arm Cable Extension', 'EZ-Bar French Press'],
  'Lat Pulldown': ['Assisted Pull-ups', 'Pull-ups', 'Neutral-Grip Pulldown', 'Single-Arm Cable Pulldown', 'Resistance-Band Pulldown', 'Close-Grip Pulldown'],
  'Seated Cable Row': ['Dumbbell Row', 'Chest-Supported Row', 'Machine Row', 'T-Bar Row', 'One-Arm Cable Row', 'Inverted Row'],
  'Chest-Supported Row': ['Dumbbell Row', 'Seated Cable Row', 'Machine Row', 'T-Bar Row', 'Seal Row', 'One-Arm Dumbbell Row'],
  'Face Pull': ['Rear Delt Fly', 'Band Face Pull', 'Reverse Pec Deck', 'Cable Rear-Delt Row', 'Bent-Over Rear-Delt Raise'],
  'Dumbbell Bicep Curl': ['EZ-Bar Curl', 'Cable Curl', 'Preacher Curl', 'Incline Dumbbell Curl', 'Bayesian Cable Curl', 'Concentration Curl'],
  'Hammer Curl': ['Rope Hammer Curl', 'Cross-Body Hammer Curl', 'Dumbbell Curl', 'Reverse Curl', 'Cross-Body Cable Curl'],
  'Seated Dumbbell Shoulder Press': ['Machine Shoulder Press', 'Barbell Overhead Press', 'Landmine Press', 'Arnold Press', 'Neutral-Grip Dumbbell Press'],
  'Dumbbell Lateral Raise': ['Cable Lateral Raise', 'Lateral Raise Machine', 'Resistance-Band Lateral Raise', 'Lean-Away Cable Raise', 'Partial Lateral Raise'],
  'Rear Delt Fly': ['Reverse Pec Deck', 'Cable Rear Delt Fly', 'Face Pull', 'Bent-Over Dumbbell Raise', 'Chest-Supported Rear-Delt Raise'],
  'Cable Lateral Raise': ['Dumbbell Lateral Raise', 'Lateral Raise Machine', 'Resistance-Band Lateral Raise', 'Lean-Away Cable Raise'],
  'Barbell Back Squat': ['Goblet Squat', 'Hack Squat', 'Leg Press', 'Smith Machine Squat', 'Front Squat', 'Safety-Bar Squat', 'Box Squat'],
  'Romanian Deadlift': ['Dumbbell Romanian Deadlift', 'Cable Pull-Through', '45-Degree Back Extension', 'Good Morning', 'Single-Leg Romanian Deadlift', 'Hip Thrust'],
  'Bulgarian Split Squat': ['Reverse Lunge', 'Walking Lunge', 'Step-ups', 'Split Squat', 'Leg Press', 'Goblet Reverse Lunge'],
  'Leg Curl': ['Seated Leg Curl', 'Lying Leg Curl', 'Swiss Ball Leg Curl', 'Slider Hamstring Curl', 'Nordic Hamstring Curl'],
  'Standing Calf Raise': ['Seated Calf Raise', 'Leg Press Calf Raise', 'Single-Leg Calf Raise', 'Donkey Calf Raise'],
  'Tibialis Raise': ['Band Tibialis Raise', 'Wall Tibialis Raise', 'Seated Tibialis Raise', 'Toe Raises'],
  'Plank': ['Dead Bug', 'Bird Dog', 'Hollow Hold', 'Side Plank', 'Ab Wheel Rollout', 'Pallof Press'],
  'Dumbbell Bench Press': ['Barbell Bench Press', 'Machine Chest Press', 'Push-ups', 'Smith Machine Bench Press'],
  'Machine Chest Press': ['Barbell Bench Press', 'Dumbbell Bench Press', 'Push-ups'],
  'Back Squat': ['Goblet Squat', 'Leg Press', 'Hack Squat', 'Smith Machine Squat', 'Front Squat'],
  'Dumbbell Row': ['Seated Cable Row', 'Chest-Supported Row', 'Machine Row', 'T-Bar Row', 'One-Arm Cable Row'],
  'Dumbbell Shoulder Press': ['Machine Shoulder Press', 'Landmine Press', 'Arnold Press', 'Seated Dumbbell Shoulder Press'],
  'Dumbbell Curl': ['EZ-Bar Curl', 'Cable Curl', 'Preacher Curl', 'Incline Dumbbell Curl'],
  'Lateral Raise': ['Cable Lateral Raise', 'Dumbbell Lateral Raise', 'Lateral Raise Machine'],
  'Cable Fly': ['Dumbbell Fly', 'Pec Deck', 'Resistance Band Fly', 'Single-Arm Cable Fly'],
  'Dumbbell Shrug': ['Barbell Shrug', 'Machine Shrug', 'Cable Shrug', 'Farmer Carry'],
};


const DAYS = Object.keys(PROGRAM);
const WATER_AMOUNTS = [150, 250, 350, 500, 750, 1000];
const REST_PRESETS = [30, 45, 60, 90, 120, 180, 300];


function dateKey(date = new Date()) {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function loggedSessions(state) {
  const sessions = [...(state.sessions || [])];
  for (const entry of state.history || []) {
    if (!entry.date || !entry.day) continue;
    const matched = sessions.some((session) => session.type === 'train' && (
      (entry.sessionId && session.id === entry.sessionId) ||
      (session.date === entry.date && (session.name === entry.day || session.name === 'Gym session'))
    ));
    if (!matched) sessions.push({ id: entry.sessionId || `${entry.date}|${entry.day}`, date: entry.date, name: entry.day, type: 'train', duration: 0 });
  }
  return sessions;
}

function convertWeightUnit(state, unit) {
  if (unit === state.settings.weightUnit) return state;
  const factor = unit === 'lb' ? 2.2046226218 : 1 / 2.2046226218;
  const convert = (weight) => Number((safeNumber(weight) * factor).toFixed(2));
  return {
    ...state,
    settings: { ...state.settings, weightUnit: unit },
    loads: Object.fromEntries(Object.entries(state.loads || {}).map(([key, weight]) => [key, convert(weight)])),
    history: state.history.map((entry) => ({ ...entry, weight: convert(entry.weight), volume: convert(entry.volume), weights: entry.weights?.map(convert), sets: entry.sets?.map((set) => ({ ...set, weight: convert(set.weight) })) })),
    drafts: Object.fromEntries(Object.entries(state.drafts || {}).map(([key, draft]) => [key, { ...draft, sets: draft.sets.map((set) => ({ ...set, weight: set.weight === '' ? '' : String(convert(set.weight)) })) }])),
  };
}

// Keep duration in minutes in stored logs so existing history remains compatible.
function parseCardioDuration(value) {
  const text = String(value).trim();
  if (!/^\d+:([0-5]\d)(?::([0-5]\d))?$/.test(text)) return null;
  const parts = text.split(':').map(Number);
  const seconds = parts.length === 3
    ? parts[0] * 3600 + parts[1] * 60 + parts[2]
    : parts[0] * 60 + parts[1];
  return Number.isSafeInteger(seconds) && seconds > 0 ? seconds / 60 : null;
}

function formatCardioTime(minutes) {
  const total = Math.max(0, Math.round(safeNumber(minutes) * 60));
  const seconds = String(total % 60).padStart(2, '0');
  const mins = Math.floor(total / 60);
  return mins >= 60 ? `${Math.floor(mins / 60)}:${String(mins % 60).padStart(2, '0')}:${seconds}` : `${mins}:${seconds}`;
}

function cardioActivity(log) {
  return log.activity || 'Run';
}

function cardioSession(entry) {
  return {
    id: entry.id,
    date: entry.date,
    type: cardioActivity(entry) === 'Run' ? 'run' : 'cardio',
    name: `${entry.environment ? `${entry.environment} ` : ''}${cardioActivity(entry)}`,
    duration: Math.round(safeNumber(entry.duration) * 60),
  };
}

function cardioCalories(logs) {
  return logs.reduce((total, log) => total + Math.max(0, safeNumber(log.calories)), 0);
}

function formatPace(minutes, km) {
  const seconds = Math.round(safeNumber(minutes) * 60 / Math.max(0.001, safeNumber(km)));
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
}

function downloadBackup(data) {
  const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = `gym-training-backup-${dateKey()}.json`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function today() {
  return dateKey(new Date());
}

function makeId() {
  return typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}


function emptyState() {
  return {
    supersets: {},
    drafts: {},
    history: [],
    sessions: [],
    water: {},
    runLogs: [],
    bbLogs: [],
    settings: {
      weightUnit: 'kg',
      waterGoal: WATER_GOAL,
      restDuration: 90,
    },
    loads: {},
    soreness: 1,
    energy: 3,
    sleep: 7,
    lastTab: 'Home',
  };
}


function safeNumber(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}


function formatDuration(seconds) {
  const s = Math.max(0, Math.floor(seconds || 0));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;


  if (h) return `${h}h ${m}m`;
  if (m) return `${m}m ${String(sec).padStart(2, '0')}s`;
  return `${sec}s`;
}


function formatDate(date) {
  if (!date) return '—';
  return new Date(`${date}T12:00:00`).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}


function getWeekStart(date = new Date()) {
  const d = new Date(date);
  const day = d.getDay() || 7;
  d.setDate(d.getDate() - day + 1);
  d.setHours(0, 0, 0, 0);
  return d;
}


function dateDaysAgo(days) {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() - days);
  return dateKey(d);
}


function getExerciseHistory(history, exercise, day) {
  return (history || [])
    .filter((item) => item.exercise === exercise && (!day || item.day === day))
    .sort((a, b) => {
      const dateOrder = String(b.date || '').localeCompare(String(a.date || ''));
      if (dateOrder) return dateOrder;
      return String(b.createdAt || b.id || '').localeCompare(String(a.createdAt || a.id || ''));
    });
}


function bestCompletedSetWeight(entry) {
  if (Array.isArray(entry?.sets)) {
    const completedSets = entry.sets.filter((set) => set?.done);
    if (!completedSets.length) return 0;
    return Math.max(0, ...completedSets.map((set) => safeNumber(set.weight)));
  }
  return Math.max(0, safeNumber(entry?.weight));
}

function getRepRange(exercise) {
  const text = String(exercise?.reps || '');
  const timed = /sec|min|second|minute/i.test(text);
  const range = text.match(/(\d+)\s*[-–—]\s*(\d+)/);

  if (range) {
    return {
      min: Math.max(1, Number(range[1])),
      max: Math.max(Number(range[1]), Number(range[2])),
      timed,
    };
  }

  const single = text.match(/\d+/);
  const target = Math.max(1, safeNumber(single?.[0], exercise?.target || 8));
  return { min: target, max: target, timed };
}

function completedSetsForEntry(entry) {
  return Array.isArray(entry?.sets) ? entry.sets.filter((set) => set?.done) : [];
}

function workingWeightForEntry(entry) {
  const weights = completedSetsForEntry(entry)
    .map((set) => safeNumber(set.weight))
    .filter((weight) => weight > 0)
    .sort((a, b) => a - b);

  if (weights.length) return weights[Math.floor((weights.length - 1) / 2)];
  return Math.max(0, safeNumber(entry?.weight));
}

function progressionIncrement(weight, exerciseName, unit) {
  const smallerJump = /curl|lateral raise|rear delt|fly|face pull|pushdown|extension|calf|tibialis|dumbbell|cable|machine|lat pulldown|chest press/i.test(exerciseName);
  const metric = String(unit || 'kg').toLowerCase() !== 'lb';

  if (metric) {
    if (smallerJump) return weight < 10 ? 0.5 : 1;
    return weight < 20 ? 1.25 : 2.5;
  }
  if (smallerJump) return weight < 20 ? 1 : 2.5;
  return weight < 45 ? 2.5 : 5;
}

function roundToNearest(value, step) {
  return Number((Math.round(value / step) * step).toFixed(2));
}

function progressionRecommendation(exercise, day, history, unit = 'kg') {
  const previous = getExerciseHistory(history, exercise.name, day)[0];
  const range = getRepRange(exercise);

  if (!previous) {
    return {
      kind: 'start',
      title: 'Build your baseline',
      detail: 'Log your actual reps and completed sets. Next session suggestions will be based on your performance.',
      nextLoad: null,
    };
  }

  const completedSets = completedSetsForEntry(previous);
  const plannedSets = Math.max(1, safeNumber(previous.plannedSets, Array.isArray(previous.sets) ? previous.sets.length : safeNumber(previous.completedSets, 1)));
  const baseWeight = workingWeightForEntry(previous);
  const reps = completedSets.map((set) => safeNumber(set.reps));

  if (!completedSets.length || !Array.isArray(previous.sets) || !reps.some((rep) => rep > 0)) {
    return {
      kind: 'start',
      title: 'Log reps for tailored progression',
      detail: 'Your earlier entry does not include enough set-by-set data. Record actual reps next time to unlock a precise recommendation.',
      nextLoad: baseWeight > 0 ? baseWeight : null,
    };
  }

  if (completedSets.length < plannedSets) {
    return {
      kind: 'hold',
      title: 'Repeat this load and complete every set',
      detail: `You logged ${completedSets.length} of ${plannedSets} planned sets. Finish the full workout before increasing the weight.`,
      nextLoad: baseWeight > 0 ? baseWeight : null,
    };
  }

  const allAtTop = reps.every((rep) => rep >= range.max);
  const belowRange = reps.filter((rep) => rep < range.min).length;
  const rir = safeNumber(previous.rir, 2);

  if (baseWeight > 0 && !range.timed && belowRange >= Math.ceil(reps.length / 2)) {
    const nextLoad = Math.max(0, roundToNearest(baseWeight * 0.95, unit === 'lb' ? 1 : 0.5));
    return {
      kind: 'reduce',
      title: 'Use a slightly lighter load',
      detail: `At least half of your completed sets fell below ${range.min} reps. Try about 5% lighter and rebuild clean reps.`,
      nextLoad: nextLoad > 0 && nextLoad < baseWeight ? nextLoad : baseWeight,
    };
  }

  if (allAtTop && baseWeight > 0 && !range.timed && rir >= 2 && completedSets.every((set) => safeNumber(set.weight) === baseWeight)) {
    const increment = progressionIncrement(baseWeight, exercise.name, unit);
    const nextLoad = Number((baseWeight + increment).toFixed(2));
    return {
      kind: 'up',
      title: `Increase to ${nextLoad} ${unit} next time`,
      detail: `Every logged set reached ${range.max} reps with ${rir}+ reps in reserve. Add a small amount of weight and build from ${range.min} reps again.`,
      nextLoad,
    };
  }

  if (allAtTop && baseWeight > 0 && !range.timed) {
    return {
      kind: 'hold',
      title: 'Keep the load and repeat the top reps',
      detail: `You reached ${range.max} reps, but logged only ${rir} reps in reserve. Repeat this weight until the sets feel more controlled.`,
      nextLoad: baseWeight,
    };
  }

  if (allAtTop && baseWeight <= 0) {
    return {
      kind: 'up',
      title: range.timed ? 'Progress the hold or make it harder' : 'Make the next variation slightly harder',
      detail: `All sets reached ${range.max}${range.timed ? ' seconds' : ' reps'}. Increase the duration or choose a small, manageable difficulty step.`,
      nextLoad: null,
    };
  }

  const target = range.timed ? `${range.max} seconds` : `${range.max} reps`;
  return {
    kind: 'build',
    title: 'Keep the load and build reps',
    detail: `Stay with this weight and add 1 rep to the sets below ${target}. Increase the load only after every planned set reaches the top of the range with at least 2 reps in reserve.`,
    nextLoad: baseWeight > 0 ? baseWeight : null,
  };
}

function suggestedLoad(exercise, day, history, state, unit = 'kg') {
  const progression = progressionRecommendation(exercise, day, history, unit);
  if (progression.nextLoad !== null && progression.nextLoad > 0) return progression.nextLoad;

  const previous = getExerciseHistory(history, exercise.name, day)[0];
  const previousWorkingWeight = previous ? workingWeightForEntry(previous) : 0;
  if (previousWorkingWeight > 0) return previousWorkingWeight;

  const saved = safeNumber(state.loads?.[exercise.name], 0);
  if (saved > 0) return saved;
  return 0;
}


function nextSessionSets(exercise, day, history, state, unit = 'kg') {
  const previous = getExerciseHistory(history, exercise.name, day)[0];
  const recommendation = progressionRecommendation(exercise, day, history, unit);
  const range = getRepRange(exercise);
  const load = suggestedLoad(exercise, day, history, state, unit);
  const completed = completedSetsForEntry(previous);
  const fullWorkout = completed.length >= Math.max(1, safeNumber(previous?.plannedSets, previous?.sets?.length || exercise.sets));
  const resetReps = recommendation.kind === 'reduce' || (recommendation.kind === 'up' && recommendation.nextLoad > 0);
  const buildReps = fullWorkout && safeNumber(previous?.rir, 2) >= 2 && recommendation.kind === 'build' && !range.timed;
  return Array.from({ length: exercise.sets }, (_, index) => {
    const old = previous?.sets?.[index];
    const hasPerformance = old?.done && safeNumber(old.reps) > 0;
    const reps = resetReps || !hasPerformance ? range.min
      : Math.min(range.max, Math.max(range.min, safeNumber(old.reps) + (buildReps ? 1 : 0)));
    const weight = !resetReps && hasPerformance ? Math.max(0, safeNumber(old.weight)) : load;
    return { weight: weight > 0 ? String(weight) : '', reps: String(reps), done: false };
  });
}

function addSuperset(pairs, first, second, id) {
  if (!first || !second || first === second || pairs.some((pair) => pair.exercises.includes(first) || pair.exercises.includes(second))) return pairs;
  return [...pairs, { id, exercises: [first, second] }];
}

function groupSupersets(exercises, pairs) {
  const used = new Set();
  const groups = [];
  for (const exercise of exercises) {
    if (used.has(exercise.originalName)) continue;
    const pair = pairs.find((item) => item.exercises.includes(exercise.originalName) && item.exercises.every((name) => exercises.some((candidate) => candidate.originalName === name)));
    const members = pair ? pair.exercises.map((name) => exercises.find((item) => item.originalName === name)) : [exercise];
    members.forEach((item) => used.add(item.originalName));
    groups.push({ pair, exercises: members });
  }
  return groups;
}


function getRecovery(state) {
  const firstDay = dateDaysAgo(6);
  const todayKey = today();
  const isRecent = (item) => Boolean(item?.date) && item.date >= firstDay && item.date <= todayKey;

  const recentBasketball = (state.bbLogs || []).filter(isRecent);
  const recentRuns = (state.runLogs || []).filter(isRecent);
  const recentGym = (state.sessions || []).filter(
    (session) => isRecent(session) && session.type === 'train'
  );
  const recentHistory = (state.history || []).filter(isRecent);

  // Workout logs count as actual gym activity even when the optional session timer was not used.
  const gymWorkoutKeys = new Set();
  recentGym.forEach((session) => {
    const name = String(session.name || 'Gym session');
    // If a generic timer overlaps with exercises logged on the same date, count the
    // detailed workout entry instead of counting the timer as a second gym session.
    const genericName = /^gym session$/i.test(name);
    const hasExerciseLog = recentHistory.some((item) => item.date === session.date);
    if (genericName && hasExerciseLog) return;
    gymWorkoutKeys.add(`${session.date}|${name.toLowerCase()}`);
  });
  recentHistory.forEach((item) => {
    if (item.day) gymWorkoutKeys.add(`${item.date}|${item.day.toLowerCase()}`);
  });

  // Count unique lower-body days/splits rather than every exercise row as a separate workout.
  const lowerBodyWorkoutKeys = new Set();
  recentGym.forEach((session) => {
    if (/legs|full\s*body/i.test(String(session.name || ''))) {
      lowerBodyWorkoutKeys.add(`${session.date}|${String(session.name).toLowerCase()}`);
    }
  });
  recentHistory.forEach((item) => {
    if (/legs|full\s*body/i.test(String(item.day || ''))) {
      lowerBodyWorkoutKeys.add(`${item.date}|${String(item.day).toLowerCase()}`);
    }
  });

  const basketballLoad = recentBasketball.reduce((sum, log) => {
    const duration = Math.max(0, safeNumber(log.duration));
    const impact = String(log.impact || 'MODERATE').toUpperCase();
    const factor = impact === 'HIGH' ? 1.5 : impact === 'LOW' ? 0.65 : 1;
    return sum + duration * factor;
  }, 0);

  const runningLoad = recentRuns.reduce((sum, log) => {
    const distance = Math.max(0, safeNumber(log.distance));
    const duration = Math.max(0, safeNumber(log.duration)); // Run log durations are minutes.
    const effort = String(log.intensity || 'MODERATE').toUpperCase();
    const factor = effort === 'HARD' ? 1.5 : effort === 'EASY' ? 0.75 : 1;
    const distanceLoad = ['Run', 'Walk'].includes(cardioActivity(log)) ? distance * 6 : 0;
    return sum + Math.max(duration, distanceLoad) * factor;
  }, 0);

  const lowerBodyGymSessions = lowerBodyWorkoutKeys.size;
  let score = 100;
  score -= Math.min(35, basketballLoad * 0.25);
  score -= Math.min(25, runningLoad * 0.2);
  score -= Math.min(18, lowerBodyGymSessions * 4);
  score -= Math.max(0, safeNumber(state.soreness, 1) - 2) * 18;
  score -= Math.max(0, 7 - safeNumber(state.sleep, 7)) * 4;
  score -= Math.max(0, 3 - safeNumber(state.energy, 3)) * 8;
  score = Math.max(0, Math.min(100, Math.round(score)));

  let status = 'READY';
  let adjustment = 1;
  if (score < 50) {
    status = 'PROTECT';
    adjustment = 0.5;
  } else if (score < 75) {
    status = 'MODERATE';
    adjustment = 0.75;
  }

  return {
    score,
    status,
    adjustment,
    basketballLoad: Math.round(basketballLoad),
    runningLoad: Math.round(runningLoad),
    legGymLoad: lowerBodyGymSessions,
    lowerBodyGymSessions,
    basketballSessions: recentBasketball.length,
    runningSessions: recentRuns.length,
    gymSessions: gymWorkoutKeys.size,
  };
}

function adjustedPlan(day, recovery) {
  const original = PROGRAM[day]?.exercises || [];


  if (!['Legs', 'Full Body'].includes(day) || recovery.status === 'READY') {
    return {
      exercises: original,
      adjusted: false,
      scale: 1,
    };
  }


  const scale = recovery.adjustment;


  return {
    exercises: original.map((exercise, index) => {
      let sets = Math.max(1, Math.floor(exercise.sets * scale));


      if (recovery.status === 'PROTECT' && index === 0) {
        sets = Math.min(2, sets);
      }


      return { ...exercise, sets };
    }),
    adjusted: true,
    scale,
  };
}


function IconButton({ children, onClick, title, disabled = false, className = '' }) {
  return (
    <button
      type="button"
      className={`icon-button ${className}`}
      onClick={onClick}
      title={title}
      aria-label={title}
      disabled={disabled}
    >
      {children}
    </button>
  );
}


function StatCard({ label, value, detail, icon: Icon, accent = false }) {
  return (
    <div className={`stat-card ${accent ? 'stat-card-accent' : ''}`}>
      <div className="stat-top">
        <span>{label}</span>
        {Icon && <Icon size={18} />}
      </div>
      <div className="stat-value">{value}</div>
      {detail && <div className="stat-detail">{detail}</div>}
    </div>
  );
}


function SectionHeading({ eyebrow, title, subtitle, action }) {
  return (
    <div className="section-heading">
      <div>
        {eyebrow && <div className="eyebrow">{eyebrow}</div>}
        <h2>{title}</h2>
        {subtitle && <p>{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}


function ProgressBar({ value, max = 100 }) {
  const percentage = max > 0 ? Math.max(0, Math.min(100, (value / max) * 100)) : 0;


  return (
    <div className="progress-track">
      <div className="progress-fill" style={{ width: `${percentage}%` }} />
    </div>
  );
}


function Timer({ initial = 90, onClose }) {
  const [duration, setDuration] = useState(initial);
  const [remaining, setRemaining] = useState(initial);
  const [running, setRunning] = useState(false);
  const [deadline, setDeadline] = useState(null);
  const [customMinutes, setCustomMinutes] = useState('');
  const [timerLoaded, setTimerLoaded] = useState(false);
  const initialRef = useRef(initial);

  // Use a deadline rather than decrementing once per interval. Background-tab throttling
  // will therefore not make the rest timer drift or run longer than the selected duration.
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(`${STORAGE}-rest`) || 'null');
      if (saved && Number.isFinite(saved.duration) && saved.duration > 0) {
        setDuration(saved.duration);
        setRemaining(saved.deadline ? Math.max(0, Math.ceil((saved.deadline - Date.now()) / 1000)) : Math.max(0, safeNumber(saved.remaining)));
        setRunning(Boolean(saved.running && saved.deadline));
        setDeadline(saved.deadline || null);
      }
    } catch { /* Keep default timer if device state is invalid. */ }
    setTimerLoaded(true);
  }, []);

  useEffect(() => {
    if (initialRef.current === initial) return;
    initialRef.current = initial;
    setDuration(initial);
    setRemaining(initial);
    setRunning(false);
    setDeadline(null);
  }, [initial]);

  useEffect(() => {
    if (!timerLoaded) return;
    try { localStorage.setItem(`${STORAGE}-rest`, JSON.stringify({ duration, remaining, running, deadline })); }
    catch { /* Training data saving reports storage errors separately. */ }
  }, [duration, remaining, running, deadline, timerLoaded]);

  useEffect(() => {
    if (!running || deadline === null) return undefined;

    const tick = () => {
      const next = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
      setRemaining(next);
      if (next === 0) {
        setRunning(false);
        setDeadline(null);
      }
    };

    tick();
    const interval = window.setInterval(tick, 250);
    return () => window.clearInterval(interval);
  }, [running, deadline]);

  const setPreset = (seconds) => {
    const safeDuration = Math.max(1, Math.min(10800, Math.round(seconds)));
    setDuration(safeDuration);
    setRemaining(safeDuration);
    setRunning(false);
    setDeadline(null);
  };

  const applyCustom = () => {
    const minutes = Number(customMinutes);
    if (!Number.isFinite(minutes) || minutes <= 0 || minutes > 180) return;
    setPreset(Math.round(minutes * 60));
    setCustomMinutes('');
  };

  const startTimer = () => {
    const startFrom = remaining <= 0 ? duration : remaining;
    setRemaining(startFrom);
    setDeadline(Date.now() + startFrom * 1000);
    setRunning(true);
  };

  const pauseTimer = () => {
    if (deadline !== null) {
      setRemaining(Math.max(0, Math.ceil((deadline - Date.now()) / 1000)));
    }
    setRunning(false);
    setDeadline(null);
  };

  const reset = () => {
    setRemaining(duration);
    setRunning(false);
    setDeadline(null);
  };

  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;

  return (
    <div className="timer-panel">
      <div className="timer-header">
        <div>
          <div className="eyebrow">REST INTERVAL</div>
          <h3>Recovery timer</h3>
        </div>
        {onClose && (
          <IconButton title="Close timer" onClick={onClose}>
            <X size={18} />
          </IconButton>
        )}
      </div>

      <div className={`timer-display ${remaining === 0 ? 'timer-finished' : ''}`}>
        {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
      </div>

      {remaining === 0 && (
        <div className="timer-complete">
          <CheckCircle2 size={16} /> Rest complete. Get ready for your next set.
        </div>
      )}

      <div className="timer-presets">
        {REST_PRESETS.map((preset) => (
          <button
            type="button"
            key={preset}
            className={duration === preset ? 'preset active' : 'preset'}
            onClick={() => setPreset(preset)}
          >
            {preset >= 60 ? `${preset / 60}m` : `${preset}s`}
          </button>
        ))}
      </div>

      <form
        className="timer-custom"
        onSubmit={(event) => {
          event.preventDefault();
          applyCustom();
        }}
      >
        <input
          type="number"
          min="0.5"
          max="180"
          step="0.5"
          value={customMinutes}
          onChange={(event) => setCustomMinutes(event.target.value)}
          placeholder="Custom minutes"
          aria-label="Custom rest duration in minutes"
        />
        <button type="submit" className="button button-secondary">Set</button>
      </form>

      <div className="timer-controls">
        <button type="button" className="button button-primary" onClick={running ? pauseTimer : startTimer}>
          {running ? <Pause size={17} /> : <Play size={17} />}
          {running ? 'Pause' : remaining === 0 ? 'Restart timer' : 'Start timer'}
        </button>
        <button type="button" className="button button-secondary" onClick={reset}>
          <RotateCcw size={16} /> Reset
        </button>
      </div>
    </div>
  );
}

function ExerciseCard({
  exercise,
  index,
  day,
  unit,
  initialSets,
  superset,
  history,
  onSave,
  onRest,
  onSubstitute,
  draft,
  onDraftChange,
  onNewEntry,
}) {
  const [entryId] = useState(makeId);
  const [showAlternatives, setShowAlternatives] = useState(false);
  const [expanded, setExpanded] = useState(true);
  const currentDraft = draft || {
    id: entryId,
    sets: initialSets,
    rir: '2',
  };
  const { sets, rir } = currentDraft;
  const setSets = (update) => onDraftChange({ ...currentDraft, sets: update(sets) });
  const setRir = (value) => onDraftChange({ ...currentDraft, rir: value });

  const completed = sets.filter((set) => set.done).length;
  const previous = getExerciseHistory(history, exercise.name, day)[0];
  const progression = progressionRecommendation(exercise, day, history, unit);
  const alternatives = ALTERNATIVES[exercise.originalName || exercise.name] || ALTERNATIVES[exercise.name] || [];


  const updateSet = (setIndex, field, value) => {
    setSets((current) => current.map((set, i) => (
      i === setIndex ? { ...set, [field]: value } : set
    )));
  };


  const toggleSet = (setIndex) => {
    setSets((current) => current.map((set, i) => (
      i === setIndex ? { ...set, done: !set.done } : set
    )));
  };


  const saveExercise = () => {
    if (completed === 0) {
      if (typeof window !== 'undefined') window.alert('Mark at least one completed set before saving this exercise.');
      return;
    }

    if (sets.some((set) => set.done && (!Number.isFinite(Number(set.weight)) || Number(set.weight) < 0 || !Number.isFinite(Number(set.reps)) || Number(set.reps) <= 0))) {
      window.alert('Completed sets need a non-negative weight and reps greater than zero.');
      return;
    }
    onDraftChange(currentDraft);
    const normalizedSets = sets.map((set) => ({
      weight: safeNumber(set.weight),
      reps: safeNumber(set.reps),
      done: Boolean(set.done),
    }));
    const completedSets = normalizedSets.filter((set) => set.done);
    const bestCompletedWeight = Math.max(0, ...completedSets.map((set) => set.weight));
    const volume = completedSets.reduce((sum, set) => sum + set.weight * set.reps, 0);

    onSave({
      id: currentDraft.id,
      date: today(),
      day,
      exercise: exercise.name,
      originalExercise: exercise.originalName || exercise.name,
      supersetId: superset?.id || null,
      supersetPartner: superset?.partner || null,
      sets: normalizedSets,
      weights: normalizedSets.map((set) => set.weight),
      reps: normalizedSets.map((set) => set.reps),
      weight: bestCompletedWeight,
      rir: safeNumber(rir, 2),
      volume,
      completedSets: completed,
      plannedSets: exercise.sets,
      pr: false,
      sessionId: null,
    });
  };


  return (
    <article className="exercise-card" id={`exercise-${index}`} tabIndex={-1}>
      <div className="exercise-heading">
        <button
          type="button"
          className="exercise-toggle"
          onClick={() => setExpanded((value) => !value)}
          aria-expanded={expanded}
        >
          <div className={`exercise-number ${completed === exercise.sets ? 'exercise-number-done' : ''}`}>
            {completed === exercise.sets ? <Check size={17} /> : String(index + 1).padStart(2, '0')}
          </div>
          <div className="exercise-title-wrap">
            <h3>{superset ? `${superset.label} · ` : ''}{exercise.name}</h3>
            <p>{exercise.sets} sets · {exercise.reps} reps · {exercise.rest}s rest</p>
          </div>
          <ChevronDown className={expanded ? 'chevron-open' : ''} size={19} />
        </button>
      </div>


      <p className="muted-copy" style={{ padding: '0 18px' }}>Fresh entries fill each set with your next-session targets. Adjust them to record what you actually lift.</p>
      {previous && (
        <div className="previous-performance">
          <History size={14} />
          Previous: {safeNumber(previous.weight)} {unit} · {formatDate(previous.date)}
        </div>
      )}

      <div className={`progression-hint progression-${progression.kind}`}>
        <TrendingUp size={15} />
        <div>
          <strong>{progression.title}</strong>
          <p>{progression.detail}</p>
        </div>
      </div>

      {expanded && (
        <>
          <div className="set-table">
            <div className="set-table-header">
              <span>SET</span>
              <span>WEIGHT ({unit})</span>
              <span>REPS</span>
              <span>DONE</span>
            </div>


            {sets.map((set, setIndex) => (
              <div className={`set-row ${set.done ? 'set-row-done' : ''}`} key={setIndex}>
                <span className="set-number">{setIndex + 1}</span>
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  value={set.weight}
                  onChange={(event) => updateSet(setIndex, 'weight', event.target.value)}
                  aria-label={`Set ${setIndex + 1} weight`}
                />
                <input
                  type="number"
                  min="0"
                  value={set.reps}
                  onChange={(event) => updateSet(setIndex, 'reps', event.target.value)}
                  aria-label={`Set ${setIndex + 1} reps`}
                />
                <button
                  type="button"
                  className={`set-check ${set.done ? 'set-check-done' : ''}`}
                  onClick={() => toggleSet(setIndex)}
                  aria-label={`${set.done ? 'Uncomplete' : 'Complete'} set ${setIndex + 1}`}
                >
                  {set.done ? <Check size={16} /> : <Circle size={17} />}
                </button>
              </div>
            ))}
          </div>


          <div className="exercise-bottom">
            <label className="rir-control">
              Reps in reserve
              <select value={rir} onChange={(event) => setRir(event.target.value)}>
                <option value="0">0 — Failure</option>
                <option value="1">1</option>
                <option value="2">2</option>
                <option value="3">3</option>
                <option value="4">4+</option>
              </select>
            </label>


            <div className="exercise-actions">
              <button type="button" className="text-button" onClick={() => setShowAlternatives((value) => !value)}>
                <RotateCcw size={15} /> Swap
              </button>
              <button type="button" className="text-button" onClick={() => {
                if (superset?.nextIndex != null) {
                  const partner = document.getElementById(`exercise-${superset.nextIndex}`);
                  partner?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  partner?.focus({ preventScroll: true });
                } else onRest(exercise.rest);
              }}>
                <TimerIcon size={15} /> {superset?.nextIndex != null ? 'Next exercise' : superset ? 'Round rest' : 'Rest'}
              </button>
              <button type="button" className="button button-primary button-small" onClick={saveExercise}>
                <Save size={14} /> {history.some((item) => item.id === currentDraft.id) ? 'Update' : 'Save'}
              </button>
            </div>
          </div>


          <button type="button" className="text-button" onClick={() => { if (window.confirm('Start a new entry for this exercise? Save current sets first.')) onNewEntry(); }}>New exercise entry</button>
          {showAlternatives && (
            <div className="alternatives-panel">
              <div className="eyebrow">EXERCISE ALTERNATIVES</div>
              {alternatives.length ? alternatives.map((alternative) => (
                <button
                  type="button"
                  key={alternative}
                  className="alternative-option"
                  onClick={() => {
                    onSubstitute(alternative);
                    setShowAlternatives(false);
                  }}
                >
                  <span>{alternative}</span>
                  <ArrowRight size={15} />
                </button>
              )) : (
                <p>No alternatives are configured for this exercise yet.</p>
              )}
            </div>
          )}
        </>
      )}
    </article>
  );
}


function WaterCard({ amount, goal, onAdd, onRemove }) {
  const percentage = Math.min(100, Math.round((amount / Math.max(1, goal)) * 100));


  return (
    <section className="panel water-panel">
      <div className="panel-heading">
        <div className="panel-icon"><Waves size={19} /></div>
        <div>
          <h3>Hydration</h3>
          <p>Daily water intake</p>
        </div>
        <div className="water-amount">{(amount / 1000).toFixed(2)} <small>L</small></div>
      </div>


      <ProgressBar value={amount} max={goal} />


      <div className="water-progress-label">
        <span>{percentage}% of daily goal</span>
        <span>{goal.toLocaleString()} ml goal</span>
      </div>


      <div className="water-actions">
        {WATER_AMOUNTS.map((value) => (
          <button type="button" className="water-add" key={value} onClick={() => onAdd(value)}>
            <Plus size={14} /> {value >= 1000 ? `${value / 1000}L` : `${value}ml`}
          </button>
        ))}
        <button type="button" className="water-remove" onClick={onRemove} title="Remove 250 ml">
          <Minus size={15} />
        </button>
      </div>
    </section>
  );
}


function ReadinessCard({ recovery, state, setState }) {
  const statusClass = recovery.status.toLowerCase();


  return (
    <section className="panel readiness-panel">
      <div className="panel-heading">
        <div className="panel-icon"><BatteryCharging size={19} /></div>
        <div>
          <h3>Recovery check</h3>
          <p>Training load and readiness</p>
        </div>
        <div className={`readiness-badge ${statusClass}`}>{recovery.status}</div>
      </div>


      <div className="readiness-score-row">
        <div>
          <span className="eyebrow">READINESS SCORE</span>
          <div className="readiness-score">{recovery.score}<small>/100</small></div>
        </div>
        <div className="readiness-score-icon">
          {recovery.score >= 75 ? <Zap size={26} /> : recovery.score >= 50 ? <Battery size={26} /> : <ShieldCheck size={26} />}
        </div>
      </div>


      <ProgressBar value={recovery.score} />


      <div className="recovery-inputs">
        <label>
          <span>Soreness</span>
          <select
            value={state.soreness}
            onChange={(event) => setState((current) => ({ ...current, soreness: Number(event.target.value) }))}
          >
            <option value="1">1 — None</option>
            <option value="2">2 — Mild</option>
            <option value="3">3 — Moderate</option>
            <option value="4">4 — High</option>
            <option value="5">5 — Severe</option>
          </select>
        </label>


        <label>
          <span>Energy</span>
          <select
            value={state.energy}
            onChange={(event) => setState((current) => ({ ...current, energy: Number(event.target.value) }))}
          >
            <option value="1">1 — Very low</option>
            <option value="2">2 — Low</option>
            <option value="3">3 — Normal</option>
            <option value="4">4 — High</option>
            <option value="5">5 — Excellent</option>
          </select>
        </label>


        <label>
          <span>Sleep (hours)</span>
          <input
            type="number"
            min="0"
            max="16"
            step="0.5"
            value={state.sleep}
            onChange={(event) => setState((current) => ({ ...current, sleep: safeNumber(event.target.value) }))}
          />
        </label>
      </div>


      <div className="load-breakdown">
        <div><span>7-day basketball load</span><strong>{recovery.basketballSessions ? recovery.basketballLoad : 'No sessions logged'}</strong></div>
        <div><span>7-day cardio load</span><strong>{recovery.runningSessions ? recovery.runningLoad : 'No cardio logged'}</strong></div>
        <div><span>7-day gym sessions</span><strong>{recovery.gymSessions}</strong></div>
        <div><span>7-day lower-body sessions</span><strong>{recovery.lowerBodyGymSessions}</strong></div>
      </div>


      {recovery.status !== 'READY' && (
        <div className="recovery-warning">
          <AlertCircle size={16} />
          <span>
            {recovery.status === 'PROTECT'
              ? 'Recovery is low. Reduce lower-body training volume and prioritise recovery.'
              : 'Recovery is moderate. Lower-body sets will be reduced where applicable.'}
          </span>
        </div>
      )}
    </section>
  );
}


function Cardio({ onSave, logs, onDelete }) {
  const [runDate, setRunDate] = useState(today);
  const [activity, setActivity] = useState('Run');
  const [environment, setEnvironment] = useState('Outdoor');
  const [distance, setDistance] = useState('');
  const [duration, setDuration] = useState('');
  const [calories, setCalories] = useState('');
  const [intensity, setIntensity] = useState('Moderate');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const needsDistance = ['Run', 'Walk', 'Bike'].includes(activity);
  const weeklyLogs = logs.filter((log) => log.date >= dateKey(getWeekStart()) && log.date <= today());
  const caloriesLogged = logs.filter((log) => log.calories != null).length;

  const submit = (event) => {
    event.preventDefault();
    const minutes = parseCardioDuration(duration);
    if (minutes === null) {
      setError('Enter time as minutes:seconds (20:02) or hours:minutes:seconds (1:20:02). Seconds must be 00–59.');
      return;
    }
    if ((needsDistance || distance !== '') && (!Number.isFinite(Number(distance)) || Number(distance) <= 0)) {
      setError('Enter a distance greater than zero, for example 3.66 km.');
      return;
    }
    if (calories !== '' && (!Number.isInteger(Number(calories)) || Number(calories) < 0)) {
      setError('Calories must be a whole number of zero or more, or left blank.');
      return;
    }
    if (!runDate || runDate > today()) {
      setError('Choose today or an earlier date.');
      return;
    }
    onSave({
      id: makeId(), date: runDate, createdAt: new Date().toISOString(),
      activity, environment,
      distance: distance === '' ? null : Number(distance),
      duration: minutes,
      calories: calories === '' ? null : Number(calories),
      intensity, notes: notes.trim(),
    });
    setDistance('');
    setDuration('');
    setCalories('');
    setNotes('');
    setError('');
  };

  return (
    <div className="page-stack">
      <SectionHeading eyebrow="ENDURANCE" title="Cardio" subtitle="Track runs, walks, rides and gym cardio with precise distance, time and calories." />
      <form className="panel cardio-form" onSubmit={submit}>
        <div className="panel-heading">
          <div className="panel-icon"><Footprints size={20} /></div>
          <div><h3>Log cardio</h3><p>Record a completed session</p></div>
        </div>
        <div className="form-grid">
          <label>Activity
            <select value={activity} onChange={(event) => setActivity(event.target.value)}>
              {['Run', 'Walk', 'Bike', 'Stairmaster', 'Elliptical', 'Rowing', 'Other'].map((name) => <option key={name}>{name}</option>)}
            </select>
          </label>
          <label>Setting
            <select value={environment} onChange={(event) => setEnvironment(event.target.value)}>
              <option>Outdoor</option><option>Indoor</option>
            </select>
          </label>
          <label>Activity date<input type="date" required max={today()} value={runDate} onChange={(event) => setRunDate(event.target.value)} /></label>
          <label>Distance (km){!needsDistance && ' — optional'}
            <input aria-label="Distance (km)" type="number" min="0.01" step="0.01" required={needsDistance} value={distance} onChange={(event) => setDistance(event.target.value)} placeholder="e.g. 3.66" />
          </label>
          <label>Time (mm:ss or hh:mm:ss)
            <input type="text" required value={duration} onChange={(event) => setDuration(event.target.value)} placeholder="e.g. 20:02" aria-describedby="cardio-time-help" />
            <small id="cardio-time-help">20:02 = 20 minutes, 2 seconds</small>
          </label>
          <label>Calories burned (kcal) — optional
            <input aria-label="Calories burned (kcal)" type="number" min="0" step="1" value={calories} onChange={(event) => setCalories(event.target.value)} placeholder="From your watch or machine" />
          </label>
          <label>Intensity
            <select value={intensity} onChange={(event) => setIntensity(event.target.value)}><option>Easy</option><option>Moderate</option><option>Hard</option></select>
          </label>
          <label>Notes (optional)<input value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Route, resistance, incline or how you felt" /></label>
        </div>
        {error && <p className="save-error" role="alert">{error}</p>}
        <button type="submit" className="button button-primary"><Plus size={17} /> Save cardio</button>
      </form>
      <div className="stats-grid">
        <StatCard label="Total distance" value={`${logs.reduce((sum, log) => sum + safeNumber(log.distance), 0).toFixed(2)} km`} icon={Footprints} />
        <StatCard label="Total time" value={formatCardioTime(logs.reduce((sum, log) => sum + safeNumber(log.duration), 0))} detail="Hours:minutes:seconds for 1h+" icon={Clock} />
        <StatCard label="Cardio sessions" value={logs.length} icon={Activity} />
      </div>
      <section className="panel">
        <SectionHeading eyebrow="ENERGY" title="Calories burned" subtitle="Record the calories reported by your watch or machine. Sessions left blank are excluded from calorie totals." />
        <div className="stats-grid">
          <StatCard label="This week" value={`${cardioCalories(weeklyLogs).toLocaleString()} kcal`} icon={Flame} />
          <StatCard label="All time" value={`${cardioCalories(logs).toLocaleString()} kcal`} icon={Flame} />
          <StatCard label="Sessions with calories" value={caloriesLogged} icon={Activity} />
        </div>
      </section>
      <section className="panel">
        <SectionHeading eyebrow="HISTORY" title="Recent cardio" />
        {logs.length === 0 ? <EmptyState icon={Footprints} title="No cardio logged yet" description="Your saved cardio sessions will appear here." /> : (
          <div className="log-list">
            {[...logs].sort((a, b) => b.date.localeCompare(a.date) || String(b.createdAt || '').localeCompare(String(a.createdAt || ''))).map((log) => (
              <div className="log-row" key={log.id}>
                <div className="log-icon">{cardioActivity(log) === 'Bike' ? <Bike size={18} /> : <Footprints size={18} />}</div>
                <div className="log-main">
                  <strong>{log.environment ? `${log.environment} ` : ''}{cardioActivity(log)}{safeNumber(log.distance) > 0 ? ` · ${Number(log.distance).toFixed(2)} km` : ''}</strong>
                  <span>{formatDate(log.date)} · {log.intensity}{log.notes ? ` · ${log.notes}` : ''}</span>
                  <span>{formatCardioTime(log.duration)}{['Run', 'Walk'].includes(cardioActivity(log)) && safeNumber(log.distance) > 0 ? ` · ${formatPace(log.duration, log.distance)} /km` : ''}</span>
                </div>
                <div className="log-value">{log.calories != null ? `${log.calories} kcal` : 'Calories not logged'}</div>
                <IconButton title="Delete cardio" onClick={() => { if (window.confirm('Delete this cardio session?')) onDelete(log.id); }}><Trash2 size={16} /></IconButton>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function BasketballPage({ logs, onSave, onDelete }) {
  const [selected, setSelected] = useState('Shooting Session');
  const [duration, setDuration] = useState(String(BASKETBALL['Shooting Session'].duration));
  const [impact, setImpact] = useState(BASKETBALL['Shooting Session'].impact);
  const [notes, setNotes] = useState('');


  const workout = BASKETBALL[selected];


  const selectWorkout = (name) => {
    setSelected(name);
    setDuration(String(BASKETBALL[name].duration));
    setImpact(BASKETBALL[name].impact);
  };


  const saveSession = () => {
    if (safeNumber(duration) <= 0) return;


    onSave({
      id: makeId(),
      date: today(),
      name: selected,
      duration: safeNumber(duration),
      impact,
      notes: notes.trim(),
      exercises: workout.exercises.map((exercise) => exercise.name),
    });


    setNotes('');
  };


  const totalMinutes = logs.reduce((sum, log) => sum + safeNumber(log.duration), 0);


  return (
    <div className="page-stack">
      <SectionHeading
        eyebrow="COURT WORK"
        title="Basketball"
        subtitle="Build skill, improve jumping power and track basketball load alongside gym training."
      />


      <div className="stats-grid">
        <StatCard label="Sessions" value={logs.length} icon={Activity} />
        <StatCard label="Total court time" value={`${totalMinutes} min`} icon={Clock} />
        <StatCard label="High-impact sessions" value={logs.filter((log) => log.impact === 'HIGH').length} icon={Zap} />
      </div>


      <section className="panel">
        <div className="eyebrow">CHOOSE A SESSION</div>
        <div className="basketball-session-grid">
          {Object.entries(BASKETBALL).map(([name, item]) => (
            <button
              type="button"
              key={name}
              className={`basketball-session-card ${selected === name ? 'basketball-session-selected' : ''}`}
              onClick={() => selectWorkout(name)}
            >
              <div className="basketball-card-icon">
                {name.includes('Jump') ? <Zap size={21} /> : name.includes('Shooting') ? <Target size={21} /> : name.includes('Handling') ? <Activity size={21} /> : name.includes('Conditioning') ? <Flame size={21} /> : <Dumbbell size={21} />}
              </div>
              <strong>{name}</strong>
              <span>{item.duration} min · {item.impact.toLowerCase()} impact</span>
            </button>
          ))}
        </div>
      </section>


      <section className="panel">
        <div className="panel-heading">
          <div className="panel-icon"><Dumbbell size={19} /></div>
          <div>
            <h3>{selected}</h3>
            <p>{workout.focus}</p>
          </div>
        </div>


        <div className="basketball-exercise-list">
          {workout.exercises.map((exercise, index) => (
            <div className="basketball-exercise-row" key={exercise.name}>
              <span className="exercise-number">{String(index + 1).padStart(2, '0')}</span>
              <div><strong>{exercise.name}</strong><span>{exercise.sets} sets · {exercise.reps}</span></div>
            </div>
          ))}
        </div>


        <div className="form-grid">
          <label>
            Duration (minutes)
            <input type="number" min="1" value={duration} onChange={(event) => setDuration(event.target.value)} />
          </label>
          <label>
            Training impact
            <select value={impact} onChange={(event) => setImpact(event.target.value)}>
              <option value="LOW">Low</option>
              <option value="MODERATE">Moderate</option>
              <option value="HIGH">High</option>
            </select>
          </label>
          <label className="form-span">
            Notes (optional)
            <input value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="How did the session feel?" />
          </label>
        </div>


        <button type="button" className="button button-primary" onClick={saveSession}>
          <Check size={17} /> Log basketball session
        </button>
      </section>


      <section className="panel">
        <SectionHeading eyebrow="RECENT ACTIVITY" title="Basketball history" />


        {logs.length === 0 ? (
          <EmptyState icon={Activity} title="No basketball sessions yet" description="Log a session to start tracking your court workload." />
        ) : (
          <div className="log-list">
            {[...logs].sort((a, b) => b.date.localeCompare(a.date)).map((log) => (
              <div className="log-row" key={log.id}>
                <div className="log-icon"><Activity size={18} /></div>
                <div className="log-main">
                  <strong>{log.name}</strong>
                  <span>{formatDate(log.date)} · {log.impact} impact{log.notes ? ` · ${log.notes}` : ''}</span>
                </div>
                <div className="log-value">{log.duration} min</div>
                <IconButton title="Delete basketball log" onClick={() => onDelete(log.id)}>
                  <Trash2 size={15} />
                </IconButton>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}


function EmptyState({ icon: Icon, title, description }) {
  return (
    <div className="empty-state">
      <div className="empty-state-icon"><Icon size={24} /></div>
      <h3>{title}</h3>
      <p>{description}</p>
    </div>
  );
}


function Programme({ state, history, onFreshWorkout, onSupersetsChange, onDraftChange, onSave, onRest, onStartSession, activeSession, sessionRunning, elapsedSeconds, onPauseSession, onResumeSession, onFinishSession }) {
  const [day, setDay] = useState('Chest & Triceps');
  const [substitutions, setSubstitutions] = useState({});
  const [firstPair, setFirstPair] = useState('');
  const [secondPair, setSecondPair] = useState('');
  const recovery = useMemo(() => getRecovery(state), [state]);
  const plan = adjustedPlan(day, recovery);


  const exercises = plan.exercises.map((exercise) => ({
    ...exercise,
    originalName: exercise.name,
    name: substitutions[`${day}-${exercise.name}`] || exercise.name,
  }));


  const pairs = Array.isArray(state.supersets?.[day]) ? state.supersets[day] : [];
  const groups = groupSupersets(exercises, pairs);
  const pairedNames = new Set(pairs.flatMap((pair) => pair.exercises));
  const available = exercises.filter((exercise) => !pairedNames.has(exercise.originalName));

  const saveExercise = (entry) => onSave(entry);


  return (
    <div className="page-stack">
      <SectionHeading
        eyebrow="STRENGTH PROGRAMME"
        title="Training plan"
        subtitle="Log each set, adjust exercises and track progression over time."
      />


      <div className="day-selector">
        {DAYS.map((name) => (
          <button
            type="button"
            key={name}
            className={day === name ? 'day-chip day-chip-active' : 'day-chip'}
            onClick={() => {
              setDay(name);
              setFirstPair('');
              setSecondPair('');
              setSubstitutions({});
            }}
          >
            {name}
          </button>
        ))}
      </div>


      <section className="programme-hero">
        <div className="programme-hero-copy">
          <div className="eyebrow">{PROGRAM[day].category}</div>
          <h2>{day}</h2>
          <p>{PROGRAM[day].focus}</p>
          <div className="programme-meta">
            <span><Dumbbell size={15} /> {exercises.length} exercises</span>
            <span><Clock size={15} /> {exercises.reduce((sum, exercise) => sum + exercise.sets * exercise.rest, 0) > 0 ? `${Math.round(exercises.reduce((sum, exercise) => sum + exercise.sets * exercise.rest, 0) / 60)}+ min` : 'Flexible'}</span>
          </div>
        </div>
        <div className="programme-hero-icon"><Dumbbell size={45} /></div>
      </section>


      {plan.adjusted && (
        <div className="adjustment-banner">
          <ShieldCheck size={19} />
          <div>
            <strong>Recovery-adjusted session</strong>
            <p>{recovery.status === 'PROTECT' ? 'Your recent load suggests reducing training stress today.' : 'Your recovery score suggests a lighter session today.'} Planned sets have been reduced.</p>
          </div>
        </div>
      )}


      <section className="panel">
        <SectionHeading eyebrow="WORKOUT SETUP" title="Supersets" subtitle="Pair two exercises. Alternate one set of each, then rest. Pairings are saved for this training day." />
        <div className="form-grid">
          <label>First exercise<select aria-label="First superset exercise" value={firstPair} onChange={(event) => { setFirstPair(event.target.value); setSecondPair(''); }}>
            <option value="">Choose an exercise</option>
            {available.map((exercise) => <option key={exercise.originalName} value={exercise.originalName}>{exercise.name}</option>)}
          </select></label>
          <label>Second exercise<select aria-label="Second superset exercise" value={secondPair} onChange={(event) => setSecondPair(event.target.value)}>
            <option value="">Choose a partner</option>
            {available.filter((exercise) => exercise.originalName !== firstPair).map((exercise) => <option key={exercise.originalName} value={exercise.originalName}>{exercise.name}</option>)}
          </select></label>
        </div>
        <button type="button" className="button button-primary" disabled={!firstPair || !secondPair} onClick={() => {
          onSupersetsChange(day, addSuperset(pairs, firstPair, secondPair, makeId()));
          setFirstPair(''); setSecondPair('');
        }}><Plus size={16} /> Add superset</button>
        <p className="muted-copy">Save each exercise separately. If set counts differ, complete any extra sets individually.</p>
        <button type="button" className="button button-secondary" onClick={() => {
          if (window.confirm("Save any current exercise entries first. Replace this day's fields with next-session targets? Your saved history and superset pairings will be kept.")) onFreshWorkout(day);
        }}>Fill next-session targets</button>
        <p className="muted-copy">Use this for a new workout without a timer. Finishing a gym timer also prepares fresh fields automatically.</p>
      </section>
      <div className="exercise-list">
        {groups.map((group) => (
          <div key={group.pair?.id || group.exercises[0].originalName}>
            {group.pair && <div className="adjustment-banner">
              <TrendingUp size={18} />
              <div><strong>Superset {pairs.indexOf(group.pair) + 1}</strong><p>{group.exercises.map((exercise) => exercise.name).join(' → ')} → rest</p></div>
              <button type="button" className="text-button" onClick={() => onSupersetsChange(day, pairs.filter((pair) => pair.id !== group.pair.id))}>Unpair exercises</button>
            </div>}
            {group.exercises.map((exercise, memberIndex) => {
              const index = exercises.findIndex((item) => item.originalName === exercise.originalName);
              const partner = group.exercises[1 - memberIndex];
              const targets = nextSessionSets(exercise, day, history, state, state.settings.weightUnit);
              return <ExerciseCard
                key={`${day}-${exercise.originalName}-${exercise.name}-${index}-${state.draftRevision || 0}`}
                exercise={exercise}
                index={index}
                day={day}
                unit={state.settings.weightUnit}
                initialSets={targets}
                superset={group.pair ? { id: group.pair.id, partner: partner.name, label: `${pairs.indexOf(group.pair) + 1}${memberIndex === 0 ? 'A' : 'B'}`, nextIndex: memberIndex === 0 ? exercises.findIndex((item) => item.originalName === partner.originalName) : null } : null}
                history={history}
                draft={state.drafts?.[`${day}|${exercise.name}`]}
                onDraftChange={(draft) => onDraftChange(`${day}|${exercise.name}`, draft)}
                onNewEntry={() => onDraftChange(`${day}|${exercise.name}`, { id: makeId(), sets: targets, rir: '2' })}
                onSave={saveExercise}
                onRest={onRest}
                onSubstitute={(alternative) => setSubstitutions((current) => ({ ...current, [`${day}-${exercise.originalName}`]: alternative }))}
              />;
            })}
          </div>
        ))}
      </div>
      <div className="programme-session-bar">
        {activeSession ? (
          activeSession.type === 'train' && activeSession.name === day ? (
            <>
              <div><span className="eyebrow">WORKOUT TIMER</span><strong>{formatDuration(elapsedSeconds)}</strong></div>
              {sessionRunning ? <button type="button" className="button button-secondary" onClick={onPauseSession}><Pause size={15} /> Pause</button> : <button type="button" className="button button-secondary" onClick={onResumeSession}><Play size={15} /> Resume</button>}
              <button type="button" className="button button-primary" onClick={onFinishSession}><Check size={15} /> Finish workout</button>
            </>
          ) : (
            <>
              <div><span className="eyebrow">SESSION IN PROGRESS</span><strong>{activeSession.name}</strong></div>
              <p>Finish the active session before starting another workout timer.</p>
              <button type="button" className="button button-primary" onClick={onFinishSession}><Check size={15} /> Finish active session</button>
            </>
          )
        ) : (
          <button type="button" className="button button-primary" onClick={() => onStartSession?.(day)}><Play size={15} /> Start {day} timer</button>
        )}
        <p>Exercise saves are tracked individually. Finish the timer to record the workout duration.</p>
      </div>
    </div>
  );
}


function Progress({ state, history, onDeleteHistory }) {
  const weekStart = getWeekStart();
  const weekStartString = dateKey(weekStart);


  const weekSessions = loggedSessions(state).filter((session) => session.date >= weekStartString);
  const weekHistory = history.filter((item) => item.date >= weekStartString);
  const weekCardio = (state.runLogs || []).filter((item) => item.date >= weekStartString && item.date <= today());
  const weekRuns = weekCardio.filter((item) => cardioActivity(item) === 'Run');
  const weekBasketball = (state.bbLogs || []).filter((item) => item.date >= weekStartString);


  const weeklyVolume = weekHistory.reduce((sum, item) => sum + safeNumber(item.volume), 0);
  const totalDistance = weekRuns.reduce((sum, item) => sum + safeNumber(item.distance), 0);
  // Every logged run and basketball session already has a matching sessions entry in seconds.
  const weekMinutes = Math.round(weekSessions.reduce((sum, item) => sum + safeNumber(item.duration), 0) / 60);


  const personalRecords = useMemo(() => {
    const best = new Map();


    for (const item of history) {
      const key = `${item.exercise}-${item.day}`;
      const weight = bestCompletedSetWeight(item);
      if (weight <= 0) continue;


      if (!best.has(key) || weight > best.get(key).weight) {
        best.set(key, { ...item, weight });
      }
    }


    return [...best.values()].sort((a, b) => b.weight - a.weight);
  }, [history]);


  const dailyVolume = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(weekStart);
    date.setDate(weekStart.getDate() + index);
    const key = dateKey(date);


    return {
      date: key,
      label: date.toLocaleDateString('en-GB', { weekday: 'short' }),
      value: weekHistory.filter((item) => item.date === key).reduce((sum, item) => sum + safeNumber(item.volume), 0),
    };
  });


  const maxVolume = Math.max(1, ...dailyVolume.map((item) => item.value));


  return (
    <div className="page-stack">
      <SectionHeading
        eyebrow="YOUR TRAINING DATA"
        title="Progress"
        subtitle="Review your weekly workload, personal records and completed training."
      />


      <div className="stats-grid">
        <StatCard label="Logged exercises" value={weekHistory.length} detail="This week" icon={Dumbbell} accent />
        <StatCard label="Training volume" value={Math.round(weeklyVolume).toLocaleString()} detail="Weight × reps" icon={TrendingUp} />
        <StatCard label="Running distance" value={`${totalDistance.toFixed(2)} km`} detail="This week" icon={Footprints} />
        <StatCard label="Cardio calories" value={`${cardioCalories(weekCardio).toLocaleString()} kcal`} detail="Logged this week" icon={Flame} />
        <StatCard label="Basketball sessions" value={weekBasketball.length} detail="This week" icon={Activity} />
        <StatCard label="Activity time" value={`${Math.floor(weekMinutes / 60)}h ${weekMinutes % 60}m`} detail="This week" icon={Clock} />
      </div>


      <section className="panel">
        <SectionHeading eyebrow="WEEKLY BREAKDOWN" title="Training volume" subtitle="Logged lifting volume per day." />


        <div className="weekly-chart">
          {dailyVolume.map((item) => (
            <div className="chart-column" key={item.date}>
              <div className="chart-value">{item.value ? Math.round(item.value).toLocaleString() : '—'}</div>
              <div className="chart-bar-track">
                <div className="chart-bar" style={{ height: `${Math.max(item.value ? 4 : 0, (item.value / maxVolume) * 100)}%` }} />
              </div>
              <span>{item.label}</span>
            </div>
          ))}
        </div>
      </section>


      <section className="panel">
        <SectionHeading eyebrow="PERSONAL BESTS" title="Top exercise weights" />


        {personalRecords.length === 0 ? (
          <EmptyState icon={Trophy} title="No personal records yet" description="Save your first exercise to start tracking your strongest recorded weights." />
        ) : (
          <div className="log-list">
            {personalRecords.slice(0, 10).map((item) => (
              <div className="log-row" key={`${item.exercise}-${item.day}`}>
                <div className="log-icon"><Trophy size={18} /></div>
                <div className="log-main">
                  <strong>{item.exercise}</strong>
                  <span>{item.day} · {formatDate(item.date)}</span>
                </div>
                <div className="log-value">{item.weight} {state.settings.weightUnit}</div>
              </div>
            ))}
          </div>
        )}
      </section>


      <section className="panel">
        <SectionHeading eyebrow="WORKOUT HISTORY" title="Recent logged exercises" />


        {history.length === 0 ? (
          <EmptyState icon={History} title="Your history is empty" description="Save an exercise during a workout to see it here." />
        ) : (
          <div className="log-list">
            {[...history].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 30).map((item) => (
              <div className="log-row" key={item.id}>
                <div className="log-icon"><Dumbbell size={18} /></div>
                <div className="log-main">
                  <strong>{item.exercise}</strong>
                  <span>{item.day} · {formatDate(item.date)} · {item.completedSets ?? item.sets?.filter((set) => set.done).length ?? 0} sets</span>
                </div>
                <div className="log-value">{item.weight || 0} {state.settings.weightUnit}</div>
                <IconButton title="Delete exercise entry" onClick={() => onDeleteHistory(item.id)}>
                  <Trash2 size={15} />
                </IconButton>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function SettingsPage({ state, setState, syncStatus, retrySync, onReset, }) {
  return (
    <div className="page-stack">
      <SectionHeading
        eyebrow="PREFERENCES"
        title="Settings"
        subtitle="Configure your training units, hydration goal and stored data."
      />

      <section className="panel settings-panel">
        <div className="settings-row">
          <div>
            <strong>Weight unit</strong>
            <p>Used throughout your strength training logs.</p>
          </div>

          <select
            aria-label="Weight unit"
            value={state.settings.weightUnit}
            onChange={(event) =>
              setState((current) => convertWeightUnit(current, event.target.value))
            }
          >
            <option value="kg">Kilograms (kg)</option>
            <option value="lb">Pounds (lb)</option>
          </select>
        </div>

        <div className="settings-row">
          <div>
            <strong>Daily hydration goal</strong>
            <p>Set your target water intake in millilitres.</p>
          </div>

          <input
            type="number"
            min="250"
            max="10000"
            step="250"
            value={state.settings.waterGoal}
            onChange={(event) =>
              setState((current) => ({
                ...current,
                settings: {
                  ...current.settings,
                  waterGoal: Math.max(
                    250,
                    safeNumber(event.target.value, WATER_GOAL)
                  ),
                },
              }))
            }
          />
        </div>
      </section>

      {/* CEED cloud integration */}
      <section className="panel">
        <div className="panel-heading">
          <div className="panel-icon">
            <ShieldCheck size={19} />
          </div>

          <div>
            <h3>CEED connection</h3>
            <p>
              Synchronise your training data with your
              CEED Supabase account.
            </p>
          </div>
        </div>

        <GymCloudSync onSync={retrySync} />
        <button className="button button-secondary" onClick={() => downloadBackup(state)}>Download training backup</button>
        <GymSyncStatus status={syncStatus} />
      </section>

      <section className="panel danger-panel">
        <div className="panel-heading">
          <div className="panel-icon danger-icon">
            <AlertCircle size={19} />
          </div>

          <div>
            <h3>Reset training data</h3>
            <p>
              Reset your cloud workouts, logs, hydration and settings on all devices.
            </p>
          </div>
        </div>

        <button
          type="button"
          className="button button-danger"
          onClick={onReset}
        >
          <Trash2 size={16} />
          Reset all data
        </button>
      </section>

      <div className="privacy-note">
        <ShieldCheck size={17} />

        <span>
          Your training data loads from your signed-in cloud account and saves automatically. Wait for “Saved to cloud” before closing. Device-only history is not used.
        </span>
      </div>
    </div>
  );
}


const NAV_ITEMS = [
  { name: 'Home', label: 'Overview', icon: Home },
  { name: 'Programme', label: 'Gym', icon: Dumbbell },
  { name: 'Basketball', label: 'Basketball', icon: Activity },
  { name: 'Cardio', label: 'Cardio', icon: Footprints },
  { name: 'Progress', label: 'Progress', icon: BarChart3 },
  { name: 'AI Coach', label: 'AI Coach', icon: Zap },
  { name: 'Settings', label: 'Settings', icon: Settings },
];


export default function App() {
  const [state, setState] = useState(emptyState);
  const [loaded, setLoaded] = useState(false);
  const [tab, setTab] = useState('Home');
  const [timerOpen, setTimerOpen] = useState(false);
  const [timerDuration, setTimerDuration] = useState(90);
  const [activeSession, setActiveSession] = useState(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [sessionRunning, setSessionRunning] = useState(false);
  const [runtimeLoaded, setRuntimeLoaded] = useState(false);
  const [sessionClock, setSessionClock] = useState(Date.now());
  const [confirmReset, setConfirmReset] = useState(false);
  const [notice, setNotice] = useState('');
  const restoreCloudRuntime = useCallback((saved) => {
    setTab(NAV_ITEMS.some(item => item.name === saved.lastTab) ? saved.lastTab : 'Home');
    const runtime = saved.activeWorkout;
    setActiveSession(runtime?.activeSession?.id ? runtime.activeSession : null);
    setElapsedSeconds(Math.max(0, safeNumber(runtime?.elapsedSeconds)));
    setSessionRunning(Boolean(runtime?.sessionRunning && runtime?.activeSession?.startedAt));
    setRuntimeLoaded(true);
  }, []);
  const { user: cloudUser, syncStatus, cloudReady, errorMessage, retrySync, reloadCloud } = useGymCloudSync({
    state, setState, loaded, createEmptyState: emptyState, onRecovered: restoreCloudRuntime,
  });

  useEffect(() => { setLoaded(true); }, []);

  useEffect(() => {
    if (cloudReady) setState(current => current.lastTab === tab ? current : { ...current, lastTab: tab });
  }, [tab, cloudReady]);

  useEffect(() => {
    if (!cloudReady || !runtimeLoaded) return;
    const activeWorkout = { activeSession, elapsedSeconds, sessionRunning };
    setState(current => JSON.stringify(current.activeWorkout) === JSON.stringify(activeWorkout) ? current : { ...current, activeWorkout });
  }, [activeSession, elapsedSeconds, sessionRunning, runtimeLoaded, cloudReady]);

  useEffect(() => {
    if (!sessionRunning || !activeSession) return undefined;
    const interval = window.setInterval(() => setSessionClock(Date.now()), 250);
    return () => window.clearInterval(interval);
  }, [sessionRunning, activeSession?.startedAt, activeSession?.id]);


  useEffect(() => {
    if (!notice) return undefined;
    const timeout = window.setTimeout(() => setNotice(''), 3500);
    return () => window.clearTimeout(timeout);
  }, [notice]);


  const recovery = useMemo(() => getRecovery(state), [state]);
  const getElapsedSeconds = useCallback(() => {
    const liveSeconds = sessionRunning && activeSession?.startedAt
      ? Math.max(0, Math.floor((Date.now() - activeSession.startedAt) / 1000))
      : 0;
    return Math.max(0, elapsedSeconds + liveSeconds);
  }, [elapsedSeconds, sessionRunning, activeSession?.startedAt]);
  // Causes the live elapsed display to refresh without accumulating timer drift.
  const liveElapsedSeconds = elapsedSeconds + (sessionRunning && activeSession?.startedAt
    ? Math.max(0, Math.floor((sessionClock - activeSession.startedAt) / 1000))
    : 0);


  const todayWater = safeNumber(state.water?.[today()], 0);
  const goal = safeNumber(state.settings.waterGoal, WATER_GOAL);
  const weekStart = getWeekStart();
  const weekStartString = dateKey(weekStart);


  const weeklySessions = loggedSessions(state).filter((session) => session.date >= weekStartString);
  const weeklyRuns = state.runLogs.filter((log) => log.date >= weekStartString && log.date <= today() && cardioActivity(log) === 'Run');
  const weeklyBasketball = state.bbLogs.filter((log) => log.date >= weekStartString);


  const updateWater = (delta) => {
    setState((current) => ({
      ...current,
      water: {
        ...current.water,
        [today()]: Math.max(0, safeNumber(current.water?.[today()]) + delta),
      },
    }));
  };


  const saveExercise = useCallback((entry) => {
    setState((current) => {
      const weight = bestCompletedSetWeight(entry);
      const previousBest = Math.max(
        0,
        ...current.history
          .filter((item) => item.id !== entry.id && (item.exercise || item.name) === entry.exercise && item.day === entry.day)
          .map((item) => bestCompletedSetWeight(item))
      );
      const pr = weight > 0 && weight > previousBest;
      const savedEntry = {
        ...entry,
        weight,
        createdAt: new Date().toISOString(),
        sessionId: activeSession?.type === 'train' && (activeSession.name === entry.day || activeSession.name === 'Gym session') ? activeSession.id : entry.sessionId || null,
        pr,
      };

      return {
        ...current,
        history: [...current.history.filter((item) => item.id !== entry.id), savedEntry],
        loads: weight > 0 ? { ...current.loads, [entry.exercise]: weight } : current.loads,
      };
    });


    setNotice('Saving exercise to cloud…');
  }, [activeSession?.id]);


  const saveRun = useCallback((entry) => {
    setState((current) => ({
      ...current,
      runLogs: [...current.runLogs, entry],
      sessions: [
        ...current.sessions,
        cardioSession(entry),
      ],
    }));


    setNotice('Cardio saved.');
  }, []);


  const saveBasketball = useCallback((entry) => {
    setState((current) => ({
      ...current,
      bbLogs: [...current.bbLogs, entry],
      sessions: [
        ...current.sessions,
        {
          id: entry.id,
          date: entry.date,
          type: 'basketball',
          name: entry.name,
          duration: safeNumber(entry.duration) * 60,
        },
      ],
    }));


    setNotice('Basketball session saved.');
  }, []);


  const startSession = (type, name) => {
    if (activeSession) return;
    const startedAt = Date.now();
    setActiveSession({ id: makeId(), type, name, startedAt, date: today() });
    setElapsedSeconds(0);
    setSessionClock(startedAt);
    setSessionRunning(true);
    setNotice(`${name} started.`);
  };


  const pauseSession = () => {
    if (!activeSession || !sessionRunning) return;
    const accumulated = getElapsedSeconds();
    setElapsedSeconds(accumulated);
    setActiveSession((current) => current ? { ...current, startedAt: null } : current);
    setSessionRunning(false);
  };

  const resumeSession = () => {
    if (!activeSession || sessionRunning) return;
    const startedAt = Date.now();
    setActiveSession((current) => current ? { ...current, startedAt } : current);
    setSessionClock(startedAt);
    setSessionRunning(true);
  };

  const finishSession = () => {
    if (!activeSession) return;

    const duration = getElapsedSeconds();


    setState((current) => ({
      ...current,
      draftRevision: safeNumber(current.draftRevision) + 1,
      drafts: Object.fromEntries(Object.entries(current.drafts || {}).filter(([key]) => activeSession.type !== 'train' || (activeSession.name !== 'Gym session' && !key.startsWith(`${activeSession.name}|`)))),
      sessions: [
        ...current.sessions.filter((item) => item.id !== activeSession.id),
        {
          id: activeSession.id,
          date: activeSession.date || today(),
          type: activeSession.type,
          name: activeSession.name,
          duration,
        },
      ],
    }));


    setActiveSession(null);
    setSessionRunning(false);
    setElapsedSeconds(0);
    setSessionClock(Date.now());
    setNotice('Session duration saved.');
  };


  const discardSession = () => {
    setActiveSession(null);
    setSessionRunning(false);
    setElapsedSeconds(0);
    setSessionClock(Date.now());
    setNotice('Session timer discarded.');
  };


  const resetAll = () => {
    setState(emptyState());
    setActiveSession(null);
    setSessionRunning(false);
    setElapsedSeconds(0);
    setSessionClock(Date.now());
    setConfirmReset(false);
    setTab('Home');


    setNotice('Saving reset to cloud…');
  };


  const deleteHistory = (id) => {
    setState((current) => ({
      ...current,
      history: current.history.filter((item) => item.id !== id),
    }));
  };


  const deleteBasketball = (id) => {
    setState((current) => ({
      ...current,
      bbLogs: current.bbLogs.filter((item) => item.id !== id),
      sessions: current.sessions.filter((item) => item.id !== id),
    }));
  };


  const deleteRun = (id) => {
    setState((current) => ({
      ...current,
      runLogs: current.runLogs.filter((item) => item.id !== id),
      sessions: current.sessions.filter((item) => item.id !== id),
    }));
  };


  const renderPage = () => {
    if (tab === 'Programme') {
      return (
        <Programme
          state={state}
          history={state.history}
          onFreshWorkout={(day) => setState((current) => ({ ...current, draftRevision: safeNumber(current.draftRevision) + 1, drafts: Object.fromEntries(Object.entries(current.drafts || {}).filter(([key]) => !key.startsWith(`${day}|`))) }))}
          onSupersetsChange={(day, pairs) => setState((current) => ({ ...current, supersets: { ...current.supersets, [day]: pairs } }))}
          onDraftChange={(key, draft) => setState((current) => ({ ...current, drafts: { ...current.drafts, [key]: draft } }))}
          onSave={saveExercise}
          onStartSession={(workoutDay) => startSession('train', workoutDay)}
          activeSession={activeSession}
          sessionRunning={sessionRunning}
          elapsedSeconds={liveElapsedSeconds}
          onPauseSession={pauseSession}
          onResumeSession={resumeSession}
          onFinishSession={finishSession}
          onRest={(duration) => {
            setTimerDuration(duration);
            setTimerOpen(true);
          }}
        />
      );
    }


    if (tab === 'Basketball') {
      return (
        <BasketballPage
          logs={state.bbLogs}
          onSave={saveBasketball}
          onDelete={deleteBasketball}
        />
      );
    }


    if (tab === 'Cardio') {
      return <Cardio logs={state.runLogs} onSave={saveRun} onDelete={deleteRun} />;
    }


    if (tab === 'AI Coach') return <TrainingCoach />;

    if (tab === 'Progress') {
      return (
        <Progress
          state={state}
          history={state.history}
          onDeleteHistory={deleteHistory}
        />
      );
    }


    if (tab === 'Settings') {
  return (
    <SettingsPage
      state={state}
      setState={setState}
      syncStatus={syncStatus}
      retrySync={retrySync}
      onReset={() => setConfirmReset(true)}
    />
  );
}


    return (
      <div className="page-stack">
        <div className="dashboard-hero">
          <div className="dashboard-hero-content">
            <div className="eyebrow"><span className="live-dot" /> YOUR TRAINING SYSTEM</div>
            <h1>How will you <span>move today?</span></h1>
            <p>Strength, basketball and recovery. One system built around your progress.</p>
            <button type="button" className="button button-light" onClick={() => setTab('Programme')}>
              Start training <ArrowRight size={17} />
            </button>
          </div>

        </div>


        <div className="dashboard-date">
          <div>
            <div className="eyebrow">TODAY</div>
            <h2>{new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}</h2>
          </div>
          <div className="dashboard-date-icon"><CalendarDays size={21} /></div>
        </div>


        <div className="stats-grid">
          <StatCard label="Exercises logged" value={state.history.filter((item) => item.date === today()).length} detail="Today" icon={Dumbbell} accent />
          <StatCard label="Weekly sessions" value={weeklySessions.length} detail="All activities" icon={Activity} />
          <StatCard label="Run distance" value={`${weeklyRuns.reduce((sum, log) => sum + safeNumber(log.distance), 0).toFixed(2)} km`} detail="This week" icon={Footprints} />
          <StatCard label="Recovery" value={`${recovery.score}/100`} detail={recovery.status} icon={BatteryCharging} />
        </div>


        <div className="dashboard-columns">
          <div className="dashboard-main-column">
            <section className="panel quick-start-panel">
              <SectionHeading eyebrow="GET MOVING" title="Training modes" subtitle="Choose what you're working on today." />


              <div className="quick-start-grid">
                <button type="button" className="quick-start-card" onClick={() => setTab('Programme')}>
                  <div className="quick-start-image gym-image"><Dumbbell size={30} /></div>
                  <div><strong>Gym training</strong><span>Strength & hypertrophy</span></div>
                  <ArrowRight size={17} />
                </button>


                <button type="button" className="quick-start-card" onClick={() => setTab('Basketball')}>
                  <div className="quick-start-image basketball-image"><Activity size={30} /></div>
                  <div><strong>Basketball</strong><span>Skills & athleticism</span></div>
                  <ArrowRight size={17} />
                </button>


                <button type="button" className="quick-start-card" onClick={() => setTab('Cardio')}>
                  <div className="quick-start-image running-image"><Footprints size={30} /></div>
                  <div><strong>Cardio</strong><span>Run, walk, bike & more</span></div>
                  <ArrowRight size={17} />
                </button>


                <button type="button" className="quick-start-card" onClick={() => setTab('Progress')}>
                  <div className="quick-start-image progress-image"><TrendingUp size={30} /></div>
                  <div><strong>Progress</strong><span>Review your data</span></div>
                  <ArrowRight size={17} />
                </button>
              </div>
            </section>


            <ReadinessCard recovery={recovery} state={state} setState={setState} />


            <section className="panel">
              <SectionHeading eyebrow="THIS WEEK" title="Activity overview" />


              <div className="activity-overview">
                <div className="activity-overview-item">
                  <div className="activity-overview-icon"><Dumbbell size={18} /></div>
                  <div><strong>{weeklySessions.filter((session) => session.type === 'train').length}</strong><span>Gym sessions</span></div>
                </div>
                <div className="activity-overview-item">
                  <div className="activity-overview-icon"><Activity size={18} /></div>
                  <div><strong>{weeklyBasketball.length}</strong><span>Basketball sessions</span></div>
                </div>
                <div className="activity-overview-item">
                  <div className="activity-overview-icon"><Footprints size={18} /></div>
                  <div><strong>{weeklyRuns.length}</strong><span>Runs</span></div>
                </div>
              </div>
            </section>
          </div>


          <aside className="dashboard-side-column">
            <WaterCard
              amount={todayWater}
              goal={goal}
              onAdd={updateWater}
              onRemove={() => updateWater(-250)}
            />


            <section className="panel">
              <div className="panel-heading">
                <div className="panel-icon"><TimerIcon size={19} /></div>
                <div><h3>Rest timer</h3><p>Set your recovery interval</p></div>
              </div>
              <div className="quick-timer-options">
                {[30, 60, 90, 120, 180].map((duration) => (
                  <button type="button" className="preset" key={duration} onClick={() => {
                    setTimerDuration(duration);
                    setTimerOpen(true);
                  }}>
                    {duration >= 60 ? `${duration / 60}m` : `${duration}s`}
                  </button>
                ))}
              </div>
              <button type="button" className="button button-secondary button-full" onClick={() => {
                setTimerDuration(90);
                setTimerOpen(true);
              }}>
                Open timer <ArrowRight size={16} />
              </button>
            </section>


            <section className="panel active-session-panel">
              <div className="panel-heading">
                <div className="panel-icon"><Clock size={19} /></div>
                <div><h3>Session timer</h3><p>Track your workout duration</p></div>
              </div>


              {activeSession ? (
                <>
                  <div className="active-session-name">{activeSession.name}</div>
                  <div className="session-elapsed">{formatDuration(liveElapsedSeconds)}</div>
                  <div className="timer-controls">
                    <button type="button" className="button button-primary" onClick={sessionRunning ? pauseSession : resumeSession}>
                      {sessionRunning ? <Pause size={16} /> : <Play size={16} />}
                      {sessionRunning ? 'Pause' : 'Resume'}
                    </button>
                    <button type="button" className="button button-secondary" onClick={finishSession}>
                      <Check size={16} /> Finish
                    </button>
                  </div>
                  <button type="button" className="text-button danger-text" onClick={discardSession}>Discard timer</button>
                </>
              ) : (
                <>
                  <p className="muted-copy">Start a timer when you begin training. Your duration will be added to your session history.</p>
                  <div className="session-start-buttons">
                    <button type="button" className="button button-primary button-full" onClick={() => startSession('train', 'Gym session')}>
                      <Play size={16} /> Start gym timer
                    </button>
                    <button type="button" className="button button-secondary button-full" onClick={() => startSession('basketball', 'Basketball session')}>
                      <Activity size={16} /> Start basketball timer
                    </button>
                  </div>
                </>
              )}
            </section>
          </aside>
        </div>
      </div>
    );
  };


  if (!loaded) {
    return (
      <main className="app-loading">
        <div className="loading-mark"><Dumbbell size={26} /></div>
        <span>Loading CEED GYM</span>
      </main>
    );
  }


  if (!cloudUser || !cloudReady || syncStatus === 'error' || syncStatus === 'offline') {
    return <main className="app-shell" style={{ padding: 24 }}><TrainingStyles /><div className="ceed-login-theme"><ThemeControl /></div><section className="panel cloud-account-gate" style={{ maxWidth: 620, margin: '40px auto', padding: 24 }}>
      <h2>{!cloudUser ? 'Sign in to CEED GYM' : cloudReady ? 'Cloud connection needs attention' : 'Loading cloud history'}</h2>
      <p>CEED GYM uses your cloud history and saves changes automatically. An internet connection is required.</p>
      {errorMessage && <p role="alert">{errorMessage}</p>}
      {cloudUser && <><GymSyncStatus status={syncStatus} /><button className="button button-primary" onClick={retrySync}>Retry cloud connection</button>
        {cloudReady && <><p>Your latest changes are not confirmed saved. Keep this app open until “Saved to cloud”.</p>
          <button className="button button-secondary" onClick={() => downloadBackup(state)}>Download unsaved changes</button>
          <button className="button button-secondary" onClick={() => { if (window.confirm('Discard unsaved changes on this screen and reload your saved cloud history?')) void reloadCloud(); }}>Reload cloud history</button></>}
      </>}
      <GymCloudSync onSync={retrySync} />
    </section></main>;
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="ceed-emblem" aria-hidden="true" />
          <div className="brand-text">
            <strong>CEED <span>GYM</span></strong>
            <small>MOVE AT YOUR OWN PACE</small>
          </div>
        </div>


        <div className="sidebar-section-label">WORKSPACE</div>


        <nav className="sidebar-nav" aria-label="Main navigation">
          {NAV_ITEMS.map(({ name, label, icon: Icon }) => (
            <button
              type="button"
              key={name}
              className={`nav-item ${tab === name ? 'nav-item-active' : ''}`}
              onClick={() => setTab(name)}
            >
              <Icon size={19} />
              <span>{label}</span>
              {tab === name && <span className="nav-active-indicator" />}
            </button>
          ))}
        </nav>


        <div className="sidebar-spacer" />


        <div className="sidebar-recovery">
          <div className="sidebar-recovery-top">
            <span>READINESS</span>
            <span className={`readiness-dot readiness-dot-${recovery.status.toLowerCase()}`} />
          </div>
          <div className="sidebar-recovery-score">{recovery.score}<small>/100</small></div>
          <ProgressBar value={recovery.score} />
          <span className="sidebar-recovery-status">{recovery.status}</span>
        </div>


        <div className="sidebar-footer">
          <div className="user-avatar">C</div>
          <div><strong>CEED GYM</strong><span>{cloudUser?.email || "Cloud account"}</span></div>
          <button type="button" className="sidebar-settings-button" onClick={() => setTab('Settings')} aria-label="Settings">
            <Settings size={17} />
          </button>
        </div>
      </aside>


      <main className="main-area">
        <header className="topbar">
          <div className="topbar-breadcrumb">
            <span>CEED GYM</span>
            <ChevronRight size={14} />
            <strong>{NAV_ITEMS.find((item) => item.name === tab)?.label || tab}</strong>
          </div>
          <div className="topbar-actions"><ThemeControl />
            <div className="topbar-date"><CalendarDays size={15} /> {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</div>
            <button type="button" className="topbar-timer-button" aria-label="Rest timer" onClick={() => {
              setTimerDuration(90);
              setTimerOpen(true);
            }}>
              <TimerIcon size={16} /><span>Rest timer</span>
            </button>
            <button
              type="button"
              className="topbar-settings-button"
              onClick={() => setTab('Settings')}
              aria-label="Settings"
              aria-pressed={tab === 'Settings'}
              title="Settings"
            >
              <Settings size={19} />
            </button>
          </div>
        </header>


        <div className="content-area">
          <GymSyncStatus status={syncStatus} />
          {renderPage()}
        </div>


        <footer className="app-footer">
          <span>CEED GYM <span className="footer-version">V8.0</span></span>
          <span>BUILD CONSISTENCY. TRACK PROGRESS.</span>
        </footer>
      </main>


      <div style={{ display: timerOpen ? undefined : 'none' }}>
        <div className="modal-backdrop" onMouseDown={(event) => {
          if (event.target === event.currentTarget) setTimerOpen(false);
        }}>
          <div className="timer-modal">
            <Timer initial={timerDuration} onClose={() => setTimerOpen(false)} />
          </div>
        </div>
      </div>


      {confirmReset && (
        <div className="modal-backdrop">
          <div className="confirm-modal">
            <div className="confirm-icon"><AlertCircle size={24} /></div>
            <h2>Reset all training data?</h2>
            <p>This permanently deletes your saved workout history, basketball logs, running logs, hydration and preferences from your cloud account on all devices.</p>
            <div className="confirm-actions">
              <button type="button" className="button button-secondary" onClick={() => setConfirmReset(false)}>Cancel</button>
              <button type="button" className="button button-danger" onClick={resetAll}>Delete all data</button>
            </div>
          </div>
        </div>
      )}


      {notice && (
        <div className="toast-message">
          <CheckCircle2 size={17} />
          <span>{notice}</span>
          <button type="button" onClick={() => setNotice('')} aria-label="Dismiss notification"><X size={15} /></button>
        </div>
      )}


      <nav className="mobile-nav" aria-label="Mobile navigation">
        {NAV_ITEMS.slice(0, 6).map(({ name, label, icon: Icon }) => (
          <button
            type="button"
            key={name}
            className={tab === name ? 'mobile-nav-item mobile-nav-active' : 'mobile-nav-item'}
            onClick={() => setTab(name)}
          >
            <Icon size={19} />
            <span>{label}</span>
          </button>
        ))}
      </nav>


      <TrainingStyles />
    </div>
  );
}
function TrainingStyles() {
  return <style jsx global>{`
        :root {
          --os-bg: var(--ceed-bg);
          --os-panel: var(--ceed-panel);
          --os-panel-raised: var(--ceed-raised);
          --os-line: rgba(162, 184, 220, .13);
          --os-text: var(--ceed-text);
          --os-muted: var(--ceed-muted);
          --os-blue: var(--ceed-accent);
          --os-blue-light: var(--ceed-accent);
          --os-radius: 17px;
        }


        * { box-sizing: border-box; }


        html, body { margin: 0; padding: 0; background: var(--os-bg); color: var(--os-text); font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
        body { min-width: 320px; }
        button, input, select { font: inherit; }
        button { cursor: pointer; }
        button:disabled { cursor: not-allowed; opacity: .5; }
        input, select { min-width: 0; }
        ::selection { background: rgba(57,132,255,.35); }


        .app-shell { min-height: 100vh; background: radial-gradient(ellipse at 65% -20%, rgba(35,94,180,.12), transparent 50%), var(--os-bg); }
        .sidebar { position: fixed; z-index: 30; inset: 0 auto 0 0; width: 244px; display: flex; flex-direction: column; padding: 27px 16px 18px; background: var(--ceed-panel); border-right: 1px solid var(--os-line); }
        .brand { display: flex; align-items: center; gap: 12px; padding: 0 8px 36px; }
        .brand-mark, .loading-mark { display: grid; place-items: center; width: 42px; height: 42px; border-radius: 13px; background: var(--os-blue); color: var(--ceed-text); box-shadow: 0 8px 24px rgba(57,132,255,.23); }
        .brand-text { display: flex; flex-direction: column; gap: 4px; }
        .brand-text strong { font-size: 15px; letter-spacing: .13em; font-weight: 850; }
        .brand-text strong span { color: var(--os-blue-light); }
        .brand-text small { font-size: 8px; letter-spacing: .14em; color: var(--os-muted); }
        .sidebar-section-label, .eyebrow { font-size: 10px; letter-spacing: .15em; font-weight: 800; color: var(--os-muted); }
        .sidebar-section-label { padding: 0 12px; margin-bottom: 12px; }
        .sidebar-nav { display: grid; gap: 5px; }
        .nav-item { position: relative; display: flex; align-items: center; gap: 13px; width: 100%; padding: 12px 13px; border: 1px solid transparent; border-radius: 11px; background: transparent; color: var(--ceed-muted); text-align: left; font-size: 13px; transition: .18s ease; }
        .nav-item:hover { color: var(--ceed-text); background: rgba(255,255,255,.035); }
        .nav-item-active { color: var(--ceed-text); background: rgba(57,132,255,.12); border-color: rgba(57,132,255,.19); }
        .nav-item-active > svg { color: var(--os-blue-light); }
        .nav-active-indicator { position: absolute; right: 0; width: 3px; height: 20px; border-radius: 4px 0 0 4px; background: var(--os-blue); }
        .sidebar-spacer { flex: 1; }
        .sidebar-recovery { padding: 15px; border: 1px solid var(--os-line); border-radius: 14px; background: linear-gradient(145deg, rgba(57,132,255,.09), rgba(57,132,255,.015)); }
        .sidebar-recovery-top { display: flex; justify-content: space-between; align-items: center; font-size: 9px; letter-spacing: .13em; font-weight: 800; color: var(--os-muted); }
        .readiness-dot { width: 7px; height: 7px; border-radius: 50%; background: #55d6a1; }
        .readiness-dot-moderate { background: #ffbd69; }
        .readiness-dot-protect { background: #ff687e; }
        .sidebar-recovery-score { margin: 12px 0 10px; font-size: 31px; font-weight: 800; letter-spacing: -.05em; }
        .sidebar-recovery-score small { margin-left: 3px; font-size: 12px; color: var(--os-muted); font-weight: 500; letter-spacing: 0; }
        .sidebar-recovery-status { display: block; margin-top: 8px; color: var(--os-blue-light); font-size: 10px; letter-spacing: .12em; font-weight: 800; }
        .sidebar-footer { display: flex; align-items: center; gap: 10px; margin-top: 20px; padding: 17px 3px 0; border-top: 1px solid var(--os-line); }
        .user-avatar { display: grid; place-items: center; width: 34px; height: 34px; border-radius: 50%; background: var(--ceed-input); color: var(--ceed-text); font-size: 13px; font-weight: 800; }
        .sidebar-footer > div:nth-child(2) { display: flex; flex-direction: column; gap: 4px; flex: 1; }
        .sidebar-footer strong { font-size: 11px; }
        .sidebar-footer span { color: var(--os-muted); font-size: 10px; }
        .sidebar-settings-button { border: 0; background: transparent; color: var(--os-muted); padding: 7px; }


        .main-area { min-height: 100vh; margin-left: 244px; display: flex; flex-direction: column; }
        .topbar { height: 68px; padding: 0 36px; display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid var(--os-line); background: rgba(8,11,18,.76); backdrop-filter: blur(16px); }
        .topbar-breadcrumb, .topbar-actions, .topbar-date { display: flex; align-items: center; gap: 10px; }
        .topbar-breadcrumb { font-size: 11px; color: var(--os-muted); letter-spacing: .04em; }
        .topbar-breadcrumb strong { color: var(--ceed-text); font-weight: 650; }
        .topbar-actions { gap: 18px; }
        .topbar-date { font-size: 11px; color: var(--ceed-muted); }
        .topbar-settings-button { display: none; }
        .topbar-settings-button:focus-visible { outline: 2px solid var(--os-blue-light); outline-offset: 3px; }
        .topbar-timer-button { display: flex; align-items: center; gap: 8px; padding: 9px 12px; color: var(--ceed-text); background: rgba(57,132,255,.11); border: 1px solid rgba(57,132,255,.22); border-radius: 9px; font-size: 11px; font-weight: 650; }
        .content-area { width: 100%; max-width: 1500px; margin: 0 auto; padding: 30px 36px 28px; flex: 1; }
        .app-footer { display: flex; justify-content: space-between; gap: 12px; padding: 17px 36px; border-top: 1px solid var(--os-line); color: var(--ceed-muted); font-size: 9px; letter-spacing: .13em; font-weight: 750; }
        .footer-version { margin-left: 7px; color: var(--os-blue-light); }
        .page-stack { display: grid; gap: 22px; }
        .section-heading { display: flex; justify-content: space-between; align-items: flex-end; gap: 18px; margin-bottom: 20px; }
        .section-heading h2 { margin: 7px 0 0; font-size: clamp(23px, 3vw, 31px); letter-spacing: -.045em; font-weight: 780; }
        .section-heading p { margin: 7px 0 0; color: var(--os-muted); font-size: 12px; line-height: 1.6; max-width: 620px; }
        .panel { padding: 22px; border: 1px solid var(--os-line); border-radius: var(--os-radius); background: linear-gradient(145deg, rgba(20,29,42,.92), rgba(14,20,30,.92)); box-shadow: 0 12px 35px rgba(0,0,0,.08); }
        .panel-heading { display: flex; align-items: center; gap: 12px; margin-bottom: 21px; }
        .panel-heading h3 { margin: 0; font-size: 14px; font-weight: 750; letter-spacing: -.015em; }
        .panel-heading p { margin: 5px 0 0; font-size: 11px; color: var(--os-muted); }
        .panel-icon { display: grid; place-items: center; flex: 0 0 auto; width: 39px; height: 39px; border-radius: 12px; background: rgba(57,132,255,.12); color: var(--os-blue-light); }
        .stats-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 13px; }
        .stat-card { padding: 17px 18px; min-width: 0; border: 1px solid var(--os-line); border-radius: 14px; background: linear-gradient(145deg, #131c29, #0e141e); }
        .stat-card-accent { border-color: rgba(57,132,255,.24); background: linear-gradient(145deg, rgba(57,132,255,.12), rgba(14,20,30,.95)); }
        .stat-top { display: flex; justify-content: space-between; gap: 8px; color: var(--os-muted); font-size: 10px; font-weight: 650; }
        .stat-top svg { color: var(--os-blue-light); flex-shrink: 0; }
        .stat-value { margin-top: 14px; font-size: clamp(21px, 2.5vw, 29px); font-weight: 800; letter-spacing: -.055em; overflow-wrap: anywhere; }
        .stat-detail { margin-top: 5px; color: var(--os-muted); font-size: 10px; }


        .dashboard-hero { position: relative; display: flex; align-items: center; min-height: 300px; overflow: hidden; border: 1px solid rgba(57,132,255,.23); border-radius: 22px; background: radial-gradient(ellipse at 76% 48%, rgba(45,115,240,.27), transparent 42%), linear-gradient(115deg, #101d31, #0e1521 58%, #0c121d); }
        .dashboard-hero-content { position: relative; z-index: 2; padding: 34px 38px; max-width: 620px; }
        .dashboard-hero .eyebrow { display: flex; align-items: center; gap: 8px; color: #91baff; }
        .live-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--os-blue-light); box-shadow: 0 0 13px var(--os-blue); }
        .dashboard-hero h1 { margin: 19px 0 12px; font-size: clamp(39px, 5vw, 64px); line-height: .98; letter-spacing: -.07em; font-weight: 850; }
        .dashboard-hero h1 span { color: var(--os-blue-light); }
        .dashboard-hero p { max-width: 380px; margin: 0 0 24px; color: var(--ceed-muted); font-size: 13px; line-height: 1.7; }
        .dashboard-hero-art { position: absolute; inset: 0 2% 0 auto; width: 45%; display: grid; place-items: center; color: rgba(121,173,255,.75); }
        .dashboard-hero-art > svg { position: relative; z-index: 1; transform: rotate(-24deg); filter: drop-shadow(0 14px 35px rgba(57,132,255,.28)); }
        .hero-ring { position: absolute; width: 270px; height: 270px; border: 1px solid rgba(86,149,255,.24); border-radius: 50%; }
        .hero-ring-one { width: 230px; height: 230px; }
        .hero-ring-two { width: 310px; height: 310px; border-style: dashed; opacity: .65; }
        .hero-art-label { position: absolute; bottom: 23px; right: 24px; color: rgba(159,190,244,.52); font-size: 8px; letter-spacing: .18em; }
        .button { display: inline-flex; align-items: center; justify-content: center; gap: 8px; min-height: 39px; padding: 10px 14px; border: 1px solid transparent; border-radius: 9px; font-size: 11px; font-weight: 750; transition: .18s ease; }
        .cloud-account-gate p { margin: 12px 0; line-height: 1.65; color: var(--os-muted); }
        .button-primary { color: var(--ceed-text); background: var(--os-blue); box-shadow: 0 5px 17px rgba(57,132,255,.14); }
        .button-primary:hover { background: #5594ff; transform: translateY(-1px); }
        .button-light { color: #0c1524; background: #eaf2ff; }
        .button-light:hover { background: var(--ceed-text); }
        .button-secondary { color: var(--ceed-text); background: rgba(255,255,255,.035); border-color: var(--os-line); }
        .button-secondary:hover { background: rgba(255,255,255,.075); color: var(--ceed-text); }
        .button-danger { color: var(--ceed-text); background: #d94c62; }
        .button-danger:hover { background: #ef5c72; }
        .button-small { min-height: 31px; padding: 7px 10px; font-size: 10px; }
        .button-full { width: 100%; }
        .dashboard-date { display: flex; align-items: center; justify-content: space-between; margin: 3px 0 -7px; }
        .dashboard-date h2 { margin: 6px 0 0; font-size: 16px; letter-spacing: -.025em; }
        .dashboard-date-icon { display: grid; place-items: center; width: 42px; height: 42px; border: 1px solid var(--os-line); border-radius: 12px; color: var(--os-blue-light); background: var(--os-panel); }
        .dashboard-columns { display: grid; grid-template-columns: minmax(0, 1.45fr) minmax(280px, .85fr); gap: 20px; align-items: start; }
        .dashboard-main-column, .dashboard-side-column { display: grid; gap: 20px; min-width: 0; }
        .quick-start-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
        .quick-start-card { display: flex; align-items: center; gap: 12px; min-width: 0; padding: 12px; border: 1px solid var(--os-line); border-radius: 13px; color: var(--os-text); background: rgba(255,255,255,.018); text-align: left; transition: .18s ease; }
        .quick-start-card:hover { background: rgba(57,132,255,.075); border-color: rgba(57,132,255,.28); transform: translateY(-2px); }
        .quick-start-image { display: grid; place-items: center; width: 49px; height: 49px; flex-shrink: 0; border-radius: 11px; color: #9fc4ff; background: linear-gradient(135deg, #1b3b68, #152338); }
        .basketball-image { color: #ffc18e; background: linear-gradient(135deg, #55331f, #241d1b); }
        .running-image { color: #8ce3c4; background: linear-gradient(135deg, #194c46, #172a2b); }
        .progress-image { color: #d2adff; background: linear-gradient(135deg, #45305e, #211e31); }
        .quick-start-card > div:nth-child(2) { display: flex; flex-direction: column; gap: 5px; flex: 1; min-width: 0; }
        .quick-start-card strong { font-size: 11px; }
        .quick-start-card span { color: var(--os-muted); font-size: 9px; }
        .quick-start-card > svg { color: var(--ceed-muted); flex-shrink: 0; }
        .progress-track { height: 6px; overflow: hidden; border-radius: 20px; background: rgba(255,255,255,.07); }
        .progress-fill { height: 100%; border-radius: inherit; background: linear-gradient(90deg, #367df5, #6ca7ff); transition: width .25s ease; }
        .water-panel .panel-heading { margin-bottom: 19px; }
        .water-amount { margin-left: auto; font-size: 26px; font-weight: 800; letter-spacing: -.05em; }
        .water-amount small { font-size: 12px; color: var(--os-muted); letter-spacing: 0; }
        .water-progress-label { display: flex; justify-content: space-between; gap: 10px; margin-top: 9px; color: var(--os-muted); font-size: 9px; }
        .water-actions { display: flex; flex-wrap: wrap; gap: 7px; margin-top: 17px; }
        .water-add, .water-remove { display: inline-flex; align-items: center; justify-content: center; gap: 3px; min-height: 32px; padding: 7px 9px; border: 1px solid var(--os-line); border-radius: 8px; background: rgba(255,255,255,.025); color: var(--ceed-text); font-size: 9px; }
        .water-add:hover, .water-remove:hover { border-color: rgba(57,132,255,.4); background: rgba(57,132,255,.09); }
        .water-remove { width: 32px; padding: 0; }
        .quick-timer-options { display: flex; flex-wrap: wrap; gap: 6px; margin: 0 0 15px; }
        .preset { padding: 7px 10px; border: 1px solid var(--os-line); border-radius: 8px; color: var(--ceed-muted); background: rgba(255,255,255,.025); font-size: 10px; }
        .preset.active, .preset:hover { color: var(--ceed-text); border-color: rgba(57,132,255,.5); background: rgba(57,132,255,.14); }
        .active-session-name { margin-top: -5px; color: var(--ceed-text); font-size: 12px; }
        .session-elapsed { margin: 8px 0 14px; font-size: 34px; font-weight: 800; letter-spacing: -.055em; font-variant-numeric: tabular-nums; }
        .session-start-buttons { display: grid; gap: 8px; }
        .muted-copy { margin: -5px 0 17px; color: var(--os-muted); font-size: 11px; line-height: 1.7; }
        .text-button { display: inline-flex; align-items: center; justify-content: center; gap: 5px; padding: 7px 5px; border: 0; color: #92baff; background: transparent; font-size: 10px; font-weight: 650; }
        .text-button:hover { color: var(--ceed-text); }
        .danger-text { color: #ff8998; }


        .readiness-panel .panel-heading { margin-bottom: 20px; }
        .readiness-badge { margin-left: auto; padding: 6px 9px; border-radius: 7px; background: rgba(74,211,157,.1); color: #64dcae; font-size: 9px; letter-spacing: .08em; font-weight: 850; }
        .readiness-badge.moderate { background: rgba(255,189,105,.11); color: #ffc675; }
        .readiness-badge.protect { background: rgba(255,104,126,.11); color: #ff8294; }
        .readiness-score-row { display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px; }
        .readiness-score { margin-top: 6px; font-size: 35px; letter-spacing: -.06em; font-weight: 850; }
        .readiness-score small { margin-left: 4px; color: var(--os-muted); font-size: 13px; font-weight: 500; letter-spacing: 0; }
        .readiness-score-icon { display: grid; place-items: center; width: 50px; height: 50px; border-radius: 15px; color: #8ebaff; background: rgba(57,132,255,.12); }
        .recovery-inputs { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 10px; margin-top: 20px; }
        .recovery-inputs label, .form-grid label, .rir-control { display: grid; gap: 7px; color: var(--os-muted); font-size: 10px; }
        input, select { width: 100%; min-height: 38px; padding: 9px 10px; border: 1px solid rgba(158,181,218,.16); border-radius: 8px; outline: none; background: var(--ceed-input); color: var(--ceed-text); font-size: 11px; }
        input:focus, select:focus { border-color: rgba(57,132,255,.7); box-shadow: 0 0 0 3px rgba(57,132,255,.08); }
        input::placeholder { color: var(--ceed-muted); }
        .load-breakdown { display: grid; gap: 0; margin-top: 19px; border-top: 1px solid var(--os-line); }
        .load-breakdown > div { display: flex; justify-content: space-between; gap: 12px; padding: 10px 0; border-bottom: 1px solid var(--os-line); font-size: 10px; }
        .load-breakdown span { color: var(--os-muted); }
        .load-breakdown strong { color: var(--ceed-text); }
        .recovery-warning { display: flex; align-items: flex-start; gap: 8px; margin-top: 14px; padding: 11px; border: 1px solid rgba(255,189,105,.18); border-radius: 9px; color: #ffce89; background: rgba(255,189,105,.055); font-size: 10px; line-height: 1.6; }
        .recovery-warning svg { flex-shrink: 0; }
        .activity-overview { display: grid; grid-template-columns: repeat(3, minmax(0,1fr)); gap: 12px; }
        .activity-overview-item { display: flex; align-items: center; gap: 10px; min-width: 0; padding: 12px; border-radius: 11px; background: rgba(255,255,255,.025); }
        .activity-overview-icon { display: grid; place-items: center; flex-shrink: 0; width: 35px; height: 35px; border-radius: 10px; background: rgba(57,132,255,.1); color: #8bb7ff; }
        .activity-overview-item > div:last-child { display: grid; gap: 4px; min-width: 0; }
        .activity-overview-item strong { font-size: 16px; }
        .activity-overview-item span { color: var(--os-muted); font-size: 9px; }


        .day-selector { display: flex; flex-wrap: wrap; gap: 8px; }
        .day-chip { padding: 10px 13px; border: 1px solid var(--os-line); border-radius: 9px; background: rgba(255,255,255,.02); color: var(--ceed-muted); font-size: 10px; font-weight: 700; }
        .day-chip:hover, .day-chip-active { border-color: rgba(57,132,255,.4); background: rgba(57,132,255,.12); color: var(--ceed-text); }
        .programme-hero { position: relative; display: flex; align-items: center; justify-content: space-between; min-height: 150px; padding: 26px 28px; overflow: hidden; border: 1px solid rgba(57,132,255,.2); border-radius: 17px; background: radial-gradient(ellipse at 85% 20%, rgba(57,132,255,.18), transparent 50%), #101a29; }
        .programme-hero h2 { margin: 9px 0 7px; font-size: 30px; letter-spacing: -.05em; }
        .programme-hero p { margin: 0; color: var(--ceed-muted); font-size: 11px; }
        .programme-meta { display: flex; flex-wrap: wrap; gap: 15px; margin-top: 17px; color: var(--ceed-text); font-size: 10px; }
        .programme-meta span { display: flex; align-items: center; gap: 6px; }
        .programme-hero-icon { display: grid; place-items: center; width: 86px; height: 86px; margin-right: 25px; border: 1px solid rgba(100,160,255,.18); border-radius: 24px; color: #8bbaff; background: rgba(57,132,255,.1); transform: rotate(-8deg); }
        .adjustment-banner { display: flex; gap: 12px; padding: 15px; border: 1px solid rgba(255,189,105,.22); border-radius: 12px; color: #ffd08b; background: rgba(255,189,105,.06); }
        .adjustment-banner > svg { flex-shrink: 0; margin-top: 1px; }
        .adjustment-banner strong { font-size: 11px; }
        .adjustment-banner p { margin: 5px 0 0; color: var(--ceed-muted); font-size: 10px; line-height: 1.6; }
        .exercise-list { display: grid; gap: 12px; }
        .programme-session-bar { display: flex; flex-wrap: wrap; align-items: center; gap: 10px; margin-top: 18px; padding: 14px; border: 1px solid var(--os-line); border-radius: 12px; background: rgba(57,132,255,.055); }
        .programme-session-bar > div { display: grid; gap: 4px; min-width: 120px; margin-right: auto; }
        .programme-session-bar > div strong { font-size: 17px; font-variant-numeric: tabular-nums; }
        .programme-session-bar p { width: 100%; margin: 0; color: var(--os-muted); font-size: 10px; line-height: 1.5; }
        .save-error { margin-top: 10px; color: #ff9ca8; font-size: 10px; }
        .exercise-card { padding: 17px; border: 1px solid var(--os-line); border-radius: 14px; background: linear-gradient(140deg, #121a27, #0e141e); }
        .exercise-heading { display: flex; align-items: center; }
        .exercise-toggle { display: flex; align-items: center; gap: 12px; width: 100%; padding: 0; border: 0; color: var(--os-text); background: transparent; text-align: left; }
        .exercise-number { display: grid; place-items: center; flex-shrink: 0; width: 33px; height: 33px; border-radius: 10px; color: #9bc0ff; background: rgba(57,132,255,.12); font-size: 10px; font-weight: 800; }
        .exercise-number-done { color: #66dcb0; background: rgba(74,211,157,.12); }
        .exercise-title-wrap { flex: 1; min-width: 0; }
        .exercise-title-wrap h3 { margin: 0; font-size: 12px; font-weight: 750; }
        .exercise-title-wrap p { margin: 5px 0 0; color: var(--os-muted); font-size: 10px; }
        .exercise-toggle > svg { color: var(--ceed-muted); transition: transform .18s; }
        .exercise-toggle > svg.chevron-open { transform: rotate(180deg); }
        .previous-performance { display: flex; align-items: center; gap: 6px; margin: 13px 0 0 45px; color: var(--ceed-muted); font-size: 10px; }
        .progression-hint { display: flex; align-items: flex-start; gap: 9px; margin-top: 13px; padding: 11px 12px; border: 1px solid rgba(57,132,255,.16); border-radius: 10px; color: #9bc0ff; background: rgba(57,132,255,.055); }
        .progression-hint > svg { flex-shrink: 0; margin-top: 1px; }
        .progression-hint strong { display: block; font-size: 10px; font-weight: 800; }
        .progression-hint p { margin: 4px 0 0; color: var(--ceed-muted); font-size: 10px; line-height: 1.55; }
        .progression-up { border-color: rgba(74,211,157,.22); color: #66dcb0; background: rgba(74,211,157,.055); }
        .progression-reduce { border-color: rgba(255,189,105,.22); color: #ffd08b; background: rgba(255,189,105,.055); }
        .progression-start { color: #9bc0ff; }
        .set-table { margin-top: 18px; }
        .set-table-header, .set-row { display: grid; grid-template-columns: .45fr 1fr 1fr .5fr; gap: 12px; align-items: center; }
        .set-table-header { padding: 0 8px 8px; color: var(--ceed-muted); font-size: 8px; letter-spacing: .12em; font-weight: 800; }
        .set-row { padding: 7px 8px; border-top: 1px solid rgba(162,184,220,.08); border-radius: 7px; }
        .set-row-done { background: rgba(74,211,157,.045); }
        .set-number { color: var(--ceed-muted); font-size: 10px; font-weight: 700; }
        .set-row input { min-height: 33px; padding: 7px; font-size: 11px; }
        .set-check { display: grid; place-items: center; justify-self: center; width: 29px; height: 29px; border: 1px solid rgba(162,184,220,.18); border-radius: 8px; color: var(--ceed-muted); background: rgba(255,255,255,.02); }
        .set-check-done { border-color: rgba(74,211,157,.3); color: #66dcb0; background: rgba(74,211,157,.12); }
        .exercise-bottom { display: flex; align-items: flex-end; justify-content: space-between; flex-wrap: wrap; gap: 12px; margin-top: 15px; }
        .rir-control { width: 150px; }
        .rir-control select { min-height: 33px; padding: 7px; }
        .exercise-actions { display: flex; align-items: center; gap: 7px; }
        .alternatives-panel { margin-top: 14px; padding: 13px; border: 1px solid var(--os-line); border-radius: 10px; background: rgba(5,10,17,.4); }
        .alternatives-panel .eyebrow { margin-bottom: 8px; }
        .alternatives-panel > p { color: var(--os-muted); font-size: 10px; }
        .alternative-option { display: flex; align-items: center; justify-content: space-between; width: 100%; padding: 11px 4px; border: 0; border-bottom: 1px solid var(--os-line); color: var(--ceed-text); background: transparent; text-align: left; font-size: 11px; }
        .alternative-option:last-child { border-bottom: 0; }
        .alternative-option:hover { color: #7eafff; }


        .form-grid { display: grid; grid-template-columns: repeat(2, minmax(0,1fr)); gap: 15px; margin-bottom: 19px; }
        .form-span { grid-column: 1 / -1; }
        .cardio-form > .button { margin-top: 1px; }
        .basketball-session-grid { display: grid; grid-template-columns: repeat(3, minmax(0,1fr)); gap: 10px; margin-top: 15px; }
        .basketball-session-card { display: flex; flex-direction: column; align-items: flex-start; gap: 9px; min-width: 0; padding: 15px; border: 1px solid var(--os-line); border-radius: 12px; color: var(--os-text); background: rgba(255,255,255,.02); text-align: left; transition: .18s; }
        .basketball-session-card:hover, .basketball-session-selected { border-color: rgba(57,132,255,.42); background: rgba(57,132,255,.09); }
        .basketball-card-icon { display: grid; place-items: center; width: 38px; height: 38px; border-radius: 11px; color: #a3c6ff; background: rgba(57,132,255,.13); }
        .basketball-session-card strong { font-size: 11px; }
        .basketball-session-card span { color: var(--os-muted); font-size: 9px; }
        .basketball-exercise-list { display: grid; margin-bottom: 22px; }
        .basketball-exercise-row { display: flex; align-items: center; gap: 11px; padding: 10px 0; border-bottom: 1px solid var(--os-line); }
        .basketball-exercise-row:last-child { border-bottom: 0; }
        .basketball-exercise-row > div { display: grid; gap: 5px; }
        .basketball-exercise-row strong { font-size: 11px; }
        .basketball-exercise-row span:not(.exercise-number) { color: var(--os-muted); font-size: 10px; }
        .log-list { display: grid; }
        .log-row { display: flex; align-items: center; gap: 12px; min-width: 0; padding: 13px 0; border-bottom: 1px solid var(--os-line); }
        .log-row:last-child { border-bottom: 0; }
        .log-icon { display: grid; place-items: center; flex-shrink: 0; width: 36px; height: 36px; border-radius: 10px; color: #91baff; background: rgba(57,132,255,.1); }
        .log-main { display: grid; gap: 5px; flex: 1; min-width: 0; }
        .log-main strong { overflow: hidden; text-overflow: ellipsis; font-size: 11px; white-space: nowrap; }
        .log-main span { color: var(--os-muted); font-size: 9px; line-height: 1.5; }
        .log-value { flex-shrink: 0; color: var(--ceed-text); font-size: 11px; font-weight: 750; }
        .icon-button { display: grid; place-items: center; flex-shrink: 0; width: 31px; height: 31px; border: 1px solid var(--os-line); border-radius: 8px; color: var(--ceed-muted); background: rgba(255,255,255,.02); }
        .icon-button:hover { color: #ff8798; border-color: rgba(255,104,126,.25); }
        .empty-state { display: flex; flex-direction: column; align-items: center; padding: 30px 16px; text-align: center; }
        .empty-state-icon { display: grid; place-items: center; width: 52px; height: 52px; border-radius: 16px; color: #81b2ff; background: rgba(57,132,255,.1); }
        .empty-state h3 { margin: 15px 0 5px; font-size: 13px; }
        .empty-state p { max-width: 300px; margin: 0; color: var(--os-muted); font-size: 10px; line-height: 1.7; }


        .weekly-chart { display: grid; grid-template-columns: repeat(7, minmax(0,1fr)); gap: 12px; height: 200px; padding-top: 10px; }
        .chart-column { display: flex; flex-direction: column; align-items: center; justify-content: flex-end; gap: 8px; min-width: 0; }
        .chart-value { color: var(--ceed-muted); font-size: 8px; white-space: nowrap; }
        .chart-bar-track { display: flex; align-items: flex-end; justify-content: center; width: 100%; height: 145px; border-radius: 7px 7px 3px 3px; background: rgba(255,255,255,.025); overflow: hidden; }
        .chart-bar { width: min(45px, 70%); min-height: 0; border-radius: 6px 6px 2px 2px; background: linear-gradient(0deg, #2563cf, #71adff); box-shadow: 0 0 20px rgba(57,132,255,.12); }
        .chart-column > span { color: var(--os-muted); font-size: 9px; }
        .settings-panel { padding: 0 22px; }
        .settings-row { display: flex; align-items: center; justify-content: space-between; gap: 20px; padding: 19px 0; border-bottom: 1px solid var(--os-line); }
        .settings-row:last-child { border-bottom: 0; }
        .settings-row > div { min-width: 0; }
        .settings-row strong { font-size: 12px; }
        .settings-row p { margin: 6px 0 0; color: var(--os-muted); font-size: 10px; line-height: 1.5; }
        .settings-row select, .settings-row input { max-width: 190px; }
        .danger-panel { border-color: rgba(255,104,126,.16); }
        .danger-icon { color: #ff8193; background: rgba(255,104,126,.1); }
        .privacy-note { display: flex; gap: 10px; align-items: flex-start; color: var(--os-muted); font-size: 10px; line-height: 1.7; }
        .privacy-note svg { flex-shrink: 0; color: #77b6ff; }


        .timer-panel { width: 100%; }
        .timer-header { display: flex; align-items: center; justify-content: space-between; }
        .timer-header h3 { margin: 6px 0 0; font-size: 17px; }
        .timer-display { margin: 26px 0 22px; text-align: center; font-size: clamp(52px, 10vw, 78px); font-weight: 800; letter-spacing: -.075em; font-variant-numeric: tabular-nums; }
        .timer-finished { color: #68dfb1; }
        .timer-complete { display: flex; align-items: center; justify-content: center; gap: 7px; margin: -10px 0 17px; color: #68dfb1; font-size: 10px; }
        .timer-presets { display: flex; justify-content: center; flex-wrap: wrap; gap: 7px; }
        .timer-custom { display: flex; gap: 8px; margin-top: 15px; }
        .timer-custom input { flex: 1; }
        .timer-controls { display: flex; gap: 9px; margin-top: 17px; }
        .timer-controls > .button { flex: 1; }
        .modal-backdrop { position: fixed; z-index: 100; inset: 0; display: grid; place-items: center; padding: 20px; background: rgba(2,5,10,.76); backdrop-filter: blur(10px); }
        .timer-modal, .confirm-modal { width: min(100%, 420px); padding: 24px; border: 1px solid rgba(148,177,222,.19); border-radius: 19px; background: var(--ceed-input); box-shadow: 0 30px 100px rgba(0,0,0,.45); }
        .confirm-modal { text-align: center; }
        .confirm-icon { display: grid; place-items: center; width: 51px; height: 51px; margin: 0 auto 15px; border-radius: 15px; color: #ff8193; background: rgba(255,104,126,.1); }
        .confirm-modal h2 { margin: 0 0 9px; font-size: 20px; letter-spacing: -.04em; }
        .confirm-modal p { color: var(--os-muted); font-size: 11px; line-height: 1.7; }
        .confirm-actions { display: flex; justify-content: center; gap: 9px; margin-top: 20px; }
        .toast-message { position: fixed; z-index: 120; right: 24px; bottom: 24px; display: flex; align-items: center; gap: 10px; max-width: calc(100vw - 35px); padding: 13px 14px; border: 1px solid rgba(74,211,157,.22); border-radius: 11px; color: var(--ceed-text); background: var(--ceed-input); box-shadow: 0 10px 40px rgba(0,0,0,.3); font-size: 11px; }
        .toast-message > svg { flex-shrink: 0; color: #66dcb0; }
        .toast-message button { display: grid; place-items: center; padding: 3px; border: 0; color: var(--ceed-muted); background: transparent; }
        .app-loading { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 15px; min-height: 100vh; color: var(--os-muted); background: var(--os-bg); font-size: 12px; }
        .loading-mark { width: 50px; height: 50px; }
        .mobile-nav { display: none; }


        @media (min-width: 1600px) {
          .content-area { padding-top: 40px; }
          .dashboard-hero { min-height: 330px; }
        }


        @media (max-width: 1200px) {
          .sidebar { width: 218px; }
          .main-area { margin-left: 218px; }
          .content-area { padding-right: 24px; padding-left: 24px; }
          .topbar { padding-right: 24px; padding-left: 24px; }
          .stats-grid { grid-template-columns: repeat(2, minmax(0,1fr)); }
          .dashboard-columns { grid-template-columns: minmax(0,1fr); }
          .dashboard-side-column { grid-template-columns: repeat(2, minmax(0,1fr)); align-items: start; }
          .dashboard-side-column .water-panel { grid-row: span 2; }
        }


        @media (max-width: 800px) {
          .sidebar { width: 68px; align-items: center; padding: 20px 8px; }
          .brand { padding: 0 0 30px; }
          .brand-text, .sidebar-section-label, .nav-item span:not(.nav-active-indicator), .sidebar-recovery, .sidebar-footer > div:nth-child(2), .sidebar-settings-button { display: none; }
          .brand-mark { width: 42px; }
          .sidebar-nav { width: 100%; }
          .nav-item { justify-content: center; padding: 12px 0; }
          .nav-item > svg { width: 20px; height: 20px; }
          .nav-active-indicator { right: -8px; }
          .sidebar-footer { justify-content: center; width: 100%; }
          .main-area { margin-left: 68px; }
          .topbar { padding: 0 18px; }
          .content-area { padding: 22px 18px 28px; }
          .app-footer { padding: 15px 18px; }
          .dashboard-hero-content { padding: 28px; }
          .dashboard-hero-art { right: -8%; width: 48%; opacity: .72; }
          .dashboard-hero h1 { font-size: 48px; }
          .dashboard-side-column { grid-template-columns: minmax(0,1fr); }
          .dashboard-side-column .water-panel { grid-row: auto; }
        }


        @media (max-width: 560px) {
          .sidebar { display: none; }
          .main-area { margin-left: 0; padding-bottom: 70px; }
          .topbar { height: 57px; padding: 0 15px; }
          .topbar-breadcrumb { gap: 6px; font-size: 9px; }
          .topbar-actions { gap: 9px; }
          .topbar-date { display: none; }
          .topbar-settings-button { display: grid; place-items: center; flex-shrink: 0; width: 44px; height: 44px; padding: 0; border: 1px solid var(--os-line); border-radius: 9px; background: var(--ceed-input); color: #a9c8f7; }
          .topbar-settings-button[aria-pressed="true"] { border-color: var(--os-blue); color: var(--os-blue-light); }
          .topbar-timer-button { padding: 8px 9px; font-size: 10px; }
          .content-area { padding: 17px 13px 22px; }
          .app-footer { padding: 14px; font-size: 7px; }
          .app-footer > span:last-child { text-align: right; }
          .page-stack { gap: 16px; }
          .section-heading { margin-bottom: 15px; }
          .section-heading h2 { font-size: 25px; }
          .section-heading p { font-size: 11px; }
          .dashboard-hero { min-height: 280px; }
          .dashboard-hero-content { padding: 25px 20px; }
          .dashboard-hero h1 { font-size: 43px; }
          .dashboard-hero p { max-width: 260px; font-size: 11px; }
          .dashboard-hero-art { right: -24%; width: 65%; opacity: .35; }
          .hero-ring-two { width: 230px; height: 230px; }
          .hero-ring-one { width: 170px; height: 170px; }
          .hero-art-label { display: none; }
          .stats-grid { gap: 9px; }
          .stat-card { padding: 13px; }
          .stat-top { font-size: 9px; }
          .stat-value { font-size: 23px; margin-top: 10px; }
          .stat-detail { font-size: 9px; }
          .dashboard-columns { gap: 15px; }
          .dashboard-main-column, .dashboard-side-column { gap: 15px; }
          .panel { padding: 16px; border-radius: 14px; }
          .quick-start-grid { gap: 8px; }
          .quick-start-card { gap: 8px; padding: 9px; }
          .quick-start-image { width: 38px; height: 38px; }
          .quick-start-image svg { width: 22px; }
          .quick-start-card strong { font-size: 10px; }
          .quick-start-card span { font-size: 8px; }
          .quick-start-card > svg { display: none; }
          .activity-overview { gap: 7px; }
          .activity-overview-item { flex-direction: column; align-items: flex-start; padding: 9px; }
          .activity-overview-item strong { font-size: 14px; }
          .activity-overview-item span { font-size: 8px; }
          .recovery-inputs { gap: 7px; }
          .recovery-inputs label { font-size: 9px; }
          .recovery-inputs input, .recovery-inputs select { padding: 8px 5px; font-size: 10px; }
          .programme-hero { min-height: 140px; padding: 19px; }
          .programme-hero h2 { font-size: 25px; }
          .programme-hero-icon { width: 55px; height: 55px; margin-right: 0; border-radius: 15px; }
          .programme-hero-icon svg { width: 30px; }
          .programme-meta { gap: 9px; font-size: 9px; }
          .day-selector { gap: 6px; }
          .day-chip { padding: 8px 9px; font-size: 9px; }
          .exercise-card { padding: 12px; }
          .exercise-title-wrap h3 { font-size: 11px; }
          .exercise-title-wrap p { font-size: 9px; }
          .set-table-header, .set-row { gap: 7px; }
          .set-row input { padding: 6px 4px; }
          .exercise-bottom { align-items: stretch; }
          .rir-control { width: 100%; }
          .exercise-actions { justify-content: space-between; width: 100%; }
          .basketball-session-grid { grid-template-columns: repeat(2,minmax(0,1fr)); gap: 8px; }
          .basketball-session-card { padding: 11px; }
          .form-grid { gap: 11px; }
          .form-grid label { font-size: 9px; }
          .log-row { gap: 8px; }
          .log-icon { width: 31px; height: 31px; }
          .log-main strong { font-size: 10px; }
          .log-main span { font-size: 8px; }
          .log-value { font-size: 10px; }
          .weekly-chart { gap: 6px; }
          .chart-value { font-size: 7px; }
          .chart-bar-track { height: 120px; }
          .settings-row { align-items: flex-start; flex-direction: column; gap: 12px; }
          .settings-row select, .settings-row input { max-width: none; }
          .mobile-nav { position: fixed; z-index: 50; inset: auto 0 0; display: grid; grid-template-columns: repeat(6,minmax(0,1fr)); padding: 7px 4px max(7px, env(safe-area-inset-bottom)); border-top: 1px solid var(--os-line); background: rgba(9,14,22,.96); backdrop-filter: blur(18px); }
          .mobile-nav-item { display: flex; flex-direction: column; align-items: center; gap: 5px; padding: 6px 0; border: 0; color: var(--ceed-muted); background: transparent; font-size: 8px; }
          .mobile-nav-active { color: #8db8ff; }
          .mobile-nav-active svg { filter: drop-shadow(0 0 6px rgba(57,132,255,.3)); }
          .toast-message { right: 10px; bottom: 80px; left: 10px; justify-content: flex-start; }
          .timer-modal, .confirm-modal { padding: 19px; }
        }


        @media (max-width: 380px) {
          .topbar-timer-button { min-width: 44px; min-height: 44px; justify-content: center; }
          .topbar-timer-button span { display: none; }
        }

        @media (prefers-reduced-motion: reduce) {
          *, *::before, *::after { scroll-behavior: auto !important; animation-duration: .01ms !important; animation-iteration-count: 1 !important; transition-duration: .01ms !important; }
        }
      `}</style>;
}
