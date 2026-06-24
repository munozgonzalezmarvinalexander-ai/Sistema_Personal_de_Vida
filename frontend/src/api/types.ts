export interface User {
  id: string;
  email: string;
  display_name: string;
  created_at: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface Habit {
  id: string;
  user_id: string;
  name: string;
  category: string;
  level_min: string;
  level_normal: string;
  level_ideal: string;
  is_core: boolean;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface HabitCreate {
  name: string;
  category: string;
  level_min: string;
  level_normal: string;
  level_ideal: string;
  is_core: boolean;
}

export type LevelDone = 'none' | 'min' | 'normal' | 'ideal';

export interface HabitLog {
  id: string;
  user_id: string;
  habit_id: string;
  log_date: string;
  level_done: LevelDone | null;
  completed: boolean;
  points: number;
  created_at: string;
  updated_at: string;
}

export interface DailyCheckin {
  id: string;
  user_id: string;
  checkin_date: string;
  sleep_hours: number | null;
  sleep_quality: number | null;
  water_liters: number | null;
  mood: number | null;
  energy: number | null;
  food_quality: number | null;
  screen_hours: number | null;
  spending: number | null;
  university_study_minutes: number | null;
  english_minutes: number | null;
  programming_minutes: number | null;
  reading_minutes: number | null;
  meditation_minutes: number | null;
  points: number;
  note: string | null;
  created_at: string;
  updated_at: string;
}

export interface HabitReport {
  habit_id: string;
  name: string;
  category: string;
  days_completed: number;
  total_points: number;
}

export interface ComparisonValue {
  current: number | null;
  previous: number | null;
  direction: 'up' | 'down' | 'equal';
}

export interface WeeklyReport {
  start_date: string;
  end_date: string;
  total_points: number;
  days_logged: number;
  avg_sleep: number | null;
  avg_mood: number | null;
  avg_energy: number | null;
  total_study_minutes: number;
  total_english_minutes: number;
  total_programming_minutes: number;
  total_reading_minutes: number;
  total_meditation_minutes: number;
  habits_most_completed: HabitReport[];
  habits_least_completed: HabitReport[];
  comparison: Record<string, ComparisonValue> | null;
}

export interface TrendDay {
  date: string;
  points: number;
  sleep_hours: number | null;
  mood: number | null;
  energy: number | null;
  water_liters: number | null;
  university_study_minutes: number;
  english_minutes: number;
  programming_minutes: number;
  reading_minutes: number;
  meditation_minutes: number;
}

export interface TrendsResponse {
  days: number;
  data: TrendDay[];
}

export interface StreakResponse {
  current_streak: number;
  best_streak: number;
  grace_days_used_this_week: number;
  total_active_days: number;
  total_days_checked: number;
}

export type ExperimentStatus = 'active' | 'completed' | 'cancelled';
export type ExperimentDecision = 'adopt' | 'adjust' | 'discard';

export interface Experiment {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  hypothesis: string;
  metric_tracked: string;
  duration_days: number;
  start_date: string;
  end_date: string;
  status: ExperimentStatus;
  result: string | null;
  decision: ExperimentDecision | null;
  created_at: string;
  updated_at: string;
}

export interface ExperimentCreate {
  title: string;
  description?: string;
  hypothesis: string;
  metric_tracked: string;
  duration_days: 7 | 14 | 30;
  start_date: string;
}

export type EvidenceType = 'science' | 'tradition' | 'personal';
export type DifficultyLevel = 'low' | 'medium' | 'high';

export interface HabitLibraryItem {
  id: string;
  name: string;
  category: string;
  description: string;
  benefit: string;
  how_to_start: string;
  difficulty: DifficultyLevel;
  daily_minutes: number;
  evidence_type: EvidenceType;
  source: string | null;
  warning: string | null;
  active: boolean;
  created_at: string;
}

export interface AchievementItem {
  id: string;
  code: string;
  title: string;
  description: string;
  icon: string;
  category: string;
  unlocked_at: string;
}

export interface AchievementDefinition {
  code: string;
  title: string;
  description: string;
  icon: string;
  category: string;
  unlocked: boolean;
}

export interface UserProgress {
  level: number;
  total_points: number;
  current_threshold: number;
  next_threshold: number;
  points_in_level: number;
  points_needed: number;
  progress_pct: number;
  total_checkins: number;
  total_habits_completed: number;
  total_experiments_completed: number;
  total_achievements: number;
}

export interface AchievementsList {
  unlocked: AchievementItem[];
  available: AchievementDefinition[];
}

export interface RecalculateResult {
  new_achievements: string[];
  total_achievements: number;
}
