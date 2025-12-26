# Global Event Bus - Level 6: 分散式事件系統

> **演進階段**: 生產環境與高可用性  
> **狀態**: 📝 規劃中  
> **日期**: 2025-12-25

---

## 概述

將 Event Bus 從單機記憶體實作升級到分散式架構，支援高可用性、水平擴展和跨服務通訊。

---

## 分散式事件匯流排選擇

### 1. Kafka

**優勢**:
- 高吞吐量
- 事件持久化
- 分區支援
- 事件重放

**實作範例**:

```typescript
@Injectable({ providedIn: 'root' })
export class KafkaEventBus implements IEventBus {
  private kafka: Kafka;
  private producer: Producer;
  private consumers = new Map<string, Consumer>();
  
  constructor() {
    this.kafka = new Kafka({
      clientId: 'gighub-event-bus',
      brokers: ['kafka1:9092', 'kafka2:9092', 'kafka3:9092']
    });
    
    this.producer = this.kafka.producer();
  }
  
  async publish(event: DomainEvent): Promise<void> {
    await this.producer.send({
      topic: event.aggregateType,
      messages: [{
        key: event.aggregateId,
        value: JSON.stringify(event),
        headers: {
          'event-type': event.eventType,
          'event-id': event.eventId,
          'correlation-id': event.metadata.correlationId
        }
      }]
    });
  }
  
  observe<T extends DomainEvent>(eventType: string): Observable<T> {
    return new Observable(subscriber => {
      const consumer = this.kafka.consumer({
        groupId: `${eventType}-consumer`
      });
      
      consumer.connect()
        .then(() => consumer.subscribe({ topic: eventType }))
        .then(() => {
          consumer.run({
            eachMessage: async ({ message }) => {
              const event = JSON.parse(message.value.toString()) as T;
              subscriber.next(event);
            }
          });
        });
      
      this.consumers.set(eventType, consumer);
      
      return () => {
        consumer.disconnect();
        this.consumers.delete(eventType);
      };
    });
  }
}
```

### 2. RabbitMQ

**優勢**:
- 靈活的路由
- 訊息確認機制
- 死信佇列
- 延遲訊息

**實作範例**:

```typescript
@Injectable({ providedIn: 'root' })
export class RabbitMQEventBus implements IEventBus {
  private connection: amqp.Connection;
  private channel: amqp.Channel;
  
  async initialize(): Promise<void> {
    this.connection = await amqp.connect('amqp://localhost');
    this.channel = await this.connection.createChannel();
    
    // 聲明 exchange
    await this.channel.assertExchange('events', 'topic', {
      durable: true
    });
  }
  
  async publish(event: DomainEvent): Promise<void> {
    const routingKey = event.eventType;
    
    this.channel.publish(
      'events',
      routingKey,
      Buffer.from(JSON.stringify(event)),
      {
        persistent: true,
        headers: {
          'event-id': event.eventId,
          'correlation-id': event.metadata.correlationId
        }
      }
    );
  }
  
  observe<T extends DomainEvent>(eventType: string): Observable<T> {
    return new Observable(subscriber => {
      this.channel.assertQueue(`${eventType}-queue`, { durable: true })
        .then(queue => {
          this.channel.bindQueue(queue.queue, 'events', eventType);
          
          this.channel.consume(queue.queue, (msg) => {
            if (msg) {
              const event = JSON.parse(msg.content.toString()) as T;
              subscriber.next(event);
              this.channel.ack(msg);
            }
          });
        });
    });
  }
}
```

### 3. Redis Streams

**優勢**:
- 輕量級
- 低延遲
- 消費者群組
- 適合中小型應用

```typescript
@Injectable({ providedIn: 'root' })
export class RedisEventBus implements IEventBus {
  private redis: Redis;
  
  constructor() {
    this.redis = new Redis({
      host: 'localhost',
      port: 6379
    });
  }
  
  async publish(event: DomainEvent): Promise<void> {
    await this.redis.xadd(
      `events:${event.aggregateType}`,
      '*',
      'data', JSON.stringify(event)
    );
  }
  
  observe<T extends DomainEvent>(eventType: string): Observable<T> {
    return new Observable(subscriber => {
      const groupName = `${eventType}-group`;
      const consumerName = `consumer-${crypto.randomUUID()}`;
      
      // 創建消費者群組
      this.redis.xgroup(
        'CREATE',
        `events:${eventType}`,
        groupName,
        '0',
        'MKSTREAM'
      ).catch(() => {}); // 群組已存在時忽略錯誤
      
      // 輪詢讀取
      const poll = async () => {
        const messages = await this.redis.xreadgroup(
          'GROUP', groupName, consumerName,
          'BLOCK', 1000,
          'STREAMS', `events:${eventType}`, '>'
        );
        
        if (messages) {
          for (const [stream, streamMessages] of messages) {
            for (const [id, fields] of streamMessages) {
              const event = JSON.parse(fields[1]) as T;
              subscriber.next(event);
              
              // 確認消息
              await this.redis.xack(`events:${eventType}`, groupName, id);
            }
          }
        }
        
        poll(); // 繼續輪詢
      };
      
      poll();
    });
  }
}
```

