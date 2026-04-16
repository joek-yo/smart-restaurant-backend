// 📁 Path: src/application/menu/use-cases/update-menu-item.usecase.ts

import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { UpdateMenuItemDto } from './dto/update-menu-item.dto';
import { MenuItemRepository } from '../../../domains/menu/repositories/menu-item.repository';
import { EventBus } from '../../../common/events/event-bus';
import { MenuItemUpdatedEvent } from '../../../domains/menu/events/menu-item-updated.event';
import { MenuItem } from '../../../domains/menu/entities/menu-item.entity';
import { MenuOption } from '../../../domains/menu/entities/menu-option.entity';

@Injectable()
export class UpdateMenuItemUseCase {
  constructor(
    @Inject('MenuItemRepository') // ✅ keep DI token
    private readonly menuItemRepository: MenuItemRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(id: string, dto: UpdateMenuItemDto): Promise<MenuItem> {
    // ✅ Fetch existing entity
    const existing = await this.menuItemRepository.findById(id);

    if (!existing) {
      throw new NotFoundException(`MenuItem with id ${id} not found`);
    }

    // ✅ Apply updates via DOMAIN METHODS (correct DDD)
    if (dto.name) existing.name = dto.name; // replaced updateName() with direct assignment or implement in domain
    if (dto.description) existing.description = dto.description; // replaced updateDescription()
    if (dto.price !== undefined) existing.price = dto.price;
    if (dto.status) existing.status = dto.status;

    if (dto.options) {
      // Map DTO to domain MenuOption entities
      const options: MenuOption[] = dto.options.map(opt => new MenuOption({
        name: opt.name,
        price: opt.price,
        required: opt.required ?? false,
        createdAt: new Date(),
        updatedAt: new Date(),
        touch: () => {},
      }));
      existing.options = options; // assign mapped domain options
    }

    // ✅ Persist
    const updated = await this.menuItemRepository.update(id, existing);

    // ✅ Publish event (CRITICAL)
    this.eventBus.publish(new MenuItemUpdatedEvent(updated));

    return updated;
  }
}