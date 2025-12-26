# Global Event Bus - Level 7: 生產環境最佳化

> **演進階段**: 企業級生產部署  
> **狀態**: 📝 規劃中  
> **日期**: 2025-12-25

---

## 概述

本文檔涵蓋生產環境部署的最佳實踐，包含多區域部署、災難恢復、效能調校、成本優化和合規性要求。

---

## 多區域部署

### 1. 跨地域複製架構

```
┌──────────────────────────────────────────────────┐
│              Global Load Balancer                 │
└──────────────────────────────────────────────────┘
        │                                   │
        ↓                                   ↓
┌──────────────────┐              ┌──────────────────┐
│  Asia Region     │              │  US Region       │
│  ┌────────────┐  │              │  ┌────────────┐  │
│  │ Event Bus  │←─┼──replication─┼─→│ Event Bus  │  │
│  │  (Kafka)   │  │              │  │  (Kafka)   │  │
│  └────────────┘  │              │  └────────────┘  │
│  ┌────────────┐  │              │  ┌────────────┐  │
│  │Event Store │  │              │  │Event Store │  │
│  └────────────┘  │              │  └────────────┘  │
└──────────────────┘              └──────────────────┘
```

### 2. Kafka MirrorMaker 配置

```yaml
# mirror-maker.yml
clusters:
  asia:
    bootstrap.servers: kafka-asia-1:9092,kafka-asia-2:9092,kafka-asia-3:9092
  us:
    bootstrap.servers: kafka-us-1:9092,kafka-us-2:9092,kafka-us-3:9092

mirrors:
  - source: asia
    target: us
    topics:
      - task.*
      - blueprint.*
      - notification.*
    replication.factor: 3
    
  - source: us
    target: asia
    topics:
      - task.*
      - blueprint.*
      - notification.*
    replication.factor: 3
```

### 3. 區域感知路由

```typescript
@Injectable({ providedIn: 'root' })
export class RegionalEventBus implements IEventBus {
  private readonly regionService = inject(RegionService);
  private readonly asiaBus = inject(KafkaEventBusAsia);
  private readonly usBus = inject(KafkaEventBusUS);
  
  async publish(event: DomainEvent): Promise<void> {
    const region = await this.regionService.getCurrentRegion();
    
    const bus = region === 'asia' ? this.asiaBus : this.usBus;
    return bus.publish(event);
  }
  
  observe<T extends DomainEvent>(eventType: string): Observable<T> {
    // 從兩個區域合併事件流
    return merge(
      this.asiaBus.observe<T>(eventType),
      this.usBus.observe<T>(eventType)
    ).pipe(
      // 去重（避免重複處理相同事件）
      distinctUntilChanged((a, b) => a.eventId === b.eventId)
    );
  }
}
```

---

## 災難恢復 (DR)

### 1. 備份策略

#### 事件備份到 S3

```typescript
@Injectable()
export class EventBackupService {
  private readonly s3 = new S3Client({ region: 'us-west-2' });
  
  async backupEvents(date: Date): Promise<void> {
    const events = await this.eventStore.query({
      fromTimestamp: startOfDay(date),
      toTimestamp: endOfDay(date)
    });
    
    const backup = {
      date: date.toISOString(),
      eventCount: events.length,
      events: events
    };
    
    await this.s3.send(new PutObjectCommand({
      Bucket: 'gighub-event-backups',
      Key: `events/${date.toISOString().split('T')[0]}.json.gz`,
      Body: gzip(JSON.stringify(backup)),
      ServerSideEncryption: 'AES256'
    }));
  }
  
  async restoreEvents(date: Date): Promise<void> {
    const response = await this.s3.send(new GetObjectCommand({
      Bucket: 'gighub-event-backups',
      Key: `events/${date.toISOString().split('T')[0]}.json.gz`
    }));
    
    const backup = JSON.parse(ungzip(await response.Body.transformToByteArray()));
    
    for (const event of backup.events) {
      await this.eventStore.append(event);
    }
  }
}
```

### 2. 快照備份

