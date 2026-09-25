import { z } from "zod";

export const technologySelectionSchema = z.object({
  selected: z.boolean(),
});

export type TechnologySelectionInput = z.infer<
  typeof technologySelectionSchema
>;