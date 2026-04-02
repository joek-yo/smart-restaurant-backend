// 📁 Path: src/interfaces/menu/menu.controller.ts

import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';

import { CreateMenuItemUseCase } from '../../application/menu/use-cases/create-menu-item.usecase';
import { UpdateMenuItemUseCase } from '../../application/menu/use-cases/update-menu-item.usecase';
import { GetMenuByCategoryUseCase } from '../../application/menu/use-cases/get-menu-by-category.usecase';
import { CreateMenuItemDto } from '../../application/menu/use-cases/dto/create-menu-item.dto';
import { UpdateMenuItemDto } from '../../application/menu/use-cases/dto/update-menu-item.dto';

@Controller('menu/items')
export class MenuController {
  constructor(
    private readonly createMenuItemUseCase: CreateMenuItemUseCase,
    private readonly updateMenuItemUseCase: UpdateMenuItemUseCase,
    private readonly getMenuByCategoryUseCase: GetMenuByCategoryUseCase,
  ) {}

  /** Create a new menu item */
  @Post()
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async create(@Body() dto: CreateMenuItemDto) {
    const menuItem = await this.createMenuItemUseCase.execute(dto);
    return { success: true, data: menuItem };
  }

  /** Update an existing menu item */
  @Patch(':id')
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async update(@Param('id') id: string, @Body() dto: UpdateMenuItemDto) {
    const updatedMenuItem = await this.updateMenuItemUseCase.execute(id, dto);
    return { success: true, data: updatedMenuItem };
  }

  /** Get menu items by category */
  @Get('category/:categoryId')
  async getByCategory(@Param('categoryId') categoryId: string) {
    const items = await this.getMenuByCategoryUseCase.execute(categoryId);
    return { success: true, data: items };
  }
}