```typescript
export class SnapshotBackupService {
  async createBackup(): Promise<void> {
    // 1. 暫停寫入
    await this.eventBus.pause();
    
    // 2. 創建所有 Aggregate 快照
    const aggregates = await this.getActiveAggregates();
    
    for (const aggregate of aggregates) {
      const snapshot = await this.createSnapshot(aggregate);
      await this.s3.uploadSnapshot(snapshot);
    }
    
    // 3. 恢復寫入
    await this.eventBus.resume();
  }
  
  async restoreFromBackup(backupId: string): Promise<void> {
    const snapshots = await this.s3.downloadSnapshots(backupId);
    
    for (const snapshot of snapshots) {
      await this.snapshotStore.save(snapshot);
    }
  }
}
```

### 3. 災難恢復計畫

```typescript
export class DisasterRecoveryPlan {
  async executeFailover(): Promise<void> {
    console.log('[DR] Initiating failover to secondary region...');
    
    // 1. 停止主區域流量
    await this.loadBalancer.removeRegion('primary');
    
    // 2. 提升次要區域為主
    await this.promoteSecondaryToPrimary();
    
    // 3. 重新路由流量
    await this.loadBalancer.addRegion('secondary-promoted', { priority: 1 });
    
    // 4. 驗證服務健康
    await this.healthCheck.verify();
    
    console.log('[DR] Failover completed successfully');
  }
  
  async executeFailback(): Promise<void> {
    // 災難恢復後恢復正常
    await this.restorePrimaryRegion();
    await this.loadBalancer.addRegion('primary', { priority: 1 });
    await this.loadBalancer.removeRegion('secondary-promoted');
  }
}
```

---

## 效能調校

### 1. Kafka 調優

```properties
# server.properties

# 增加分區數以提升並行度
num.partitions=12

# 調整複製因子（平衡可用性與效能）
default.replication.factor=3
min.insync.replicas=2

# 增加緩衝區大小
socket.send.buffer.bytes=1048576
socket.receive.buffer.bytes=1048576

# 批次處理優化
batch.size=16384
linger.ms=10

# 壓縮
compression.type=snappy

# 日誌保留
log.retention.hours=168
log.segment.bytes=1073741824

# 記憶體分配
heap.size=8G
```

### 2. 生產者優化

```typescript
export class OptimizedKafkaProducer {
  private producer: Producer;
  
  constructor() {
    this.producer = new Kafka({
      clientId: 'gighub',
      brokers: ['kafka1:9092', 'kafka2:9092', 'kafka3:9092']
    }).producer({
      // 批次處理
      batch: {
        size: 16384,
        lingerMs: 10
      },
      // 壓縮
      compression: CompressionTypes.Snappy,
      // 重試
      retry: {
        retries: 5,
        initialRetryTime: 100,
        maxRetryTime: 30000
      },
      // 冪等性（避免重複）
      idempotent: true,
      // 交易支援
      transactionalId: 'gighub-tx'
    });
  }
}
```

### 3. 消費者優化

```typescript
export class OptimizedKafkaConsumer {
  private consumer: Consumer;
  
  constructor() {
    this.consumer = new Kafka({
      clientId: 'gighub',
      brokers: ['kafka1:9092', 'kafka2:9092', 'kafka3:9092']
    }).consumer({
      groupId: 'task-consumers',
      // 自動提交
      autoCommit: false,
      // 批次讀取
      maxBytesPerPartition: 1048576,
      // 會話超時
      sessionTimeout: 30000,
      heartbeatInterval: 3000
    });
    
    this.consumer.run({
      partitionsConsumedConcurrently: 3, // 並行處理
      eachBatch: async ({ batch, resolveOffset, commitOffsetsIfNecessary }) => {
        for (const message of batch.messages) {
          await this.processMessage(message);
          resolveOffset(message.offset);
        }
        
        // 批次提交
        await commitOffsetsIfNecessary();
      }
    });
  }
}
```

### 4. 快取策略

