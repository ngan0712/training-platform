/**
 * Seed script — run with: npm run seed
 *
 * 1. Sets admin role for known admin accounts (users must have signed in first).
 * 2. Upserts 8 curriculum modules with ~3 materials each.
 *
 * Idempotent — safe to run multiple times.
 * Placeholder URLs from a shared "Curriculum Drafts" Google Drive folder.
 * Replace with real URLs before launch.
 */

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set");
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// TODO: fill in the actual emails for Data Lead and Boss before running.
const ADMIN_EMAILS = [
  "ngan@pelago.co", // Megan
  // "data-lead@pelago.co",
  // "boss@pelago.co",
];

const PLACEHOLDER_BASE = "https://drive.google.com/drive/folders/curriculum-drafts-placeholder";

type ModuleInput = {
  week_number: number;
  order: number;
  title: string;
  description: string;
  required_for_track: "both" | "non_tech_only";
};

type MaterialInput = {
  week_number: number; // used to match module
  order: number;
  title: string;
  url: string;
  type: "doc" | "slides" | "reading" | "video" | "form";
  is_compulsory: boolean;
};

const MODULES: ModuleInput[] = [
  {
    week_number: 1,
    order: 1,
    title: "AI Fundamentals",
    description: "What is AI, how does it work, and why does it matter for Pelago?",
    required_for_track: "non_tech_only",
  },
  {
    week_number: 2,
    order: 1,
    title: "How Large Language Models Work",
    description:
      "A non-technical primer on transformers, tokens, and why LLMs sometimes hallucinate.",
    required_for_track: "non_tech_only",
  },
  {
    week_number: 3,
    order: 1,
    title: "Prompt Engineering Essentials",
    description: "Writing prompts that get consistent, useful results — for everyone.",
    required_for_track: "both",
  },
  {
    week_number: 4,
    order: 1,
    title: "AI Tools for Your Work",
    description: "Hands-on with the tools we use at Pelago: Claude, Gemini, and Cursor.",
    required_for_track: "both",
  },
  {
    week_number: 5,
    order: 1,
    title: "Ethics & Responsible AI",
    description: "Bias, privacy, and accountability — building AI we can stand behind.",
    required_for_track: "both",
  },
  {
    week_number: 6,
    order: 1,
    title: "Capstone Kick-off",
    description: "Form your group, pick a problem, and scope your capstone project.",
    required_for_track: "both",
  },
  {
    week_number: 7,
    order: 1,
    title: "Capstone Deep Dive",
    description: "Build, test, and iterate on your AI-assisted solution.",
    required_for_track: "both",
  },
  {
    week_number: 8,
    order: 1,
    title: "Showcase & Retrospective",
    description: "Present your capstone, celebrate wins, and reflect on what you learned.",
    required_for_track: "both",
  },
];

