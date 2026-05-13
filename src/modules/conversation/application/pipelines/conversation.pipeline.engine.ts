// FILE: src/modules/conversation/application/pipelines/conversation.pipeline.engine.ts

import { Injectable, Logger } from '@nestjs/common';
import { MiddlewarePipeline, PipelineContext } from './middleware.pipeline';
import { ResolverRegistry } from '../resolvers/resolver.registry';
import { ActionRegistry } from '../actions/action.registry';
import { LoadContextUseCase } from '../use-cases/load-context.use-case';
import { PersistContextUseCase } from '../use-cases/persist-context.use-case';
import { EmitEventsUseCase } from '../use-cases/emit-events.use-case';
import { BuildResponseUseCase } from '../use-cases/build-response.use-case';
import { StateMachineService } from '../services/state-machine.service';
import { ConversationHistoryService } from '../services/conversation-history.service';
import { SemanticContextService } from '../services/semantic-context.service';

// Middlewares
import { telemetryMiddleware } from './middlewares/telemetry.middleware';
import { normalizeMessageMiddleware } from './middlewares/normalize-message.middleware';
import { tenantResolutionMiddleware } from './middlewares/tenant-resolution.middleware';
import { abuseDetectionMiddleware } from './middlewares/abuse-detection.middleware';
import { conversationLockMiddleware } from './middlewares/conversation-lock.middleware';
import { buildContextLoadingMiddleware } from './middlewares/context-loading.middleware';
import { buildIntentResolutionMiddleware } from './middlewares/intent-resolution.middleware';
import { buildActionExecutionMiddleware } from './middlewares/action-execution.middleware';
import { responseFormattingMiddleware } from './middlewares/response-formatting.middleware';
import { outboundDispatchMiddleware } from './middlewares/outbound-dispatch.middleware';
import { buildFlowExecutionMiddleware } from './middlewares/flow-execution.middleware';
import { FlowEngine } from '../flows/flow.engine';
import { ConversationMetrics } from '../../infrastructure/observability/conversation.metrics';
import { PipelineTracerService } from '../../infrastructure/observability/pipeline-tracer.service';
import { OrchestrationLoggerService } from '../../infrastructure/observability/orchestration-logger.service';
import { buildTelemetryMiddleware } from './middlewares/telemetry.middleware';

export interface PipelineInput {
  tenantId: string;
  userId: string;
  message: string;
  channel: string;
  messageId?: string;
  metadata?: Record<string, any>;
}

export interface PipelineResult {
  response: string;
  state: string;
  intent: string;
  events: string[];
  idempotent?: boolean;
}

@Injectable()
export class ConversationPipelineEngine {
  private readonly logger = new Logger(ConversationPipelineEngine.name);

  constructor(
    private readonly resolverRegistry: ResolverRegistry,
    private readonly actionRegistry: ActionRegistry,
    private readonly loadContext: LoadContextUseCase,
    private readonly persistContext: PersistContextUseCase,
    private readonly emitEvents: EmitEventsUseCase,
    private readonly buildResponse: BuildResponseUseCase,
    private readonly stateMachine: StateMachineService,
    private readonly history: ConversationHistoryService,
    private readonly semantic: SemanticContextService,
    private readonly flowEngine: FlowEngine,
    private readonly metrics: ConversationMetrics,
    private readonly tracer: PipelineTracerService,
    private readonly orchLogger: OrchestrationLoggerService,
  ) {}

  async process(input: PipelineInput): Promise<PipelineResult> {
    const pipeline = new MiddlewarePipeline();

    // ── CROSS-CUTTING (wrap entire pipeline) ──────────────
    pipeline.use(buildTelemetryMiddleware(this.metrics, this.tracer, this.orchLogger));

    // ── GUARD LAYER ───────────────────────────────────────
    pipeline.use(normalizeMessageMiddleware);
    pipeline.use(tenantResolutionMiddleware);
    pipeline.use(abuseDetectionMiddleware);
    pipeline.use(conversationLockMiddleware);

    // ── CONTEXT ───────────────────────────────────────────
    pipeline.use(buildContextLoadingMiddleware(this.loadContext, this.history, this.semantic));

    // ── INTENT ────────────────────────────────────────────
    pipeline.use(buildIntentResolutionMiddleware(this.resolverRegistry));

    // ── STATE TRANSITION ──────────────────────────────────
    pipeline.use(async (ctx, next) => {
      ctx.nextState = this.stateMachine.transition(ctx.context.state, ctx.intent);
      this.logger.debug(`[Pipeline] ${ctx.context.state} → ${ctx.nextState}`);
      await next();
    });

    // ── ACTION ────────────────────────────────────────────
    pipeline.use(buildActionExecutionMiddleware(this.actionRegistry));

    // ── STATE UPDATE ──────────────────────────────────────
    pipeline.use(async (ctx, next) => {
      ctx.context.updateState(ctx.nextState);
      await next();
    });

    // ── EVENTS ────────────────────────────────────────────
    pipeline.use(async (ctx, next) => {
      ctx.events = await this.emitEvents.execute({
        dto: input,
        intent: ctx.intent,
        transition: { nextState: ctx.nextState },
        context: ctx.context,
      });
      await next();
    });

    // ── RESPONSE BUILD ────────────────────────────────────
    pipeline.use(async (ctx, next) => {
      if (!ctx.output?.response) {
        ctx.response = this.buildResponse.execute({
          intent: ctx.intent,
          transition: { nextState: ctx.nextState },
          currentState: ctx.context.state,
        });
      }
      await next();
    });

    // ── RESPONSE FORMAT ───────────────────────────────────
    pipeline.use(responseFormattingMiddleware);

    // ── PERSIST ───────────────────────────────────────────
    pipeline.use(async (ctx, next) => {
      await this.persistContext.execute({
        context: ctx.context,
        transition: { nextState: ctx.nextState },
      });
      await next();
    });

    // ── OUTBOUND DISPATCH ─────────────────────────────────
    pipeline.use(outboundDispatchMiddleware);

    // ── RUN ───────────────────────────────────────────────
    const ctx: PipelineContext = { input };

    try {
      await pipeline.run(ctx);
    } catch (err: any) {
      this.logger.error(`[Pipeline] Error: ${err?.message ?? err}`);
      ctx.response = 'Sorry, something went wrong. Please try again.';
      ctx.events = [];
    }

    return {
      response: ctx.response ?? 'How can I help you?',
      state: ctx.context?.state ?? 'IDLE',
      intent: ctx.intent ?? 'UNKNOWN',
      events: ctx.events ?? [],
    };
  }
}