```typescript
@Injectable()
export class CachedEventStore {
  private cache = new LRUCache<string, DomainEvent[]>({
    max: 1000,
    maxAge: 300000 // 5 分鐘
  });
  
  async query(options: QueryOptions): Promise<DomainEvent[]> {
    const cacheKey = this.getCacheKey(options);
    
    // 檢查快取
    const cached = this.cache.get(cacheKey);
    if (cached) {
      return cached;
    }
    
    // 從資料庫查詢
    const events = await this.innerStore.query(options);
    
    // 存入快取
    this.cache.set(cacheKey, events);
    
    return events;
  }
}
```

---

## 成本優化

### 1. 事件歸檔

```typescript
export class EventArchivalService {
  async archiveOldEvents(olderThan: Date): Promise<void> {
    // 1. 查詢舊事件
    const oldEvents = await this.eventStore.query({
      toTimestamp: olderThan
    });
    
    // 2. 壓縮並上傳到 S3 Glacier
    const archived = {
      archivedAt: new Date(),
      eventCount: oldEvents.length,
      events: oldEvents
    };
    
    await this.s3.send(new PutObjectCommand({
      Bucket: 'gighub-event-archive',
      Key: `archive/${olderThan.getFullYear()}/${olderThan.getMonth()}.json.gz`,
      Body: gzip(JSON.stringify(archived)),
      StorageClass: 'GLACIER'
    }));
    
    // 3. 從主儲存刪除
    for (const event of oldEvents) {
      await this.eventStore.delete(event.eventId);
    }
  }
}
```

### 2. 資源使用監控

```typescript
export class CostMonitoringService {
  async generateCostReport(): Promise<CostReport> {
    return {
      kafka: {
        instanceCost: await this.getKafkaInstanceCost(),
        storageCost: await this.getKafkaStorageCost(),
        dataTrasferCost: await this.getDataTransferCost()
      },
      s3: {
        storageCost: await this.getS3StorageCost(),
        requestCost: await this.getS3RequestCost()
      },
      total: 0 // 計算總成本
    };
  }
  
  async optimizeCosts(): Promise<Optimization[]> {
    const optimizations: Optimization[] = [];
    
    // 檢查未使用的 topics
    const unusedTopics = await this.findUnusedTopics();
    if (unusedTopics.length > 0) {
      optimizations.push({
        type: 'delete-unused-topics',
        savings: this.estimateSavings(unusedTopics),
        topics: unusedTopics
      });
    }
    
    // 檢查可歸檔的事件
    const archivableEvents = await this.findArchivableEvents();
    if (archivableEvents > 0) {
      optimizations.push({
        type: 'archive-old-events',
        savings: this.estimateArchiveSavings(archivableEvents)
      });
    }
    
    return optimizations;
  }
}
```

---

## 合規性

### 1. GDPR 資料刪除

```typescript
export class GDPRComplianceService {
  async deleteUserData(userId: string): Promise<void> {
    // 1. 查詢用戶相關事件
    const userEvents = await this.eventStore.query({
      userContext: { userId }
    });
    
    // 2. 匿名化事件（保留業務邏輯，移除個人資料）
    for (const event of userEvents) {
      const anonymized = this.anonymizeEvent(event);
      await this.eventStore.replace(event.eventId, anonymized);
    }
    
    // 3. 記錄刪除請求
    await this.auditLog.record({
      action: 'gdpr-data-deletion',
      userId,
      timestamp: new Date(),
      eventCount: userEvents.length
    });
  }
  
  private anonymizeEvent(event: DomainEvent): DomainEvent {
    return {
      ...event,
      metadata: {
        ...event.metadata,
        userContext: {
          userId: 'ANONYMIZED',
          roles: event.metadata.userContext?.roles || []
        }
      },
      payload: this.anonymizePayload(event.payload)
    };
  }
}
```

### 2. SOC2 稽核追蹤