---

## 分散式追蹤 (OpenTelemetry)

### 整合 OpenTelemetry

```typescript
import { trace, context, SpanStatusCode } from '@opentelemetry/api';

@Injectable({ providedIn: 'root' })
export class TracedEventBus implements IEventBus {
  private readonly innerBus = inject(InMemoryEventBus);
  private readonly tracer = trace.getTracer('event-bus');
  
  async publish(event: DomainEvent): Promise<void> {
    return this.tracer.startActiveSpan('event.publish', async (span) => {
      span.setAttributes({
        'event.type': event.eventType,
        'event.id': event.eventId,
        'aggregate.type': event.aggregateType,
        'aggregate.id': event.aggregateId
      });
      
      try {
        // 注入 trace context
        const ctx = context.active();
        event.metadata.traceContext = {
          traceId: span.spanContext().traceId,
          spanId: span.spanContext().spanId
        };
        
        await this.innerBus.publish(event);
        span.setStatus({ code: SpanStatusCode.OK });
      } catch (error) {
        span.recordException(error);
        span.setStatus({
          code: SpanStatusCode.ERROR,
          message: error.message
        });
        throw error;
      } finally {
        span.end();
      }
    });
  }
  
  observe<T extends DomainEvent>(eventType: string): Observable<T> {
    return this.innerBus.observe<T>(eventType).pipe(
      tap(event => {
        // 創建消費者 span
        const parentContext = event.metadata.traceContext;
        
        this.tracer.startActiveSpan(
          'event.consume',
          {
            links: parentContext ? [{
              context: {
                traceId: parentContext.traceId,
                spanId: parentContext.spanId,
                traceFlags: 1
              }
            }] : []
          },
          (span) => {
            span.setAttributes({
              'event.type': event.eventType,
              'event.id': event.eventId
            });
            span.end();
          }
        );
      })
    );
  }
}
```

---

## 跨服務事件通訊

### Microservices 架構

```
┌────────────────┐  events   ┌────────────────┐
│ Blueprint      │───────────>│   Kafka        │
│ Service        │            │   Event Bus    │
└────────────────┘            └────────────────┘
                                      │
                    ┌─────────────────┼─────────────────┐
                    │                 │                 │
                    ↓                 ↓                 ↓
            ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
            │ Task         │  │ Notification │  │ Analytics    │
            │ Service      │  │ Service      │  │ Service      │
            └──────────────┘  └──────────────┘  └──────────────┘
```

### 服務間事件契約

```typescript
// shared/events/blueprint.events.ts
export namespace BlueprintEvents {
  export class Created extends DomainEvent {
    readonly eventType = 'blueprint.created' as const;
    readonly payload: {
      blueprintId: string;
      name: string;
      ownerId: string;
      ownerType: 'user' | 'organization';
    };
  }
  
  export class Updated extends DomainEvent {
    readonly eventType = 'blueprint.updated' as const;
    readonly payload: {
      blueprintId: string;
      changes: Record<string, any>;
    };
  }
}

// task-service/consumers/blueprint.consumer.ts
@Injectable()
export class BlueprintConsumer extends EventConsumer {
  @Subscribe('blueprint.created')
  async onBlueprintCreated(event: BlueprintEvents.Created): Promise<void> {
    // Task Service 處理 Blueprint 創建事件
    await this.taskService.initializeBlueprintTasks(event.payload.blueprintId);
  }
}
```

---

## 事件串流處理

### Real-time Analytics

```typescript
@Injectable()
export class RealTimeAnalytics {
  private eventBus = inject(KafkaEventBus);
  
  // 統計每分鐘任務創建數
  taskCreationRate$ = this.eventBus.observe<TaskCreatedEvent>('task.created').pipe(
    bufferTime(60000), // 1 分鐘
    map(events => events.length),
    scan((acc, count) => ({
      current: count,
      average: (acc.total + count) / (acc.intervals + 1),
      total: acc.total + count,
      intervals: acc.intervals + 1
    }), { current: 0, average: 0, total: 0, intervals: 0 })
  );
  
  // 任務完成趨勢
  completionTrend$ = this.eventBus.observe<TaskCompletedEvent>('task.completed').pipe(
    bufferTime(3600000), // 1 小時
    map(events => ({
      hour: new Date().getHours(),
      count: events.length,
      averageDuration: events.reduce(
        (sum, e) => sum + (e.payload.completionTime.getTime() - e.payload.task.createdAt.getTime()),
        0
      ) / events.length
    }))
  );
}
```

---

## Saga 編排

### 分散式交易協調

