import { z } from "zod";

export const CreateListSchema = z.object({
  storeId: z.string().min(1, "Store ID is required"),
  name: z.string().optional(),
});

export type CreateListDto = z.infer<typeof CreateListSchema>;

export const UpdateItemSchema = z.object({
  itemId: z.string().min(1, "Item ID is required"),
  name: z.string().min(1, "Name is required"),
  sectionId: z.string().optional(),
  defaultUnit: z.string().optional(),
});

export type UpdateItemDto = z.infer<typeof UpdateItemSchema>;

export const SearchItemsSchema = z.object({
  storeId: z.string().min(1, "Store ID is required"),
  query: z.string().min(1),
});

export type SearchItemsDto = z.infer<typeof SearchItemsSchema>;

export const GetTopItemsSchema = z.object({
  storeId: z.string().min(1, "Store ID is required"),
  limit: z.number().min(1).max(20).default(5),
  threshold: z.number().min(0).default(1),
});

export type GetTopItemsDto = z.infer<typeof GetTopItemsSchema>;
