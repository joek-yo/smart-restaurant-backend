// src/modules/notifications/listeners/business-events.listener.ts

import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { EVENTS } from '@core/events';

@Injectable()
export class BusinessEventsListener {
  
  /**
   * Reacts when a new business/restaurant is registered.
   * Perfect for triggering the onboarding sequence.
   */
  @OnEvent(EVENTS.BUSINESS_CREATED)
  handleBusinessCreated(payload: { 
    businessId: string; 
    name: string; 
    ownerEmail?: string;
    plan?: string;
  }) {
    const { businessId, name, ownerEmail } = payload;

    console.log(`🏢 [EVENT] business.created | ID: ${businessId} | Name: ${name}`);
    
    if (ownerEmail) {
      console.log(`✉️ Onboarding email queued for: ${ownerEmail}`);
    }

    // 🔥 TODO: Future Integrations
    // this.onboardingService.sendWelcomePackage(ownerEmail, name);
    // this.analytics.trackNewSignup(businessId, plan);
  }

  /**
   * Reacts to profile or settings updates.
   */
  @OnEvent(EVENTS.BUSINESS_UPDATED)
  handleBusinessUpdated(payload: { businessId: string; changes: string[] }) {
    console.log(`🔄 [EVENT] business.updated | ID: ${payload.businessId}`);
    console.log(`📝 Changes detected in: ${payload.changes.join(', ')}`);
  }
}