#!/bin/bash
set -e
BACKUP_DIR="./_backup_$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"
echo "📦 Backing up originals to $BACKUP_DIR ..."
FILES=(
  "src/modules/conversation/domain/entities/conversation-context.entity.ts"
  "src/modules/sessions/application/use-cases/checkout.use-case.ts"
  "src/modules/sessions/application/services/session.service.ts"
  "src/modules/whatsapp/gateway/whatsapp.gateway.ts"
  "src/modules/whatsapp/handlers/process-order.ts"
  "src/modules/checkout/application/services/checkout-validation.service.ts"
  "src/modules/checkout/application/orchestrators/checkout-orchestrator.service.ts"
  "src/modules/checkout/checkout.module.ts"
  "src/app.module.ts"
)
for f in "${FILES[@]}"; do
  if [ -f "$f" ]; then
    mkdir -p "$BACKUP_DIR/$(dirname $f)"
    cp "$f" "$BACKUP_DIR/$f"
    echo "  backed up: $f"
  fi
done
echo ""
echo "✍️  Applying fixes ..."
cp fixes/conversation-context.entity.ts src/modules/conversation/domain/entities/conversation-context.entity.ts
cp fixes/checkout.use-case.ts src/modules/sessions/application/use-cases/checkout.use-case.ts
cp fixes/session.service.ts src/modules/sessions/application/services/session.service.ts
cp fixes/whatsapp.gateway.ts src/modules/whatsapp/gateway/whatsapp.gateway.ts
cp fixes/process-order.ts src/modules/whatsapp/handlers/process-order.ts
cp fixes/checkout-validation.service.ts src/modules/checkout/application/services/checkout-validation.service.ts
cp fixes/checkout-orchestrator.service.ts src/modules/checkout/application/orchestrators/checkout-orchestrator.service.ts
cp fixes/checkout.module.ts src/modules/checkout/checkout.module.ts
cp fixes/app.module.ts src/app.module.ts
echo ""
echo "✅ All fixes applied!"
echo "Next: npm run start:dev"
