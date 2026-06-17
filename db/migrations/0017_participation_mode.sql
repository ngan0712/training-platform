-- Learners can explicitly choose to do the capstone solo or in a group.
-- NULL = undecided (treated as individual after cutoff).
-- 'group' membership is authoritative in group_members; this column captures
-- the explicit solo choice and the undecided state.
ALTER TABLE users ADD COLUMN IF NOT EXISTS participation_mode TEXT
  CHECK (participation_mode IN ('individual', 'group'));
