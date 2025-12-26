# Global Event Bus

企業級全局事件匯流排系統，基於 Angular v20、TypeScript、RxJS 和 Signals 實現。

## 概述

本系統實現了 GitHub 風格的事件驅動架構，提供：

- ✅ **聲明式事件處理**：使用 `@Subscribe` 裝飾器
- ✅ **響應式流**：基於 RxJS Observable
- ✅ **狀態管理**：使用 Angular Signals
- ✅ **自動重試**：支援指數退避策略
- ✅ **事件持久化**：內建事件儲存
- ✅ **類型安全**：完整的 TypeScript 支援

## 核心概念

### 1. Domain Events (領域事件)

事件是系統中已發生事情的不可變記錄。

```typescript
class IssueOpenedEvent extends DomainEvent {
  readonly eventType = 'issues.opened' as const;
  readonly aggregateType = 'issue' as const;
  
  readonly payload: {
    issue: Issue;
    repository: Repository;
    sender: User;
  };
  
  constructor(data: { issue: Issue; repository: Repository; sender: User }) {
    super({
      aggregateId: data.issue.id,
      aggregateType: 'issue',
      metadata: {
        version: '1.0',
        source: 'issues-service'
      }
    });
    
    this.payload = data;
  }
}
```

### 2. Event Bus (事件匯流排)

負責發布和分發事件。

```typescript
@Injectable()
export class IssuesService {
  private readonly eventBus = inject(InMemoryEventBus);
  
  async createIssue(data: CreateIssueInput): Promise<Issue> {
    // 1. 執行業務邏輯
    const issue = await this.repository.save(data);
    
    // 2. 發布領域事件
    await this.eventBus.publish(
      new IssueOpenedEvent({
        issue,
        repository: data.repository,
        sender: data.creator
      })
    );
    
    return issue;
  }
}
```

### 3. Event Consumers (事件消費者)

監聽並處理特定事件。

```typescript
@Injectable()
export class NotificationConsumer extends EventConsumer {
  @Subscribe('issues.opened', {
    retryPolicy: {
      maxAttempts: 3,
      backoff: 'exponential',
      initialDelay: 1000
    }
  })
  async handleIssueOpened(event: IssueOpenedEvent): Promise<void> {
    // 處理事件：發送通知
    await this.notificationService.send({
      type: 'issue_opened',
      recipients: await this.getWatchers(event.payload.repository),
      data: event.payload
    });
  }
}
```

## 使用指南

完整文檔請參閱 [README.md](./README.md)

## 參考文件

- [GitHub 事件系統架構](../../docs/event-bus(Global%20Event%20Bus)-0.md)
- [事件驅動架構設計原則](../../docs/event-bus(Global%20Event%20Bus)-1.md)
- [Angular Signals 文檔](https://angular.dev/guide/signals)
- [RxJS 文檔](https://rxjs.dev/)

## 授權

MIT License
