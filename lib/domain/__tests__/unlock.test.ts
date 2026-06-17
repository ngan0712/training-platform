import { describe, expect, it } from "vitest";
import type { ClickRow } from "@/lib/schemas/click";
import type { MaterialRow } from "@/lib/schemas/material";
import type { ModuleRow } from "@/lib/schemas/module";
import type { ExerciseRow } from "@/lib/schemas/exercise";
import type { ExerciseSubmissionRow } from "@/lib/schemas/exerciseSubmission";
import type { QuizRow } from "@/lib/schemas/quiz";
import { isModuleUnlocked } from "../unlock";

const makeModule = (overrides: Partial<ModuleRow> & { id: string }): ModuleRow => ({
  week_number: 1,
  order: 1,
  title: "Test Module",
  description: "",
  required_for_track: "both",
  created_at: new Date().toISOString(),
  ...overrides,
});

const makeMaterial = (
  overrides: Partial<MaterialRow> & { id: string; module_id: string }
): MaterialRow => ({
  order: 1,
  title: "Test Material",
  url: "https://example.com",
  type: "doc",
  is_compulsory: true,
  created_at: new Date().toISOString(),
  ...overrides,
});

const makeClick = (materialId: string): ClickRow => ({
  id: crypto.randomUUID(),
  user_id: crypto.randomUUID(),
  material_id: materialId,
  clicked_at: new Date().toISOString(),
});

const makeExercise = (
  overrides: Partial<ExerciseRow> & { id: string; module_id: string }
): ExerciseRow => ({
  title: "Test Exercise",
  prompt: "",
  is_compulsory: true,
  order: 1,
  created_at: new Date().toISOString(),
  ...overrides,
});

const makeSubmission = (
  exerciseId: string,
  status: ExerciseSubmissionRow["status"]
): ExerciseSubmissionRow => ({
  id: crypto.randomUUID(),
  exercise_id: exerciseId,
  user_id: crypto.randomUUID(),
  status,
  outcome: null,
  file_path: null,
  feedback: null,
  reviewer_id: null,
  submitted_at: status !== "draft" ? new Date().toISOString() : null,
  reviewed_at: status === "reviewed" ? new Date().toISOString() : null,
  updated_at: new Date().toISOString(),
});

