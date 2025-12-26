│  AGENTS.md
│  index.html
│  main.ts
│  style-icons-auto.ts
│  style-icons.ts
│  styles.less
│  typings.d.ts
│
├─app
│  │  AGENTS.md
│  │  app.component.ts
│  │  app.config.ts
│  │
│  ├─core
│  │  │  AGENTS.md
│  │  │  index.ts
│  │  │  README.md
│  │  │  start-page.guard.ts
│  │  │
│  │  ├─blueprint
│  │  │  │  AGENTS.md
│  │  │  │  index.ts
│  │  │  │
│  │  │  ├─config
│  │  │  │      blueprint-config.interface.ts
│  │  │  │      index.ts
│  │  │  │
│  │  │  ├─container
│  │  │  │      blueprint-container.interface.ts
│  │  │  │      blueprint-container.spec.ts
│  │  │  │      blueprint-container.ts
│  │  │  │      index.ts
│  │  │  │      lifecycle-manager.interface.ts
│  │  │  │      lifecycle-manager.spec.ts
│  │  │  │      lifecycle-manager.ts
│  │  │  │      module-registry.interface.ts
│  │  │  │      module-registry.spec.ts
│  │  │  │      module-registry.ts
│  │  │  │      resource-provider.interface.ts
│  │  │  │      resource-provider.spec.ts
│  │  │  │      resource-provider.ts
│  │  │  │
│  │  │  ├─context
│  │  │  │      execution-context.interface.ts
│  │  │  │      index.ts
│  │  │  │      shared-context.spec.ts
│  │  │  │      shared-context.ts
│  │  │  │      tenant-info.interface.ts
│  │  │  │
│  │  │  ├─events
│  │  │  │  │  enhanced-event-bus.service.spec.ts
│  │  │  │  │  enhanced-event-bus.service.ts
│  │  │  │  │  event-bus.interface.ts
│  │  │  │  │  event-bus.spec.ts
│  │  │  │  │  event-bus.ts
│  │  │  │  │  event-types.ts
│  │  │  │  │  index.ts
│  │  │  │  │
│  │  │  │  ├─models
│  │  │  │  │      blueprint-event.model.ts
│  │  │  │  │      event-log-entry.model.ts
│  │  │  │  │      event-priority.enum.ts
│  │  │  │  │      index.ts
│  │  │  │  │
│  │  │  │  └─types
│  │  │  │          index.ts
│  │  │  │          system-event-type.enum.ts
│  │  │  │
│  │  │  ├─integration
│  │  │  │      container-lifecycle.integration.spec.ts
│  │  │  │      event-bus.integration.spec.ts
│  │  │  │      module-communication.integration.spec.ts
│  │  │  │
│  │  │  ├─models
│  │  │  │      index.ts
│  │  │  │      module-connection.interface.ts
│  │  │  │
│  │  │  ├─modules
│  │  │  │  │  index.ts
│  │  │  │  │  module-status.enum.ts
│  │  │  │  │  module.interface.ts
│  │  │  │  │
│  │  │  │  └─implementations
│  │  │  │      │  index.ts
│  │  │  │      │
│  │  │  │      ├─acceptance
│  │  │  │      │  │  acceptance.module.ts
│  │  │  │      │  │  index.ts
│  │  │  │      │  │  module.metadata.ts
│  │  │  │      │  │  README.md
│  │  │  │      │  │
│  │  │  │      │  ├─models
│  │  │  │      │  │      acceptance.model.ts
│  │  │  │      │  │      index.ts
│  │  │  │      │  │
│  │  │  │      │  ├─repositories
│  │  │  │      │  │      acceptance.repository.ts
│  │  │  │      │  │
│  │  │  │      │  └─services
│  │  │  │      │          conclusion.service.ts
│  │  │  │      │          preliminary.service.ts
│  │  │  │      │          re-inspection.service.ts
│  │  │  │      │          request.service.ts
│  │  │  │      │          review.service.ts
│  │  │  │      │
│  │  │  │      ├─audit-logs
│  │  │  │      │  │  audit-logs.module.ts
│  │  │  │      │  │  index.ts
│  │  │  │      │  │  module.metadata.ts
│  │  │  │      │  │  README.md
│  │  │  │      │  │
│  │  │  │      │  ├─components
│  │  │  │      │  │      audit-logs.component.ts
│  │  │  │      │  │
│  │  │  │      │  ├─config
│  │  │  │      │  │      audit-logs.config.ts
│  │  │  │      │  │
│  │  │  │      │  ├─exports
│  │  │  │      │  │      audit-logs-api.exports.ts
│  │  │  │      │  │
│  │  │  │      │  ├─models
│  │  │  │      │  │      audit-log.model.ts
│  │  │  │      │  │      audit-log.types.ts
│  │  │  │      │  │
│  │  │  │      │  ├─repositories
│  │  │  │      │  │      audit-log.repository.ts
│  │  │  │      │  │
│  │  │  │      │  └─services
│  │  │  │      │          audit-logs.service.ts
│  │  │  │      │
│  │  │  │      ├─climate
│  │  │  │      │  │  climate.module.ts
│  │  │  │      │  │  index.ts
│  │  │  │      │  │  README.md
│  │  │  │      │  │
│  │  │  │      │  ├─config
│  │  │  │      │  │      climate.config.ts
│  │  │  │      │  │      cwb-api.constants.ts
│  │  │  │      │  │
│  │  │  │      │  ├─examples
│  │  │  │      │  │      usage-example.ts
│  │  │  │      │  │
│  │  │  │      │  ├─exports
│  │  │  │      │  │      climate-api.exports.ts
│  │  │  │      │  │
│  │  │  │      │  ├─models
│  │  │  │      │  │      cwb-api-response.model.ts
│  │  │  │      │  │      weather-forecast.model.ts
│  │  │  │      │  │
│  │  │  │      │  ├─repositories
│  │  │  │      │  │      climate.repository.ts
│  │  │  │      │  │
│  │  │  │      │  └─services
│  │  │  │      │          climate-cache.service.ts
│  │  │  │      │          cwb-weather.service.ts
│  │  │  │      │
│  │  │  │      ├─cloud
│  │  │  │      │  │  cloud.module.ts
│  │  │  │      │  │  index.ts
│  │  │  │      │  │  module.metadata.ts
│  │  │  │      │  │  README.md
│  │  │  │      │  │
│  │  │  │      │  ├─models
│  │  │  │      │  │      cloud.model.ts
│  │  │  │      │  │      index.ts
│  │  │  │      │  │
│  │  │  │      │  ├─repositories
│  │  │  │      │  │      cloud.repository.ts
│  │  │  │      │  │      cloud.repository.ts.mock-version
│  │  │  │      │  │      cloud.repository.ts.supabase-version
│  │  │  │      │  │      index.ts
│  │  │  │      │  │
│  │  │  │      │  └─services
│  │  │  │      │          cloud-storage.service.ts
│  │  │  │      │          index.ts
│  │  │  │      │
│  │  │  │      ├─communication
│  │  │  │      │  │  communication.module.ts
│  │  │  │      │  │  index.ts
│  │  │  │      │  │  module.metadata.ts
│  │  │  │      │  │  README.md
│  │  │  │      │  │
│  │  │  │      │  ├─models
│  │  │  │      │  │      communication.model.ts
│  │  │  │      │  │      index.ts
│  │  │  │      │  │
│  │  │  │      │  ├─repositories
│  │  │  │      │  │      communication.repository.ts
│  │  │  │      │  │
│  │  │  │      │  └─services
│  │  │  │      │          group-message.service.ts
│  │  │  │      │          push-notification.service.ts
│  │  │  │      │          system-notification.service.ts
│  │  │  │      │          task-reminder.service.ts
│  │  │  │      │
│  │  │  │      ├─finance
│  │  │  │      │  │  finance.integration.spec.ts
│  │  │  │      │  │  finance.module.ts
│  │  │  │      │  │  index.ts
│  │  │  │      │  │  module.metadata.ts
│  │  │  │      │  │  README.md
│  │  │  │      │  │
│  │  │  │      │  ├─components
│  │  │  │      │  │      budget-overview.component.ts
│  │  │  │      │  │      finance-dashboard.component.ts
│  │  │  │      │  │      index.ts
│  │  │  │      │  │      invoice-list.component.ts
│  │  │  │      │  │
│  │  │  │      │  ├─models
│  │  │  │      │  │      budget.model.ts
│  │  │  │      │  │      finance.model.ts
│  │  │  │      │  │      financial-summary.model.ts
│  │  │  │      │  │      index.ts
│  │  │  │      │  │      invoice-service.interface.ts
│  │  │  │      │  │      invoice-status-machine.ts
│  │  │  │      │  │      invoice.model.ts
│  │  │  │      │  │      ledger.model.ts
│  │  │  │      │  │
│  │  │  │      │  ├─repositories
│  │  │  │      │  │      budget.repository.ts
│  │  │  │      │  │      finance.repository.ts
│  │  │  │      │  │      ledger.repository.ts
│  │  │  │      │  │
│  │  │  │      │  └─services
│  │  │  │      │          budget.service.ts
│  │  │  │      │          cost-management.service.ts
│  │  │  │      │          financial-report.service.ts
│  │  │  │      │          invoice-approval.service.spec.ts
│  │  │  │      │          invoice-approval.service.ts
│  │  │  │      │          invoice-generation.service.ts
│  │  │  │      │          invoice.service.ts
│  │  │  │      │          ledger.service.ts
│  │  │  │      │          payment-approval.service.spec.ts
│  │  │  │      │          payment-approval.service.ts
│  │  │  │      │          payment-generation.service.spec.ts
│  │  │  │      │          payment-generation.service.ts
│  │  │  │      │          payment-status-tracking.service.spec.ts
│  │  │  │      │          payment-status-tracking.service.ts
│  │  │  │      │          payment.service.ts
│  │  │  │      │
│  │  │  │      ├─issue
│  │  │  │      │  │  index.ts
│  │  │  │      │  │  issue.module.ts
│  │  │  │      │  │  module.metadata.ts
│  │  │  │      │  │  README.md
│  │  │  │      │  │
│  │  │  │      │  ├─config
│  │  │  │      │  │      index.ts
│  │  │  │      │  │      issue.config.ts
│  │  │  │      │  │
│  │  │  │      │  ├─exports
│  │  │  │      │  │      index.ts
│  │  │  │      │  │      issue-api.exports.ts
│  │  │  │      │  │
│  │  │  │      │  ├─models
│  │  │  │      │  │      index.ts
│  │  │  │      │  │      issue.model.ts
│  │  │  │      │  │
│  │  │  │      │  ├─repositories
│  │  │  │      │  │      index.ts
│  │  │  │      │  │      issue.repository.ts
│  │  │  │      │  │
│  │  │  │      │  └─services
│  │  │  │      │          index.ts
│  │  │  │      │          issue-creation.service.spec.ts
│  │  │  │      │          issue-creation.service.ts
│  │  │  │      │          issue-event.service.ts
│  │  │  │      │          issue-lifecycle.service.spec.ts
│  │  │  │      │          issue-lifecycle.service.ts
│  │  │  │      │          issue-management.service.spec.ts
│  │  │  │      │          issue-management.service.ts
│  │  │  │      │          issue-resolution.service.ts
│  │  │  │      │          issue-verification.service.ts
│  │  │  │      │
│  │  │  │      ├─log
│  │  │  │      │  │  index.ts
│  │  │  │      │  │  log.module.ts
│  │  │  │      │  │  module.metadata.ts
│  │  │  │      │  │  README.md
│  │  │  │      │  │
│  │  │  │      │  ├─models
│  │  │  │      │  │      activity-log.model.ts
│  │  │  │      │  │
│  │  │  │      │  ├─repositories
│  │  │  │      │  │      log.repository.ts
│  │  │  │      │  │
│  │  │  │      │  └─services
│  │  │  │      │          activity-log.service.ts
│  │  │  │      │          attachment.service.ts
│  │  │  │      │          change-history.service.ts
│  │  │  │      │          comment.service.ts
│  │  │  │      │          system-event.service.ts
│  │  │  │      │
│  │  │  │      ├─material
│  │  │  │      │  │  index.ts
│  │  │  │      │  │  material.module.ts
│  │  │  │      │  │  module.metadata.ts
│  │  │  │      │  │  README.md
│  │  │  │      │  │
│  │  │  │      │  ├─models
│  │  │  │      │  │      index.ts
│  │  │  │      │  │      material.model.ts
│  │  │  │      │  │
│  │  │  │      │  ├─repositories
│  │  │  │      │  │      material.repository.ts
│  │  │  │      │  │
│  │  │  │      │  └─services
│  │  │  │      │          consumption.service.ts
│  │  │  │      │          equipment.service.ts
│  │  │  │      │          inventory.service.ts
│  │  │  │      │          material-issue.service.ts
│  │  │  │      │          material-management.service.ts
│  │  │  │      │
│  │  │  │      ├─qa
│  │  │  │      │  │  defect.integration.spec.ts
│  │  │  │      │  │  index.ts
│  │  │  │      │  │  module.metadata.ts
│  │  │  │      │  │  qa.module.ts
│  │  │  │      │  │  README.md
│  │  │  │      │  │
│  │  │  │      │  ├─config
│  │  │  │      │  │      index.ts
│  │  │  │      │  │      qa.config.ts
│  │  │  │      │  │
│  │  │  │      │  ├─exports
│  │  │  │      │  │      index.ts
│  │  │  │      │  │      qa-api.exports.ts
│  │  │  │      │  │
│  │  │  │      │  ├─models
│  │  │  │      │  │      index.ts
│  │  │  │      │  │      qa.model.ts
│  │  │  │      │  │
│  │  │  │      │  ├─repositories
│  │  │  │      │  │      qa.repository.ts
│  │  │  │      │  │
│  │  │  │      │  └─services
│  │  │  │      │          checklist.service.ts
│  │  │  │      │          defect-issue-integration.service.ts
│  │  │  │      │          defect-lifecycle.service.ts
│  │  │  │      │          defect-reinspection.service.ts
│  │  │  │      │          defect-resolution.service.ts
│  │  │  │      │          defect.service.ts
│  │  │  │      │          index.ts
│  │  │  │      │          inspection.service.ts
│  │  │  │      │          report.service.ts
│  │  │  │      │
│  │  │  │      ├─safety
│  │  │  │      │  │  index.ts
│  │  │  │      │  │  module.metadata.ts
│  │  │  │      │  │  README.md
│  │  │  │      │  │  safety.module.ts
│  │  │  │      │  │
│  │  │  │      │  ├─models
│  │  │  │      │  │      index.ts
│  │  │  │      │  │      safety-inspection.model.ts
│  │  │  │      │  │
│  │  │  │      │  ├─repositories
│  │  │  │      │  │      safety.repository.ts
│  │  │  │      │  │
│  │  │  │      │  └─services
│  │  │  │      │          incident-report.service.ts
│  │  │  │      │          risk-assessment.service.ts
│  │  │  │      │          safety-inspection.service.ts
│  │  │  │      │          safety-training.service.ts
│  │  │  │      │
│  │  │  │      ├─tasks
│  │  │  │      │  │  index.ts
│  │  │  │      │  │  module.metadata.ts
│  │  │  │      │  │  README.md
│  │  │  │      │  │  task-modal.component.ts
│  │  │  │      │  │  tasks.component.ts
│  │  │  │      │  │  tasks.module.spec.ts
│  │  │  │      │  │  tasks.module.ts
│  │  │  │      │  │  tasks.repository.ts
│  │  │  │      │  │  tasks.routes.ts
│  │  │  │      │  │  tasks.service.ts
│  │  │  │      │  │
│  │  │  │      │  ├─components
│  │  │  │      │  │  ├─task-assign-modal
│  │  │  │      │  │  │      task-assign-modal.component.ts
│  │  │  │      │  │  │
│  │  │  │      │  │  └─task-context-menu
│  │  │  │      │  │          task-context-menu.component.html
│  │  │  │      │  │          task-context-menu.component.less
│  │  │  │      │  │          task-context-menu.component.ts
│  │  │  │      │  │
│  │  │  │      │  ├─services
│  │  │  │      │  │      task-context-menu.service.ts
│  │  │  │      │  │
│  │  │  │      │  ├─types
│  │  │  │      │  │      index.ts
│  │  │  │      │  │      task-context-menu.types.ts
│  │  │  │      │  │
│  │  │  │      │  └─views
│  │  │  │      │          task-gantt-view.component.ts
│  │  │  │      │          task-kanban-view.component.ts
│  │  │  │      │          task-list-view.component.ts
│  │  │  │      │          task-timeline-view.component.ts
│  │  │  │      │          task-tree-view.component.ts
│  │  │  │      │
│  │  │  │      ├─warranty
│  │  │  │      │  │  index.ts
│  │  │  │      │  │  module.metadata.ts
│  │  │  │      │  │  README.md
│  │  │  │      │  │  warranty.integration.spec.ts
│  │  │  │      │  │  warranty.module.ts
│  │  │  │      │  │
│  │  │  │      │  ├─config
│  │  │  │      │  │      warranty.config.ts
│  │  │  │      │  │
│  │  │  │      │  ├─exports
│  │  │  │      │  │      warranty.api.ts
│  │  │  │      │  │
│  │  │  │      │  ├─models
│  │  │  │      │  │      index.ts
│  │  │  │      │  │      warranty-defect.model.ts
│  │  │  │      │  │      warranty-repair.model.ts
│  │  │  │      │  │      warranty-status-machine.ts
│  │  │  │      │  │      warranty.model.ts
│  │  │  │      │  │
│  │  │  │      │  ├─repositories
│  │  │  │      │  │      index.ts
│  │  │  │      │  │      warranty-defect.repository.ts
│  │  │  │      │  │      warranty-repair.repository.ts
│  │  │  │      │  │      warranty.repository.ts
│  │  │  │      │  │
│  │  │  │      │  └─services
│  │  │  │      │          index.ts
│  │  │  │      │          warranty-defect.service.ts
│  │  │  │      │          warranty-event-handlers.ts
│  │  │  │      │          warranty-period.service.ts
│  │  │  │      │          warranty-repair.service.ts
│  │  │  │      │
│  │  │  │      └─workflow
│  │  │  │          │  index.ts
│  │  │  │          │  module.metadata.ts
│  │  │  │          │  README.md
│  │  │  │          │  workflow.module.ts
│  │  │  │          │
│  │  │  │          ├─models
│  │  │  │          │      index.ts
│  │  │  │          │      workflow.model.ts
│  │  │  │          │
│  │  │  │          ├─repositories
│  │  │  │          │      workflow.repository.ts
│  │  │  │          │
│  │  │  │          └─services
│  │  │  │                  approval.service.ts
│  │  │  │                  automation.service.ts
│  │  │  │                  custom-workflow.service.ts
│  │  │  │                  state-machine.service.ts
│  │  │  │                  template.service.ts
│  │  │  │
│  │  │  ├─repositories
│  │  │  │      blueprint-member.repository.ts
│  │  │  │      blueprint-module.repository.ts
│  │  │  │      blueprint.repository.ts
│  │  │  │      index.ts
│  │  │  │
│  │  │  ├─services
│  │  │  │      blueprint-validation-schemas.ts
│  │  │  │      blueprint.service.ts
│  │  │  │      dependency-validator.service.ts
│  │  │  │      index.ts
│  │  │  │      validation.service.ts
│  │  │  │
│  │  │  └─workflow
│  │  │      │  index.ts
│  │  │      │  setc-workflow-orchestrator.interface.ts
│  │  │      │  setc-workflow-orchestrator.service.spec.ts
│  │  │      │  setc-workflow-orchestrator.service.ts
│  │  │      │
│  │  │      ├─handlers
│  │  │      │      acceptance-finalized.handler.ts
│  │  │      │      index.ts
│  │  │      │      log-created.handler.spec.ts
│  │  │      │      log-created.handler.ts
│  │  │      │      qc-failed.handler.ts
│  │  │      │      qc-passed.handler.ts
│  │  │      │      task-completed.handler.spec.ts
│  │  │      │      task-completed.handler.ts
│  │  │      │
│  │  │      └─models
│  │  │              index.ts
│  │  │              workflow-config.model.ts
│  │  │              workflow-context.model.ts
│  │  │              workflow-handler.model.ts
│  │  │
│  │  ├─data-access
│  │  │  │  index.ts
│  │  │  │  README.md
│  │  │  │
│  │  │  ├─ai
│  │  │  │      ai.repository.ts
│  │  │  │      ai.types.ts
│  │  │  │      index.ts
│  │  │  │
│  │  │  └─repositories
│  │  │      │  AGENTS.md
│  │  │      │  index.ts
│  │  │      │  log-firestore.repository.ts
│  │  │      │  task-firestore.repository.ts
│  │  │      │
│  │  │      ├─base
│  │  │      │      firestore-base.repository.ts
│  │  │      │
│  │  │      └─shared
│  │  │              account.repository.ts
│  │  │              fcm-token.repository.ts
│  │  │              friend.repository.ts
│  │  │              notification-preferences.repository.ts
│  │  │              notification.repository.ts
│  │  │              organization-invitation.repository.ts
│  │  │              organization-member.repository.ts
│  │  │              organization.repository.ts
│  │  │              partner-member.repository.ts
│  │  │              partner.repository.ts
│  │  │              team-member.repository.ts
│  │  │              team.repository.ts
│  │  │
│  │  ├─domain
│  │  │  │  index.ts
│  │  │  │  README.md
│  │  │  │
│  │  │  ├─models
│  │  │  │      AGENTS.md
│  │  │  │      blueprint-config.model.ts
│  │  │  │      blueprint-module.model.ts
│  │  │  │      blueprint.model.ts
│  │  │  │      friend.model.ts
│  │  │  │      index.ts
│  │  │  │      notification-preferences.model.ts
│  │  │  │      notification.model.ts
│  │  │  │
│  │  │  ├─types
│  │  │  │  │  account.types.ts
│  │  │  │  │  AGENTS.md
│  │  │  │  │  index.ts
│  │  │  │  │
│  │  │  │  ├─blueprint
│  │  │  │  │      blueprint-status.enum.ts
│  │  │  │  │      blueprint.types.ts
│  │  │  │  │      owner-type.enum.ts
│  │  │  │  │
│  │  │  │  ├─configuration
│  │  │  │  │      configuration.types.ts
│  │  │  │  │
│  │  │  │  ├─events
│  │  │  │  │      event-type.enum.ts
│  │  │  │  │      event.types.ts
│  │  │  │  │
│  │  │  │  ├─log
│  │  │  │  │      index.ts
│  │  │  │  │      log-task.types.ts
│  │  │  │  │      log.types.ts
│  │  │  │  │
│  │  │  │  ├─module
│  │  │  │  │      module-state.enum.ts
│  │  │  │  │      module.types.ts
│  │  │  │  │
│  │  │  │  ├─permission
│  │  │  │  │      permission-level.enum.ts
│  │  │  │  │      permission.types.ts
│  │  │  │  │      role.enum.ts
│  │  │  │  │
│  │  │  │  ├─quality-control
│  │  │  │  │      index.ts
│  │  │  │  │      quality-control.types.ts
│  │  │  │  │
│  │  │  │  ├─storage
│  │  │  │  │      index.ts
│  │  │  │  │      storage.types.ts
│  │  │  │  │
│  │  │  │  ├─task
│  │  │  │  │      index.ts
│  │  │  │  │      task-quantity.types.ts
│  │  │  │  │      task-view.types.ts
│  │  │  │  │      task.types.ts
│  │  │  │  │
│  │  │  │  └─workflow
│  │  │  │          index.ts
│  │  │  │          workflow.types.ts
│  │  │  │
│  │  │  └─utils
│  │  │          blueprint-validation.utils.ts
│  │  │          index.ts
│  │  │
│  │  ├─errors
│  │  │      AGENTS.md
│  │  │      blueprint-error.ts
│  │  │      index.ts
│  │  │      module-not-found-error.ts
│  │  │      permission-denied-error.ts
│  │  │      validation-error.ts
│  │  │
│  │  ├─facades
│  │  │  └─ai
│  │  │          ai.store.ts
│  │  │          index.ts
│  │  │
│  │  ├─i18n
│  │  │      i18n.service.ts
│  │  │
│  │  ├─infrastructure
│  │  │  │  index.ts
│  │  │  │
│  │  │  └─storage
│  │  │          firebase-storage.repository.ts
│  │  │          index.ts
│  │  │          storage.repository.ts
│  │  │
│  │  ├─net
│  │  │      AGENTS.md
│  │  │      default.interceptor.ts
│  │  │      helper.ts
│  │  │      index.ts
│  │  │      refresh-token.ts
│  │  │
│  │  ├─services
│  │  │  │  AGENTS.md
│  │  │  │  error-tracking.service.ts
│  │  │  │  firebase-analytics.service.ts
│  │  │  │  firebase-auth.service.ts
│  │  │  │  firebase.service.ts
│  │  │  │  friend.service.ts
│  │  │  │  notification-analytics.service.ts
│  │  │  │  performance-monitoring.service.ts
│  │  │  │  push-messaging.service.ts
│  │  │  │
│  │  │  ├─ai
│  │  │  │      ai.service.ts
│  │  │  │      index.ts
│  │  │  │
│  │  │  ├─layout
│  │  │  │      index.ts
│  │  │  │
│  │  │  └─logger
│  │  │          console-transport.ts
│  │  │          index.ts
│  │  │          log-transport.interface.ts
│  │  │          logger.service.spec.ts
│  │  │          logger.service.ts
│  │  │
│  │  ├─startup
│  │  │      startup.service.ts
│  │  │
│  │  ├─state
│  │  │  │  index.ts
│  │  │  │  README.md
│  │  │  │
│  │  │  └─stores
│  │  │          AGENTS.md
│  │  │          construction-log.store.ts
│  │  │          friend.store.ts
│  │  │          index.ts
│  │  │          log.store.ts
│  │  │          notification.store.ts
│  │  │          partner.store.ts
│  │  │          task.store.ts
│  │  │          team.store.ts
│  │  │
│  │  └─utils
│  │          task-hierarchy.util.ts
│  │
│  ├─layout
│  │  │  AGENTS.md
│  │  │  index.ts
│  │  │
│  │  ├─basic
│  │  │  │  basic.component.ts
│  │  │  │  README.md
│  │  │  │
│  │  │  └─widgets
│  │  │          clear-storage.component.ts
│  │  │          context-switcher.component.ts
│  │  │          fullscreen.component.ts
│  │  │          i18n.component.ts
│  │  │          icon.component.ts
│  │  │          notify.component.ts
│  │  │          rtl.component.ts
│  │  │          search.component.ts
│  │  │          task.component.ts
│  │  │          user.component.ts
│  │  │
│  │  ├─blank
│  │  │      blank.component.ts
│  │  │      README.md
│  │  │
│  │  └─passport
│  │          passport.component.less
│  │          passport.component.ts
│  │
│  ├─routes
│  │  │  AGENTS.md
│  │  │  routes.ts
│  │  │
│  │  ├─account
│  │  │      AGENTS.md
│  │  │
│  │  ├─ai-assistant
│  │  │      ai-assistant.component.ts
│  │  │
│  │  ├─blueprint
│  │  │  │  AGENTS.md
│  │  │  │  blueprint-designer.component.ts
│  │  │  │  blueprint-detail.component.ts
│  │  │  │  blueprint-list.component.ts
│  │  │  │  blueprint-modal.component.ts
│  │  │  │  routes.ts
│  │  │  │
│  │  │  ├─components
│  │  │  │      connection-layer.component.ts
│  │  │  │      index.ts
│  │  │  │      validation-alerts.component.ts
│  │  │  │
│  │  │  ├─container
│  │  │  │      container-dashboard.component.ts
│  │  │  │      event-bus-monitor.component.ts
│  │  │  │
│  │  │  └─modules
│  │  │      │  AGENTS.md
│  │  │      │  index.ts
│  │  │      │  log-module-view.component.ts
│  │  │      │  safety-module-view.component.ts
│  │  │      │  workflow-module-view.component.ts
│  │  │      │
│  │  │      ├─acceptance
│  │  │      │  │  acceptance-module-view.component.ts
│  │  │      │  │  index.ts
│  │  │      │  │  README.md
│  │  │      │  │  REFACTORING_SUMMARY.md
│  │  │      │  │
│  │  │      │  ├─features
│  │  │      │  │  ├─conclusion
│  │  │      │  │  │      acceptance-conclusion.component.ts
│  │  │      │  │  │      index.ts
│  │  │      │  │  │
│  │  │      │  │  ├─preliminary
│  │  │      │  │  │      acceptance-preliminary.component.ts
│  │  │      │  │  │      index.ts
│  │  │      │  │  │
│  │  │      │  │  ├─re-inspection
│  │  │      │  │  │      acceptance-re-inspection.component.ts
│  │  │      │  │  │      index.ts
│  │  │      │  │  │
│  │  │      │  │  ├─request
│  │  │      │  │  │  │  acceptance-request.component.ts
│  │  │      │  │  │  │  index.ts
│  │  │      │  │  │  │
│  │  │      │  │  │  └─components
│  │  │      │  │  │          index.ts
│  │  │      │  │  │          request-list.component.ts
│  │  │      │  │  │          request-statistics.component.ts
│  │  │      │  │  │
│  │  │      │  │  └─review
│  │  │      │  │          acceptance-review.component.ts
│  │  │      │  │          index.ts
│  │  │      │  │
│  │  │      │  └─shared
│  │  │      │      │  index.ts
│  │  │      │      │
│  │  │      │      └─components
│  │  │      │              acceptance-status-badge.component.ts
│  │  │      │              index.ts
│  │  │      │
│  │  │      ├─agreement
│  │  │      │      agreement-module-view.component.ts
│  │  │      │      agreement.model.ts
│  │  │      │      agreement.repository.ts
│  │  │      │      agreement.service.ts
│  │  │      │      index.ts
│  │  │      │
│  │  │      ├─cloud
│  │  │      │  │  cloud-module-view-refactored.component.ts
│  │  │      │  │  index.ts
│  │  │      │  │
│  │  │      │  ├─features
│  │  │      │  │  ├─file-details
│  │  │      │  │  │      file-details.component.ts
│  │  │      │  │  │      index.ts
│  │  │      │  │  │
│  │  │      │  │  ├─file-list
│  │  │      │  │  │      file-list.component.ts
│  │  │      │  │  │      index.ts
│  │  │      │  │  │
│  │  │      │  │  ├─folder-management
│  │  │      │  │  │  │  folder-tree.component.ts
│  │  │      │  │  │  │  index.ts
│  │  │      │  │  │  │
│  │  │      │  │  │  └─components
│  │  │      │  │  │          folder-name-input.component.ts
│  │  │      │  │  │
│  │  │      │  │  ├─statistics
│  │  │      │  │  │      cloud-statistics.component.ts
│  │  │      │  │  │      index.ts
│  │  │      │  │  │
│  │  │      │  │  └─upload
│  │  │      │  │          index.ts
│  │  │      │  │          upload-area.component.ts
│  │  │      │  │
│  │  │      │  └─shared
│  │  │      │      │  index.ts
│  │  │      │      │
│  │  │      │      └─utils
│  │  │      │              file-utils.ts
│  │  │      │
│  │  │      ├─contract
│  │  │      │  │  contract-module-view-refactored.component.ts
│  │  │      │  │  index.ts
│  │  │      │  │  README.old.md
│  │  │      │  │
│  │  │      │  ├─application
│  │  │      │  │  │  index.ts
│  │  │      │  │  │
│  │  │      │  │  ├─services
│  │  │      │  │  │      contract-upload.service.ts
│  │  │      │  │  │      contract.service.ts
│  │  │      │  │  │      index.ts
│  │  │      │  │  │      README.md
│  │  │      │  │  │      work-item.service.ts
│  │  │      │  │  │
│  │  │      │  │  └─state
│  │  │      │  │          contract.store.ts
│  │  │      │  │          index.ts
│  │  │      │  │
│  │  │      │  ├─config
│  │  │      │  │      contract.config.ts
│  │  │      │  │      index.ts
│  │  │      │  │
│  │  │      │  ├─data
│  │  │      │  │  │  index.ts
│  │  │      │  │  │
│  │  │      │  │  ├─interfaces
│  │  │      │  │  │      contract-api.interface.ts
│  │  │      │  │  │      index.ts
│  │  │      │  │  │
│  │  │      │  │  └─models
│  │  │      │  │          contract.model.ts
│  │  │      │  │          dtos.ts
│  │  │      │  │          index.ts
│  │  │      │  │          parsed-contract-data.model.ts
│  │  │      │  │          work-item.model.ts
│  │  │      │  │
│  │  │      │  ├─infrastructure
│  │  │      │  │  │  index.ts
│  │  │      │  │  │
│  │  │      │  │  └─repositories
│  │  │      │  │          contract.repository.ts
│  │  │      │  │          index.ts
│  │  │      │  │          work-item.repository.ts
│  │  │      │  │
│  │  │      │  └─presentation
│  │  │      │      │  index.ts
│  │  │      │      │
│  │  │      │      ├─features
│  │  │      │      │  │  index.ts
│  │  │      │      │  │
│  │  │      │      │  ├─create
│  │  │      │      │  │  │  contract-creation-wizard.component.ts
│  │  │      │      │  │  │  index.ts
│  │  │      │      │  │  │
│  │  │      │      │  │  └─components
│  │  │      │      │  │          basic-info-step.component.ts
│  │  │      │      │  │          completion-step.component.ts
│  │  │      │      │  │          confirm-step.component.ts
│  │  │      │      │  │
│  │  │      │      │  ├─detail
│  │  │      │      │  │  │  contract-detail-drawer.component.ts
│  │  │      │      │  │  │  index.ts
│  │  │      │      │  │  │
│  │  │      │      │  │  └─components
│  │  │      │      │  │          attachments-tab.component.ts
│  │  │      │      │  │          basic-info-tab.component.ts
│  │  │      │      │  │          history-tab.component.ts
│  │  │      │      │  │          parties-tab.component.ts
│  │  │      │      │  │
│  │  │      │      │  ├─edit
│  │  │      │      │  │  │  contract-edit-modal.component.ts
│  │  │      │      │  │  │  index.ts
│  │  │      │      │  │  │
│  │  │      │      │  │  └─components
│  │  │      │      │  │          contract-form.component.ts
│  │  │      │      │  │          contractor-form.component.ts
│  │  │      │      │  │          owner-form.component.ts
│  │  │      │      │  │
│  │  │      │      │  ├─list
│  │  │      │      │  │  │  contract-list.component.ts
│  │  │      │      │  │  │  index.ts
│  │  │      │      │  │  │
│  │  │      │      │  │  └─components
│  │  │      │      │  │          contract-filters.component.ts
│  │  │      │      │  │          contract-statistics.component.ts
│  │  │      │      │  │          contract-table.component.ts
│  │  │      │      │  │
│  │  │      │      │  ├─preview
│  │  │      │      │  │      contract-parsing-modal.component.ts
│  │  │      │      │  │      contract-preview-modal.component.ts
│  │  │      │      │  │      index.ts
│  │  │      │      │  │
│  │  │      │      │  └─upload
│  │  │      │      │          contract-upload-step.component.ts
│  │  │      │      │          index.ts
│  │  │      │      │
│  │  │      │      └─shared
│  │  │      │          │  index.ts
│  │  │      │          │
│  │  │      │          └─components
│  │  │      │                  contract-status-badge.component.ts
│  │  │      │
│  │  │      ├─diary
│  │  │      │  │  diary-module-view.component.ts
│  │  │      │  │  index.ts
│  │  │      │  │  README.md
│  │  │      │  │
│  │  │      │  ├─features
│  │  │      │  │  ├─create
│  │  │      │  │  │      index.ts
│  │  │      │  │  │
│  │  │      │  │  ├─detail
│  │  │      │  │  │      index.ts
│  │  │      │  │  │
│  │  │      │  │  ├─edit
│  │  │      │  │  │  │  diary-edit-modal.component.ts
│  │  │      │  │  │  │  index.ts
│  │  │      │  │  │  │
│  │  │      │  │  │  └─components
│  │  │      │  │  │          diary-form.component.ts
│  │  │      │  │  │          diary-photo-upload.component.ts
│  │  │      │  │  │
│  │  │      │  │  └─list
│  │  │      │  │      │  diary-list.component.ts
│  │  │      │  │      │  index.ts
│  │  │      │  │      │
│  │  │      │  │      └─components
│  │  │      │  │              diary-filters.component.ts
│  │  │      │  │              diary-statistics.component.ts
│  │  │      │  │              diary-table.component.ts
│  │  │      │  │
│  │  │      │  └─shared
│  │  │      │      │  index.ts
│  │  │      │      │
│  │  │      │      └─components
│  │  │      │              diary-status-badge.component.ts
│  │  │      │
│  │  │      ├─finance
│  │  │      │  │  finance-module-view.component.html
│  │  │      │  │  finance-module-view.component.ts
│  │  │      │  │  index.ts
│  │  │      │  │  routes.ts
│  │  │      │  │
│  │  │      │  ├─features
│  │  │      │  │  ├─approval-dialog
│  │  │      │  │  │      approval-dialog.component.html
│  │  │      │  │  │      approval-dialog.component.ts
│  │  │      │  │  │      index.ts
│  │  │      │  │  │
│  │  │      │  │  ├─dashboard
│  │  │      │  │  │      finance-dashboard.component.html
│  │  │      │  │  │      finance-dashboard.component.ts
│  │  │      │  │  │      index.ts
│  │  │      │  │  │
│  │  │      │  │  └─invoice-list
│  │  │      │  │          index.ts
│  │  │      │  │          invoice-list.component.ts
│  │  │      │  │
│  │  │      │  └─shared
│  │  │      │          index.ts
│  │  │      │
│  │  │      ├─issues
│  │  │      │  │  index.ts
│  │  │      │  │  issues-module-view.component.ts
│  │  │      │  │
│  │  │      │  ├─features
│  │  │      │  │  ├─issue-details
│  │  │      │  │  │      index.ts
│  │  │      │  │  │      issue-details.component.ts
│  │  │      │  │  │
│  │  │      │  │  ├─issue-form
│  │  │      │  │  │      index.ts
│  │  │      │  │  │      issue-form.component.ts
│  │  │      │  │  │
│  │  │      │  │  ├─issue-list
│  │  │      │  │  │      index.ts
│  │  │      │  │  │      issue-list.component.ts
│  │  │      │  │  │
│  │  │      │  │  └─issue-statistics
│  │  │      │  │          index.ts
│  │  │      │  │          issue-statistics.component.ts
│  │  │      │  │
│  │  │      │  └─shared
│  │  │      │      │  index.ts
│  │  │      │      │
│  │  │      │      └─utils
│  │  │      │              issue-formatters.ts
│  │  │      │
│  │  │      ├─members
│  │  │      │  │  index.ts
│  │  │      │  │  members-module-view.component.ts
│  │  │      │  │  README.md
│  │  │      │  │
│  │  │      │  ├─features
│  │  │      │  │  ├─member-form
│  │  │      │  │  │      index.ts
│  │  │      │  │  │      member-form-modal.component.ts
│  │  │      │  │  │
│  │  │      │  │  └─member-list
│  │  │      │  │          index.ts
│  │  │      │  │          member-list.component.ts
│  │  │      │  │
│  │  │      │  └─shared
│  │  │      │          index.ts
│  │  │      │
│  │  │      ├─qa
│  │  │      │  │  index.ts
│  │  │      │  │  qa-module-view.component.ts
│  │  │      │  │  README.md
│  │  │      │  │  REFACTORING.md
│  │  │      │  │
│  │  │      │  └─features
│  │  │      │      ├─qa-inspections
│  │  │      │      │      index.ts
│  │  │      │      │      qa-inspections.component.ts
│  │  │      │      │
│  │  │      │      ├─qa-standards
│  │  │      │      │      index.ts
│  │  │      │      │      qa-standards.component.ts
│  │  │      │      │
│  │  │      │      └─qa-stats
│  │  │      │              index.ts
│  │  │      │              qa-stats.component.ts
│  │  │      │
│  │  │      ├─warranty
│  │  │      │  │  index.ts
│  │  │      │  │  README.md
│  │  │      │  │  routes.ts
│  │  │      │  │  warranty-module-view.component.ts
│  │  │      │  │
│  │  │      │  ├─features
│  │  │      │  │  ├─defects
│  │  │      │  │  │  │  index.ts
│  │  │      │  │  │  │  warranty-defects.component.ts
│  │  │      │  │  │  │
│  │  │      │  │  │  └─components
│  │  │      │  │  │          defect-filters.component.ts
│  │  │      │  │  │          defect-statistics.component.ts
│  │  │      │  │  │          defect-table.component.ts
│  │  │      │  │  │
│  │  │      │  │  ├─detail
│  │  │      │  │  │  │  index.ts
│  │  │      │  │  │  │  warranty-detail-drawer.component.ts
│  │  │      │  │  │  │
│  │  │      │  │  │  └─components
│  │  │      │  │  │          basic-info-tab.component.ts
│  │  │      │  │  │          defects-tab.component.ts
│  │  │      │  │  │          repairs-tab.component.ts
│  │  │      │  │  │
│  │  │      │  │  └─list
│  │  │      │  │      │  index.ts
│  │  │      │  │      │  warranty-list.component.ts
│  │  │      │  │      │
│  │  │      │  │      └─components
│  │  │      │  │              warranty-filters.component.ts
│  │  │      │  │              warranty-statistics.component.ts
│  │  │      │  │              warranty-table.component.ts
│  │  │      │  │
│  │  │      │  └─shared
│  │  │      │      │  index.ts
│  │  │      │      │
│  │  │      │      └─components
│  │  │      │              warranty-status-badge.component.ts
│  │  │      │
│  │  │      └─weather
│  │  │          │  index.ts
│  │  │          │  README.md
│  │  │          │  weather-module-view.component.ts
│  │  │          │
│  │  │          ├─components
│  │  │          │      weather-card.component.ts
│  │  │          │
│  │  │          ├─services
│  │  │          │      weather.service.ts
│  │  │          │
│  │  │          └─types
│  │  │                  weather.types.ts
│  │  │
│  │  ├─dashboard
│  │  │      AGENTS.md
│  │  │
│  │  ├─exception
│  │  │      AGENTS.md
│  │  │      exception.component.ts
│  │  │      routes.ts
│  │  │      trigger.component.ts
│  │  │
│  │  ├─explore
│  │  │  │  explore-page.component.ts
│  │  │  │  routes.ts
│  │  │  │
│  │  │  ├─components
│  │  │  │      filter-panel.component.ts
│  │  │  │      index.ts
│  │  │  │      result-grid.component.ts
│  │  │  │      search-bar.component.ts
│  │  │  │
│  │  │  ├─models
│  │  │  │      index.ts
│  │  │  │      search-result.model.ts
│  │  │  │
│  │  │  └─services
│  │  │          explore-search.facade.ts
│  │  │          index.ts
│  │  │          search-cache.service.spec.ts
│  │  │          search-cache.service.ts
│  │  │
│  │  ├─module-manager
│  │  │  │  index.ts
│  │  │  │  module-manager.component.ts
│  │  │  │  module-manager.routes.ts
│  │  │  │  module-manager.service.ts
│  │  │  │
│  │  │  └─components
│  │  │          module-card.component.ts
│  │  │          module-config-form.component.ts
│  │  │          module-dependency-graph.component.ts
│  │  │          module-status-badge.component.ts
│  │  │
│  │  ├─monitoring
│  │  │      monitoring-dashboard.component.ts
│  │  │      routes.ts
│  │  │
│  │  ├─organization
│  │  │  │  AGENTS.md
│  │  │  │  routes.ts
│  │  │  │
│  │  │  ├─members
│  │  │  │      organization-members.component.ts
│  │  │  │
│  │  │  ├─partners
│  │  │  │      create-partner-modal.component.ts
│  │  │  │      edit-partner-modal.component.ts
│  │  │  │      organization-partners.component.ts
│  │  │  │
│  │  │  ├─repository
│  │  │  │      organization-repository.component.ts
│  │  │  │
│  │  │  ├─schedule
│  │  │  │      organization-schedule.component.ts
│  │  │  │
│  │  │  ├─settings
│  │  │  │      organization-settings.component.ts
│  │  │  │
│  │  │  └─teams
│  │  │          organization-teams.component.ts
│  │  │          team-modal.component.ts
│  │  │
│  │  ├─partner
│  │  │  │  routes.ts
│  │  │  │
│  │  │  ├─members
│  │  │  │      partner-member-modal.component.ts
│  │  │  │      partner-members.component.ts
│  │  │  │
│  │  │  ├─schedule
│  │  │  │      partner-schedule.component.ts
│  │  │  │
│  │  │  └─settings
│  │  │          partner-settings.component.ts
│  │  │
│  │  ├─passport
│  │  │  │  AGENTS.md
│  │  │  │  callback.component.ts
│  │  │  │  routes.ts
│  │  │  │
│  │  │  ├─lock
│  │  │  │      lock.component.html
│  │  │  │      lock.component.less
│  │  │  │      lock.component.ts
│  │  │  │
│  │  │  ├─login
│  │  │  │      login.component.html
│  │  │  │      login.component.less
│  │  │  │      login.component.ts
│  │  │  │
│  │  │  ├─register
│  │  │  │      register.component.html
│  │  │  │      register.component.less
│  │  │  │      register.component.ts
│  │  │  │
│  │  │  └─register-result
│  │  │          register-result.component.html
│  │  │          register-result.component.ts
│  │  │
│  │  ├─settings
│  │  │  └─notification-settings
│  │  │          notification-settings.component.ts
│  │  │
│  │  ├─social
│  │  │  │  AGENTS.md
│  │  │  │
│  │  │  ├─components
│  │  │  │      friend-card.component.ts
│  │  │  │
│  │  │  ├─pages
│  │  │  │      friends.page.ts
│  │  │  │
│  │  │  └─routes
│  │  │          friends.routes.ts
│  │  │
│  │  ├─team
│  │  │  │  AGENTS.md
│  │  │  │  routes.ts
│  │  │  │
│  │  │  ├─members
│  │  │  │      team-member-modal.component.ts
│  │  │  │      team-members.component.ts
│  │  │  │
│  │  │  ├─schedule
│  │  │  │      team-schedule.component.ts
│  │  │  │
│  │  │  └─settings
│  │  │          team-settings.component.ts
│  │  │
│  │  ├─tenant
│  │  │      AGENTS.md
│  │  │
│  │  └─user
│  │      │  AGENTS.md
│  │      │  routes.ts
│  │      │
│  │      ├─settings
│  │      │      settings.component.ts
│  │      │
│  │      └─todo
│  │              user-todo.component.ts
│  │
│  └─shared
│      │  AGENTS.md
│      │  index.ts
│      │  README.md
│      │  shared-delon.module.ts
│      │  shared-imports.ts
│      │  shared-zorro.module.ts
│      │
│      ├─cell-widget
│      │      index.ts
│      │
│      ├─components
│      │  ├─breadcrumb
│      │  │      breadcrumb.component.ts
│      │  │
│      │  ├─create-organization
│      │  │      create-organization.component.ts
│      │  │
│      │  ├─create-team-modal
│      │  │      create-team-modal.component.ts
│      │  │
│      │  ├─edit-team-modal
│      │  │      edit-team-modal.component.ts
│      │  │
│      │  ├─team-detail-drawer
│      │  │      team-detail-drawer.component.html
│      │  │      team-detail-drawer.component.ts
│      │  │
│      │  └─types
│      │          firebase-functions.types.ts
│      │
│      ├─json-schema
│      │  │  index.ts
│      │  │  README.md
│      │  │
│      │  └─test
│      │          test.widget.ts
│      │
│      ├─services
│      │  │  AGENTS.md
│      │  │  breadcrumb.service.ts
│      │  │  index.ts
│      │  │  menu-management.service.ts
│      │  │  workspace-context.service.ts
│      │  │
│      │  └─permission
│      │          permission.service.ts
│      │
│      ├─st-widget
│      │      index.ts
│      │      README.md
│      │
│      └─utils
│              async-state.ts
│              index.ts
│
├─assets
│  │  color.less
│  │  logo-color.svg
│  │  logo-full.svg
│  │  logo.svg
│  │  style.compact.css
│  │  style.dark.css
│  │  zorro.svg
│  │
│  └─tmp
│      │  app-data.json
│      │  demo.docx
│      │  demo.pdf
│      │  demo.pptx
│      │  demo.xlsx
│      │  demo.zip
│      │  on-boarding.json
│      │
│      ├─i18n
│      │      en-US.json
│      │      zh-CN.json
│      │      zh-TW.json
│      │
│      └─img
│              avatar.jpg
│
├─environments
│      AGENTS.md
│      environment.prod.ts
│      environment.ts
│
├─styles
│      AGENTS.md
│      index.less
│      theme.less
│
└─test
        firebase-emulator.setup.ts
        README.md
        test-data.factory.ts