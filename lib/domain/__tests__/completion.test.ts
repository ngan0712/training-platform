import { describe, expect, it } from "vitest";
import type { ClickRow } from "@/lib/schemas/click";
import type { MaterialRow } from "@/lib/schemas/material";
import type { ModuleRow } from "@/lib/schemas/module";
import { moduleCompletion } from "../completion";

const mod: ModuleRow = {
  id: "mod-1",
  week_number: 1,
  order: 1,
  title: "Week 1",
  description: "",
  required_for_track: "both",
  created_at: new Date().toISOString(),
};

const makeMaterial = (id: string, is_compulsory: boolean): MaterialRow => ({
  id,
  module_id: "mod-1",
  order: 1,
  title: "Material",
  url: "https://example.com",
  type: "doc",
  is_compulsory,
  created_at: new Date().toISOString(),
});

const makeClick = (materialId: string): ClickRow => ({
  id: crypto.randomUUID(),
  user_id: "user-1",
  material_id: materialId,
  clicked_at: new Date().toISOString(),
});

describe("moduleCompletion", () => {
  const compulsory1 = makeMaterial("comp-1", true);
  const compulsory2 = makeMaterial("comp-2", true);
  const optional1 = makeMaterial("opt-1", false);
  const allMaterials = [compulsory1, compulsory2, optional1];

  it("returns zeros with no clicks", () => {
    const result = moduleCompletion(mod, allMaterials, []);
    expect(result).toEqual({
      total: 3,
      clicked: 0,
      compulsoryTotal: 2,
      compulsoryClicked: 0,
      isComplete: false,
    });
  });

  it("counts only clicked materials", () => {
    const result = moduleCompletion(mod, allMaterials, [makeClick("comp-1")]);
    expect(result.clicked).toBe(1);
    expect(result.compulsoryClicked).toBe(1);
    expect(result.isComplete).toBe(false);
  });

  it("optional click counts toward total but not toward isComplete", () => {
    const result = moduleCompletion(mod, allMaterials, [makeClick("opt-1")]);
    expect(result.clicked).toBe(1);
    expect(result.compulsoryClicked).toBe(0);
    expect(result.isComplete).toBe(false);
  });

  it("isComplete when all compulsory are clicked regardless of optional", () => {
    const clicks = [makeClick("comp-1"), makeClick("comp-2")];
    const result = moduleCompletion(mod, allMaterials, clicks);
    expect(result.compulsoryClicked).toBe(2);
    expect(result.isComplete).toBe(true);
  });

  it("isComplete with all materials clicked", () => {
    const clicks = [makeClick("comp-1"), makeClick("comp-2"), makeClick("opt-1")];
    const result = moduleCompletion(mod, allMaterials, clicks);
    expect(result.clicked).toBe(3);
    expect(result.isComplete).toBe(true);
  });

  it("ignores clicks from other modules", () => {
    const otherMaterial = makeMaterial("other-mod-mat", true);
    const otherMod: ModuleRow = { ...mod, id: "mod-2" };
    const otherMatFromOtherMod = { ...otherMaterial, module_id: "mod-2" };
    const clicks = [makeClick("other-mod-mat")];
    const result = moduleCompletion(mod, [compulsory1, compulsory2, otherMatFromOtherMod], clicks);
    expect(result.clicked).toBe(0);
    expect(result.isComplete).toBe(false);
    void otherMod;
  });
});
