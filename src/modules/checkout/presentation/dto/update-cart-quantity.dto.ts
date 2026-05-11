import { IsString, IsNumber, IsOptional, Min } from 'class-validator';

export class UpdateCartQuantityDto {
  @IsString()
  userId!: string;

  @IsString()
  productId!: string;

  @IsNumber()
  @Min(1)
  quantity!: number;

  @IsString()
  @IsOptional()
  tenantId?: string;

  @IsString()
  @IsOptional()
  branchId?: string;
}
