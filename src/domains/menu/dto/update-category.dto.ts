// src/domains/menu/dto/update-category.dto.ts
import { PartialType } from '@nestjs/mapped-types';
import { CreateCategoryDto } from './create-category.dto';

/**
 * UpdateCategoryDto
 * Extends CreateCategoryDto with all fields optional for updates.
 */
export class UpdateCategoryDto extends PartialType(CreateCategoryDto) {}