```typescript
export class SOC2AuditService {
  async generateAuditReport(from: Date, to: Date): Promise<AuditReport> {
    const events = await this.eventStore.query({
      fromTimestamp: from,
      toTimestamp: to
    });
    
    return {
      period: { from, to },
      totalEvents: events.length,
      eventsByType: this.groupByType(events),
      securityEvents: events.filter(e => e.eventType.startsWith('security.')),
      accessChanges: events.filter(e => e.eventType.includes('.permission.')),
      dataChanges: events.filter(e => e.eventType.includes('.updated')),
      integrityCheck: await this.verifyEventIntegrity(events)
    };
  }
  
  async verifyEventIntegrity(events: DomainEvent[]): Promise<boolean> {
    // 驗證事件鏈完整性
    for (let i = 1; i < events.length; i++) {
      const prev = events[i - 1];
      const curr = events[i];
      
      // 檢查時間順序
      if (curr.timestamp < prev.timestamp) {
        return false;
      }
      
      // 檢查 causation 鏈
      if (curr.metadata.causationId !== prev.eventId) {
        // 允許不同聚合的事件
        if (curr.aggregateId === prev.aggregateId) {
          return false;
        }
      }
    }
    
    return true;
  }
}
```

### 3. 資料加密

```typescript
export class EncryptedEventStore implements IEventStore {
  private readonly kms = new KMSClient({ region: 'us-west-2' });
  private readonly keyId = 'alias/event-encryption-key';
  
  async append(event: DomainEvent): Promise<void> {
    // 加密敏感欄位
    const encrypted = await this.encryptSensitiveData(event);
    
    await this.innerStore.append(encrypted);
  }
  
  async query(options: QueryOptions): Promise<DomainEvent[]> {
    const events = await this.innerStore.query(options);
    
    // 解密
    return Promise.all(
      events.map(event => this.decryptSensitiveData(event))
    );
  }
  
  private async encryptSensitiveData(event: DomainEvent): Promise<DomainEvent> {
    const sensitiveFields = this.extractSensitiveFields(event.payload);
    
    const encrypted = await this.kms.send(new EncryptCommand({
      KeyId: this.keyId,
      Plaintext: Buffer.from(JSON.stringify(sensitiveFields))
    }));
    
    return {
      ...event,
      payload: {
        ...event.payload,
        _encrypted: encrypted.CiphertextBlob.toString('base64')
      }
    };
  }
}
```

---

## 監控與告警

### 1. 全面監控

```typescript
export class EventBusMonitoring {
  // Prometheus metrics
  private publishLatency = new Histogram({
    name: 'event_publish_latency_ms',
    help: 'Event publish latency in milliseconds',
    labelNames: ['event_type', 'region']
  });
  
  private consumerLag = new Gauge({
    name: 'consumer_lag',
    help: 'Consumer lag in messages',
    labelNames: ['consumer_group', 'topic', 'partition']
  });
  
  private errorRate = new Counter({
    name: 'event_errors_total',
    help: 'Total number of event errors',
    labelNames: ['error_type', 'event_type']
  });
  
  async collectMetrics(): Promise<void> {
    // 收集消費者延遲
    const lag = await this.kafka.admin().fetchOffsets({
      groupId: 'task-consumers'
    });
    
    for (const topic of lag) {
      for (const partition of topic.partitions) {
        this.consumerLag.set(
          { consumer_group: 'task-consumers', topic: topic.topic, partition: partition.partition },
          partition.offset - partition.metadata
        );
      }
    }
  }
}
```

### 2. 告警規則

```yaml
# prometheus-alerts.yml
groups:
  - name: event-bus
    rules:
      - alert: HighConsumerLag
        expr: consumer_lag > 10000
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "Consumer lag is high"
          description: "Consumer {{ $labels.consumer_group }} has lag of {{ $value }}"
      
      - alert: HighErrorRate
        expr: rate(event_errors_total[5m]) > 10
        for: 2m
        labels:
          severity: critical
        annotations:
          summary: "High error rate detected"
          description: "Error rate is {{ $value }} errors/sec"
      
      - alert: EventBusDown
        expr: up{job="event-bus"} == 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "Event Bus is down"
```

---

## 下一步（Level 8）

Level 8 將涵蓋：

1. **機器學習整合**: 異常檢測
2. **自動擴縮容**: 基於負載的自動調整
3. **混沌工程**: 系統韌性測試
4. **零停機升級**: 滾動更新策略
5. **全球分散式**: 多雲架構

---

**文檔版本**: 7.0  
**最後更新**: 2025-12-25  
**維護者**: GigHub 開發團隊
