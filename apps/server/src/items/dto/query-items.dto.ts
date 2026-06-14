import { createZodDto } from 'nestjs-zod';
import { SearchItemsSchema, GetTopItemsSchema } from '@grocerun/dto';

export class SearchItemsDto extends createZodDto(SearchItemsSchema) {}
export class GetTopItemsDto extends createZodDto(GetTopItemsSchema) {}
