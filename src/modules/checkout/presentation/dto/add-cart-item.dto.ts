import { IsString, IsNumber, IsOptional, Min } from 'class-validator';

export class AddCartItemDto {
  @IsString()
  userId!: string;

  @IsString()
  productId!: string;

  @IsString()
  name!: string;

  @IsNumber()
  @Min(1)
  quantity!: number;

  @IsNumber()
  @Min(0)
  price!: number;

  @IsString()
  @IsOptional()
  tenantId?: string;

  @IsString()
  @IsOptional()
  branchId?: string;
}
