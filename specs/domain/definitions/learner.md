# Learner

**Context:** Identity

A signed-in user: a Supabase auth user plus a `profiles` row created automatically by the `on_auth_user_created` trigger.

## Attributes

| Attribute | Notes |
|-----------|-------|
| `id` | The auth user id |
| `display_name` | From the Google full name, or the email prefix |
| `xp` | Total experience points, never negative |
| `current_streak`, `longest_streak` | Consecutive local days with a completed round |
| `last_active_date` | Local calendar date of the last completed round |
| `beginner_completed_at` | Set when every Beginner item has been learned; unlocks Intermediate |

## Rules

- A learner can read and change only their own rows (row level security).
- The streak shown is 0 when `last_active_date` is before yesterday.
- A learner can delete their account and all data through `delete_my_account()`.

Code: `src/data/profileRepo.ts`, `src/game/streak.ts`, `src/auth/`.
