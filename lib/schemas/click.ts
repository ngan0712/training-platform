import { z } from "zod";

export const ClickRowSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  material_id: z.string().uuid(),
  clicked_at: z.string(),
});

export const TrackClickSchema = z.object({
  material_id: z.string().uuid(),
});

export type ClickRow = z.infer<typeof ClickRowSchema>;
export type TrackClickInput = z.infer<typeof TrackClickSchema>;