describe("isModuleUnlocked", () => {
  const m1 = makeModule({ id: "mod-1", week_number: 1, order: 1 });
  const m2 = makeModule({ id: "mod-2", week_number: 2, order: 1 });
  const m3 = makeModule({ id: "mod-3", week_number: 3, order: 1 });

  const mat1a = makeMaterial({ id: "mat-1a", module_id: "mod-1", is_compulsory: true });
  const mat1b = makeMaterial({ id: "mat-1b", module_id: "mod-1", is_compulsory: false });
  const mat2a = makeMaterial({ id: "mat-2a", module_id: "mod-2", is_compulsory: true });

  const allModules = [m1, m2, m3];
  const allMaterials = [mat1a, mat1b, mat2a];

  it("first module is always unlocked with no clicks", () => {
    expect(isModuleUnlocked(m1, allModules, allMaterials, [])).toBe(true);
  });

  it("second module is locked when no compulsory materials are clicked", () => {
    expect(isModuleUnlocked(m2, allModules, allMaterials, [])).toBe(false);
  });

  it("second module unlocks when all compulsory materials of module 1 are clicked", () => {
    const clicks = [makeClick("mat-1a")];
    expect(isModuleUnlocked(m2, allModules, allMaterials, clicks)).toBe(true);
  });

  it("clicking only an optional does not unlock the next module", () => {
    const clicks = [makeClick("mat-1b")];
    expect(isModuleUnlocked(m2, allModules, allMaterials, clicks)).toBe(false);
  });

  it("third module remains locked when only module 1 compulsory is clicked but not module 2", () => {
    const clicks = [makeClick("mat-1a")];
    expect(isModuleUnlocked(m3, allModules, allMaterials, clicks)).toBe(false);
  });

  it("third module unlocks when module 2 compulsory is clicked", () => {
    const clicks = [makeClick("mat-1a"), makeClick("mat-2a")];
    expect(isModuleUnlocked(m3, allModules, allMaterials, clicks)).toBe(true);
  });

  // ── Exercise-aware unlock tests ──────────────────────────────────────────

  describe("exercise-aware unlock", () => {
    const ex1 = makeExercise({ id: "ex-1", module_id: "mod-1", is_compulsory: true });
    const ex1opt = makeExercise({ id: "ex-1-opt", module_id: "mod-1", is_compulsory: false });
    const exercises = [ex1, ex1opt];
    const clicks = [makeClick("mat-1a")]; // mat1a clicked

    it("second module stays locked when compulsory exercise has no submission", () => {
      expect(isModuleUnlocked(m2, allModules, allMaterials, clicks, exercises, [])).toBe(false);
    });

    it("second module stays locked when compulsory exercise only has a draft submission", () => {
      const subs = [makeSubmission("ex-1", "draft")];
      expect(isModuleUnlocked(m2, allModules, allMaterials, clicks, exercises, subs)).toBe(false);
    });

    it("second module unlocks when compulsory exercise is submitted", () => {
      const subs = [makeSubmission("ex-1", "submitted")];
      expect(isModuleUnlocked(m2, allModules, allMaterials, clicks, exercises, subs)).toBe(true);
    });

    it("second module unlocks when compulsory exercise is reviewed (regardless of outcome)", () => {
      const subs = [makeSubmission("ex-1", "reviewed")];
      expect(isModuleUnlocked(m2, allModules, allMaterials, clicks, exercises, subs)).toBe(true);
    });

    it("optional exercise submission does not affect unlock", () => {
      // Only optional exercise submitted — still locked because compulsory ex-1 not done
      const subs = [makeSubmission("ex-1-opt", "submitted")];
      expect(isModuleUnlocked(m2, allModules, allMaterials, clicks, exercises, subs)).toBe(false);
    });

    it("unlock still works with no exercise data passed (backwards compat)", () => {
      // When exercises/submissions args are omitted, only materials gate unlock
      expect(isModuleUnlocked(m2, allModules, allMaterials, clicks)).toBe(true);
    });
  });

  // ── Quiz-aware unlock tests ───────────────────────────────────────────────

  const makeQuiz = (overrides: Partial<QuizRow> & { id: string; module_id: string }): QuizRow => ({
    title: "Test Quiz",
    description: null,
    pass_threshold: 80,
    order: 1,
    is_compulsory: true,
    created_at: new Date().toISOString(),
    ...overrides,
  });

  describe("quiz-aware unlock", () => {
    const quiz1 = makeQuiz({ id: "quiz-1", module_id: "mod-1" });
    const quizzes = [quiz1];
    const clicks = [makeClick("mat-1a")]; // mat1a clicked

    it("second module stays locked when quiz has no passing attempt", () => {
      expect(
        isModuleUnlocked(m2, allModules, allMaterials, clicks, [], [], quizzes, new Set())
      ).toBe(false);
    });

    it("second module unlocks when quiz has a passing attempt", () => {
      expect(
        isModuleUnlocked(m2, allModules, allMaterials, clicks, [], [], quizzes, new Set(["quiz-1"]))
      ).toBe(true);
    });

    it("passing a different quiz id does not unlock (quiz not passed)", () => {
      const passingIds = new Set(["quiz-other"]);
      expect(
        isModuleUnlocked(m2, allModules, allMaterials, clicks, [], [], quizzes, passingIds)
      ).toBe(false);
    });

    it("unlock requires both compulsory exercises and quiz to be done", () => {
      const ex1 = makeExercise({ id: "ex-1", module_id: "mod-1", is_compulsory: true });
      const subsDone = [makeSubmission("ex-1", "submitted")];
      const passingNone = new Set<string>();
      const passingQuiz = new Set(["quiz-1"]);

      // Exercise done but quiz not passed — locked
      expect(
        isModuleUnlocked(
          m2,
          allModules,
          allMaterials,
          clicks,
          [ex1],
          subsDone,
          quizzes,
          passingNone
        )
      ).toBe(false);

      // Quiz passed but exercise not done — locked
      expect(
        isModuleUnlocked(m2, allModules, allMaterials, clicks, [ex1], [], quizzes, passingQuiz)
      ).toBe(false);

      // Both done — unlocked
      expect(
        isModuleUnlocked(
          m2,
          allModules,
          allMaterials,
          clicks,
          [ex1],
          subsDone,
          quizzes,
          passingQuiz
        )
      ).toBe(true);
    });

    it("unlock still works with no quiz data passed (backwards compat)", () => {
      expect(isModuleUnlocked(m2, allModules, allMaterials, clicks)).toBe(true);
    });
  });
});
