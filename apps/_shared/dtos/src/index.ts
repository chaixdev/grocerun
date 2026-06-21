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
  note: z.string().optional(),
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

// Lists Domain
export const AddItemSchema = z.object({
  listId: z.string(),
  name: z.string().min(1),
  sectionId: z.string().nullable().optional(),
  quantity: z.number().min(0.1).default(1),
  unit: z.string().optional(),
});

export type AddItemDto = z.infer<typeof AddItemSchema>;

export const ToggleItemSchema = z.object({
  listItemId: z.string().min(1, "Item ID is required"),
  isChecked: z.boolean(),
  purchasedQuantity: z.number().optional(),
});

export type ToggleItemDto = z.infer<typeof ToggleItemSchema>;

export const UpdateQuantitySchema = z.object({
  listItemId: z.string().min(1, "Item ID is required"),
  quantity: z.number().min(0.1, "Quantity must be at least 0.1"),
  unit: z.string().optional(),
});

export type UpdateQuantityDto = z.infer<typeof UpdateQuantitySchema>;

export const RemoveItemSchema = z.object({
  listItemId: z.string().min(1, "Item ID is required"),
});

export type RemoveItemDto = z.infer<typeof RemoveItemSchema>;

export const ListIdSchema = z.object({
  listId: z.string().min(1, "List ID is required"),
});

export type ListIdDto = z.infer<typeof ListIdSchema>;

// Sections Domain
export const CreateSectionSchema = z.object({
  name: z.string().min(1, "Name is required"),
  storeId: z.string().min(1, "Store ID is required"),
  order: z.number().optional(),
});

export type CreateSectionDto = z.infer<typeof CreateSectionSchema>;

export const UpdateSectionSchema = z.object({
  id: z.string().min(1, "ID is required"),
  name: z.string().min(1, "Name is required"),
});

export type UpdateSectionDto = z.infer<typeof UpdateSectionSchema>;

export const DeleteSectionSchema = z.object({
  id: z.string().min(1, "ID is required"),
});

export type DeleteSectionDto = z.infer<typeof DeleteSectionSchema>;

export const ReorderSectionsSchema = z.object({
  storeId: z.string().min(1, "Store ID is required"),
  orderedIds: z.array(z.string().min(1)).min(1),
});

export type ReorderSectionsDto = z.infer<typeof ReorderSectionsSchema>;

// Stores Domain
export const CreateStoreSchema = z.object({
  name: z.string().min(1, "Name is required"),
  location: z.string().optional(),
  householdId: z.string().min(1, "Household ID is required"),
});

export type CreateStoreDto = z.infer<typeof CreateStoreSchema>;

export const UpdateStoreSchema = z.object({
  name: z.string().min(1, "Name is required"),
  location: z.string().optional(),
  imageUrl: z.string().optional(),
});

export type UpdateStoreDto = z.infer<typeof UpdateStoreSchema>;

// Households Domain
export const CreateHouseholdSchema = z.object({
  name: z.string().min(1, "Name is required"),
});

export type CreateHouseholdDto = z.infer<typeof CreateHouseholdSchema>;

export const UpdateHouseholdSchema = z.object({
  name: z.string().min(1, "Name is required"),
});

export type UpdateHouseholdDto = z.infer<typeof UpdateHouseholdSchema>;

export const RemoveMemberParamsSchema = z.object({
  id: z.string().min(1, "Household ID is required"),
  memberUserId: z.string().min(1, "Member user ID is required"),
});
export type RemoveMemberParamsDto = z.infer<typeof RemoveMemberParamsSchema>;

// Invitations Domain
export const CreateInvitationSchema = z.object({
  householdId: z.string().min(1, "Household ID is required"),
});

export type CreateInvitationDto = z.infer<typeof CreateInvitationSchema>;

export const JoinHouseholdSchema = z.object({
  token: z.string().min(1, "Token is required"),
});

export type JoinHouseholdDto = z.infer<typeof JoinHouseholdSchema>;

export const RevokeInvitationSchema = z.object({
  invitationId: z.string().min(1, "Invitation ID is required"),
});

export type RevokeInvitationDto = z.infer<typeof RevokeInvitationSchema>;

// Users Domain
export const UpdateProfileSchema = z.object({
  name: z.string().min(1, "Name is required"),
  image: z.string().optional(),
});

export type UpdateProfileDto = z.infer<typeof UpdateProfileSchema>;
