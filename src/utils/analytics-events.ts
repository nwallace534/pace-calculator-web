// All custom analytics event names live in one place so call sites stay
// typo-proof and the full list of "things we track" is greppable. Event names
// are deliberately snake_case — PostHog's dashboard sorts and groups them more
// nicely that way, and it matches the convention used by most analytics tools.

export const AnalyticsEvent = {
  EventSelected: "event_selected",
  ThemeToggled: "theme_toggled",
  SplitsOpened: "splits_opened",
  TimesForPaceOpened: "times_for_pace_opened",
  SplitsUnitToggled: "splits_unit_toggled",
  DistanceUnitChanged: "distance_unit_changed",
  TimeFieldEdited: "time_field_edited",
  DistanceFieldEdited: "distance_field_edited",
  SpinnerUsed: "spinner_used",
  SpinnerHeld: "spinner_held",
  SpinnerHintShown: "spinner_hint_shown",
  CalculationCompleted: "calculation_completed",
  SavedDistanceAdded: "saved_distance_added",
  SavedDistanceRemoved: "saved_distance_removed",
} as const;

export type AnalyticsEventName =
  (typeof AnalyticsEvent)[keyof typeof AnalyticsEvent];
