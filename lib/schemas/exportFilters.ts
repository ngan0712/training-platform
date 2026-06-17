import { z } from "zod";

export const TrackFilterSchema = z.enum(["all", "tech", "non_tech"]).default("all");
export type TrackFilter = z.infer<typeof TrackFilterSchema>;