```typescript
export class CreateProjectSaga {
  @Subscribe('blueprint.created')
  async onBlueprintCreated(event: BlueprintCreatedEvent): Promise<void> {
    const sagaId = crypto.randomUUID();
    
    try {
      // Step 1: 創建預設任務
      await this.taskService.createDefaultTasks(event.payload.blueprintId);
      
      // Step 2: 設定權限
      await this.permissionService.setupBlueprintPermissions(event.payload.blueprintId);
      
      // Step 3: 發送歡迎通知
      await this.notificationService.sendWelcome(event.payload.ownerId);
      
      // Saga 成功
      await this.eventBus.publish(
        new ProjectCreationCompletedEvent({ sagaId, blueprintId: event.payload.blueprintId })
      );
      
    } catch (error) {
      // Saga 失敗，開始補償
      await this.eventBus.publish(
        new ProjectCreationFailedEvent({ sagaId, blueprintId: event.payload.blueprintId, error })
      );
    }
  }
  
  @Subscribe('project.creation.failed')
  async onProjectCreationFailed(event: ProjectCreationFailedEvent): Promise<void> {
    // 補償動作
    await this.taskService.rollbackDefaultTasks(event.payload.blueprintId);
    await this.permissionService.rollbackPermissions(event.payload.blueprintId);
    await this.blueprintService.delete(event.payload.blueprintId);
  }
}
```

---

## 高可用性配置

### Kafka 高可用

```yaml
# docker-compose.yml
version: '3'
services:
  zookeeper:
    image: confluentinc/cp-zookeeper:latest
    environment:
      ZOOKEEPER_CLIENT_PORT: 2181
      ZOOKEEPER_TICK_TIME: 2000
  
  kafka1:
    image: confluentinc/cp-kafka:latest
    depends_on:
      - zookeeper
    environment:
      KAFKA_BROKER_ID: 1
      KAFKA_ZOOKEEPER_CONNECT: zookeeper:2181
      KAFKA_ADVERTISED_LISTENERS: PLAINTEXT://kafka1:9092
      KAFKA_OFFSETS_TOPIC_REPLICATION_FACTOR: 3
      KAFKA_MIN_INSYNC_REPLICAS: 2
  
  kafka2:
    image: confluentinc/cp-kafka:latest
    depends_on:
      - zookeeper
    environment:
      KAFKA_BROKER_ID: 2
      KAFKA_ZOOKEEPER_CONNECT: zookeeper:2181
      KAFKA_ADVERTISED_LISTENERS: PLAINTEXT://kafka2:9092
      KAFKA_OFFSETS_TOPIC_REPLICATION_FACTOR: 3
      KAFKA_MIN_INSYNC_REPLICAS: 2
  
  kafka3:
    image: confluentinc/cp-kafka:latest
    depends_on:
      - zookeeper
    environment:
      KAFKA_BROKER_ID: 3
      KAFKA_ZOOKEEPER_CONNECT: zookeeper:2181
      KAFKA_ADVERTISED_LISTENERS: PLAINTEXT://kafka3:9092
      KAFKA_OFFSETS_TOPIC_REPLICATION_FACTOR: 3
      KAFKA_MIN_INSYNC_REPLICAS: 2
```

---

## 效能優化

### 批次處理

```typescript
export class BatchEventPublisher {
  private queue: DomainEvent[] = [];
  private readonly batchSize = 100;
  private readonly flushInterval = 1000;
  
  constructor(private eventBus: KafkaEventBus) {
    setInterval(() => this.flush(), this.flushInterval);
  }
  
  enqueue(event: DomainEvent): void {
    this.queue.push(event);
    
    if (this.queue.length >= this.batchSize) {
      this.flush();
    }
  }
  
  private async flush(): Promise<void> {
    if (this.queue.length === 0) return;
    
    const batch = this.queue.splice(0, this.batchSize);
    await this.eventBus.publishBatch(batch);
  }
}
```

### 消費者群組水平擴展

```typescript
// 配置多個消費者實例
const consumerGroup = {
  groupId: 'task-notifications',
  instances: [
    { consumerId: 'consumer-1', partitions: [0, 1] },
    { consumerId: 'consumer-2', partitions: [2, 3] },
    { consumerId: 'consumer-3', partitions: [4, 5] }
  ]
};
```

---

## 監控與告警

### 關鍵指標

```typescript
export class EventBusMetrics {
  // 發布指標
  publishLatency = new Histogram('event_publish_latency_ms');
  publishErrors = new Counter('event_publish_errors_total');
  publishedEvents = new Counter('events_published_total', ['event_type']);
  
  // 消費指標
  consumeLatency = new Histogram('event_consume_latency_ms');
  consumeErrors = new Counter('event_consume_errors_total', ['event_type']);
  consumerLag = new Gauge('consumer_lag', ['consumer_group']);
  
  // 系統指標
  queueDepth = new Gauge('event_queue_depth');
  activeConsumers = new Gauge('active_consumers');
}
```

---

## 下一步（Level 7）

Level 7 將涵蓋：

1. **多區域部署**: 跨地域事件複製
2. **災難恢復**: 備份與還原策略
3. **效能調校**: 極致優化
4. **成本優化**: 資源使用優化
5. **合規性**: GDPR, SOC2 等

---

**文檔版本**: 6.0  
**最後更新**: 2025-12-25  
**維護者**: GigHub 開發團隊