const MATERIALS: MaterialInput[] = [
  // Week 1 — AI Fundamentals
  {
    week_number: 1,
    order: 1,
    title: "AI at Pelago — Welcome Deck",
    url: `${PLACEHOLDER_BASE}/w1-welcome-slides`,
    type: "slides",
    is_compulsory: true,
  },
  {
    week_number: 1,
    order: 2,
    title: "What Is AI? (Reading)",
    url: `${PLACEHOLDER_BASE}/w1-what-is-ai`,
    type: "reading",
    is_compulsory: true,
  },
  {
    week_number: 1,
    order: 3,
    title: "AI in the Wild — Video Overview",
    url: `${PLACEHOLDER_BASE}/w1-video`,
    type: "video",
    is_compulsory: false,
  },

  // Week 2 — How LLMs Work
  {
    week_number: 2,
    order: 1,
    title: "LLMs Explained — Slides",
    url: `${PLACEHOLDER_BASE}/w2-llms-slides`,
    type: "slides",
    is_compulsory: true,
  },
  {
    week_number: 2,
    order: 2,
    title: "Tokens & Context Windows (Doc)",
    url: `${PLACEHOLDER_BASE}/w2-tokens-doc`,
    type: "doc",
    is_compulsory: true,
  },
  {
    week_number: 2,
    order: 3,
    title: "Optional Deep Dive: Attention Mechanisms",
    url: `${PLACEHOLDER_BASE}/w2-attention-reading`,
    type: "reading",
    is_compulsory: false,
  },

  // Week 3 — Prompt Engineering
  {
    week_number: 3,
    order: 1,
    title: "Prompt Patterns Cheat Sheet",
    url: `${PLACEHOLDER_BASE}/w3-prompt-patterns`,
    type: "doc",
    is_compulsory: true,
  },
  {
    week_number: 3,
    order: 2,
    title: "Prompting Workshop — Slides",
    url: `${PLACEHOLDER_BASE}/w3-workshop-slides`,
    type: "slides",
    is_compulsory: true,
  },
  {
    week_number: 3,
    order: 3,
    title: "Practice: Write Your First Prompt",
    url: `${PLACEHOLDER_BASE}/w3-practice-form`,
    type: "form",
    is_compulsory: true,
  },

  // Week 4 — AI Tools
  {
    week_number: 4,
    order: 1,
    title: "Pelago AI Toolkit Guide",
    url: `${PLACEHOLDER_BASE}/w4-toolkit-doc`,
    type: "doc",
    is_compulsory: true,
  },
  {
    week_number: 4,
    order: 2,
    title: "Claude & Gemini Comparison Video",
    url: `${PLACEHOLDER_BASE}/w4-tools-video`,
    type: "video",
    is_compulsory: true,
  },
  {
    week_number: 4,
    order: 3,
    title: "Try It: AI Tool Reflection",
    url: `${PLACEHOLDER_BASE}/w4-reflection-form`,
    type: "form",
    is_compulsory: false,
  },

  // Week 5 — Ethics
  {
    week_number: 5,
    order: 1,
    title: "Responsible AI at Pelago — Policy Doc",
    url: `${PLACEHOLDER_BASE}/w5-policy-doc`,
    type: "doc",
    is_compulsory: true,
  },
  {
    week_number: 5,
    order: 2,
    title: "Bias & Fairness in AI (Reading)",
    url: `${PLACEHOLDER_BASE}/w5-bias-reading`,
    type: "reading",
    is_compulsory: true,
  },
  {
    week_number: 5,
    order: 3,
    title: "Ethics Case Studies — Slides",
    url: `${PLACEHOLDER_BASE}/w5-case-studies-slides`,
    type: "slides",
    is_compulsory: false,
  },

  // Week 6 — Capstone Kick-off
  {
    week_number: 6,
    order: 1,
    title: "Capstone Brief & Rubric",
    url: `${PLACEHOLDER_BASE}/w6-capstone-brief`,
    type: "doc",
    is_compulsory: true,
  },
  {
    week_number: 6,
    order: 2,
    title: "Group Formation Instructions",
    url: `${PLACEHOLDER_BASE}/w6-group-instructions`,
    type: "doc",
    is_compulsory: true,
  },
  {
    week_number: 6,
    order: 3,
    title: "Kick-off Video",
    url: `${PLACEHOLDER_BASE}/w6-kickoff-video`,
    type: "video",
    is_compulsory: false,
  },

  // Week 7 — Capstone Deep Dive
  {
    week_number: 7,
    order: 1,
    title: "Project Planning Template",
    url: `${PLACEHOLDER_BASE}/w7-planning-template`,
    type: "doc",
    is_compulsory: true,
  },
  {
    week_number: 7,
    order: 2,
    title: "Mid-point Check-in Form",
    url: `${PLACEHOLDER_BASE}/w7-checkin-form`,
    type: "form",
    is_compulsory: true,
  },
  {
    week_number: 7,
    order: 3,
    title: "Debugging AI Outputs — Video Tips",
    url: `${PLACEHOLDER_BASE}/w7-debug-video`,
    type: "video",
    is_compulsory: false,
  },

  // Week 8 — Showcase
  {
    week_number: 8,
    order: 1,
    title: "Presentation Guide",
    url: `${PLACEHOLDER_BASE}/w8-presentation-guide`,
    type: "doc",
    is_compulsory: true,
  },
  {
    week_number: 8,
    order: 2,
    title: "Showcase Submission Form",
    url: `${PLACEHOLDER_BASE}/w8-submission-form`,
    type: "form",
    is_compulsory: true,
  },
  {
    week_number: 8,
    order: 3,
    title: "Retrospective Template",
    url: `${PLACEHOLDER_BASE}/w8-retro-template`,
    type: "slides",
    is_compulsory: false,
  },
];

async function seedAdmins() {
  for (const email of ADMIN_EMAILS) {
    const { data, error } = await supabase
      .from("users")
      .update({ role: "admin" })
      .eq("email", email)
      .select("id, email")
      .single();

    if (error) {
      console.warn(`Skipped ${email} (may not have signed in yet): ${error.message}`);
      continue;
    }

    await supabase.auth.admin.updateUserById(data.id, {
      app_metadata: { role: "admin" },
    });

    console.log(`Set admin role for ${email}`);
  }
}

async function seedModulesAndMaterials() {
  for (const mod of MODULES) {
    const { data: existing } = await supabase
      .from("modules")
      .select("id")
      .eq("week_number", mod.week_number)
      .eq("order", mod.order)
      .maybeSingle();

    let moduleId: string;

    if (existing) {
      const { data, error } = await supabase
        .from("modules")
        .update({
          title: mod.title,
          description: mod.description,
          required_for_track: mod.required_for_track,
        })
        .eq("id", existing.id)
        .select("id")
        .single();

      if (error)
        throw new Error(`Failed to update module week ${mod.week_number}: ${error.message}`);
      moduleId = data.id;
      console.log(`Updated module: Week ${mod.week_number} — ${mod.title}`);
    } else {
      const { data, error } = await supabase.from("modules").insert(mod).select("id").single();

      if (error)
        throw new Error(`Failed to insert module week ${mod.week_number}: ${error.message}`);
      moduleId = data.id;
      console.log(`Inserted module: Week ${mod.week_number} — ${mod.title}`);
    }

    const weekMaterials = MATERIALS.filter((m) => m.week_number === mod.week_number);

    for (const mat of weekMaterials) {
      const { week_number: _, ...matWithoutWeek } = mat;

      const { data: existingMat } = await supabase
        .from("materials")
        .select("id")
        .eq("module_id", moduleId)
        .eq("order", mat.order)
        .maybeSingle();

      if (existingMat) {
        const { error } = await supabase
          .from("materials")
          .update({ ...matWithoutWeek, module_id: moduleId })
          .eq("id", existingMat.id);

        if (error) throw new Error(`Failed to update material: ${error.message}`);
      } else {
        const { error } = await supabase
          .from("materials")
          .insert({ ...matWithoutWeek, module_id: moduleId });

        if (error) throw new Error(`Failed to insert material: ${error.message}`);
      }
    }

    console.log(`  → ${weekMaterials.length} materials seeded for Week ${mod.week_number}`);
  }
}

async function seed() {
  console.log("=== Seeding admins ===");
  await seedAdmins();

  console.log("\n=== Seeding modules + materials ===");
  await seedModulesAndMaterials();

  console.log("\nSeed complete.");
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
