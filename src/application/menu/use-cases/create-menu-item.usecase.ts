// 📁 Path: src/application/menu/use-cases/create-menu-item.usecase.ts

import { Injectable, Inject } from '@nestjs/common';
import { CreateMenuItemDto } from './dto/create-menu-item.dto';
import { MenuItem } from '../../../domains/menu/entities/menu-item.entity';
import { MenuOption } from '../../../domains/menu/entities/menu-option.entity';
import { MenuItemRepository } from '../../../domains/menu/repositories/menu-item.repository';
import { EventBus } from '../../../common/events/event-bus';
import { MenuItemCreatedEvent } from '../../../domains/menu/events/menu-item-created.event';
import { MenuItemStatus } from '../../../domains/menu/enums/menu-item-status.enum';

@Injectable()
export class CreateMenuItemUseCase {
  constructor(
    @Inject('MenuItemRepository') // ✅ keep DI token (important for Nest wiring)
    private readonly menuItemRepository: MenuItemRepository,
    private readonly eventBus: EventBus,
  ) {}

  /**
   * Executes the creation of a new MenuItem
   */
  async execute(dto: CreateMenuItemDto): Promise<MenuItem> {
    // ✅ Map DTO options to domain entities
    const options: MenuOption[] = (dto.options ?? []).map(opt => new MenuOption({
      name: opt.name,
      price: opt.price,
      required: opt.required ?? false, // default if not provided
      createdAt: new Date(),
      updatedAt: new Date(),
      touch: () => {}, // placeholder if required by domain
    }));

    // ✅ Create domain entity (clean + controlled)
    const menuItem = new MenuItem({
      name: dto.name,
      description: dto.description,
      price: dto.price,
      categoryId: dto.categoryId,
      options,
      status: dto.status ?? MenuItemStatus.ACTIVE, // use correct enum value
    });

    // ✅ Persist
    const createdMenuItem = await this.menuItemRepository.create(menuItem);

    // ✅ Publish event (CRITICAL)
    this.eventBus.publish(new MenuItemCreatedEvent(createdMenuItem));

    return createdMenuItem;
  }
}