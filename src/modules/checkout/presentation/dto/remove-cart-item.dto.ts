import { IsString, IsOptional } from 'class-validator';

export class RemoveCartItemDto {
  @IsString()
  userId!: string;

  @IsString()
  productId!: string;

  @IsString()
  @IsOptional()
  tenantId?: string;

  @IsString()
  @IsOptional()
  branchId?: string;
}
