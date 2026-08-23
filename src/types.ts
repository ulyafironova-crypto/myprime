export type WorkoutType = "run" | "strength" | "functional_strength";
export type StrengthFocus = "upper" | "lower";
export type Workout = {
  id: string;
  type: WorkoutType;
  date: string;
  createdAt: string;
  updatedAt: string;
  distanceKm?: number;
  paceSecondsPerKm?: number;
  durationMinutes?: number;
  heartRate?: number;
  strengthFocus?: StrengthFocus;
  notes?: string;
};
export type WeeklyGoals = {
  run: number;
  strength: number;
  functionalStrength: number;
};
export type GoalVersion = { weekStart: string; goals: WeeklyGoals };
export const defaultGoals: WeeklyGoals = {
  run: 3,
  strength: 0,
  functionalStrength: 3,
};
