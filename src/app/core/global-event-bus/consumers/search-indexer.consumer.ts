/**
 * Search Index Consumer
 *
 * Updates search indices when domain events modify searchable entities.
 *
 * @module Consumers/SearchIndexer
 */

import { Injectable, inject, signal } from '@angular/core';

import { EventHandler } from '../decorators/event-handler.decorator';
import { Retry } from '../decorators/retry.decorator';
import { Subscribe } from '../decorators/subscribe.decorator';
import {
  TaskCreatedEvent,
  TaskUpdatedEvent,
  TaskDeletedEvent,
  BlueprintCreatedEvent,
  BlueprintUpdatedEvent,
  BlueprintDeletedEvent
} from '../domain-events';
import { EventConsumer } from '../services/event-consumer.base';

/**
 * Search document interface
 */
interface SearchDocument {
  readonly id: string;
  readonly type: 'task' | 'blueprint' | 'user';
  readonly title: string;
  readonly description?: string;
  readonly content: string;
  readonly tags: readonly string[];
  readonly timestamp: Date;
  readonly metadata: Record<string, unknown>;
}

/**
 * Search Index Consumer
 *
 * Priority: 50 (medium priority)
 * Tags: search, indexing, elasticsearch
 *
 * Maintains search indices for full-text search functionality.
 */
@Injectable({ providedIn: 'root' })
@EventHandler({
  priority: 50,
  tags: ['search', 'indexing', 'elasticsearch'],
  description: 'Updates search indices for searchable entities',
  group: 'search',
  version: '1.0.0'
})
export class SearchIndexConsumer extends EventConsumer {
  /**
   * Search index (in-memory for demo)
   */
  private _searchIndex = signal<SearchDocument[]>([]);
  readonly searchIndex = this._searchIndex.asReadonly();

  /**
   * Handle task created - add to search index
   */
  @Subscribe('task.created')
  @Retry({ maxAttempts: 3, backoff: 'exponential', initialDelay: 1000 })
  async handleTaskCreated(event: TaskCreatedEvent): Promise<void> {
    const { task } = event.payload;

    const document: SearchDocument = {
      id: task.id,
      type: 'task',
      title: task.title,
      description: task.description,
      content: `${task.title} ${task.description || ''}`.toLowerCase(),
      tags: task.tags || [],
      timestamp: task.createdAt,
      metadata: {
        status: task.status,
        priority: task.priority,
        blueprintId: task.blueprintId
      }
    };

    await this.indexDocument(document);
    console.log('[SearchIndexConsumer] Indexed task:', task.id);
  }

  /**
   * Handle task updated - update search index
   */
  @Subscribe('task.updated')
  @Retry({ maxAttempts: 3, backoff: 'exponential', initialDelay: 1000 })
  async handleTaskUpdated(event: TaskUpdatedEvent): Promise<void> {
    const { taskId, changes } = event.payload;

    // Remove old document
    await this.removeDocument(taskId);

    // Add updated document (simplified - in production, fetch full task)
    if (changes.title || changes.description) {
      const document: SearchDocument = {
        id: taskId,
        type: 'task',
        title: (changes.title as string) || 'Updated Task',
        description: changes.description as string | undefined,
        content: `${changes.title || ''} ${changes.description || ''}`.toLowerCase(),
        tags: (changes.tags as readonly string[]) || [],
        timestamp: new Date(),
        metadata: { ...changes }
      };

      await this.indexDocument(document);
      console.log('[SearchIndexConsumer] Re-indexed task:', taskId);
    }
  }

  /**
   * Handle task deleted - remove from search index
   */
  @Subscribe('task.deleted')
  @Retry({ maxAttempts: 2, backoff: 'linear', initialDelay: 500 })
  async handleTaskDeleted(event: TaskDeletedEvent): Promise<void> {
    const { taskId } = event.payload;

    await this.removeDocument(taskId);
    console.log('[SearchIndexConsumer] Removed task from index:', taskId);
  }

  /**
   * Handle blueprint created - add to search index
   */
  @Subscribe('blueprint.created')
  @Retry({ maxAttempts: 3, backoff: 'exponential', initialDelay: 1000 })
  async handleBlueprintCreated(event: BlueprintCreatedEvent): Promise<void> {
    const { blueprint } = event.payload;

    const document: SearchDocument = {
      id: blueprint.id,
      type: 'blueprint',
      title: blueprint.name,
      description: blueprint.description,
      content: `${blueprint.name} ${blueprint.description || ''}`.toLowerCase(),
      tags: [],
      timestamp: blueprint.createdAt,
      metadata: {
        ownerType: blueprint.ownerType,
        ownerId: blueprint.ownerId,
        status: blueprint.status
      }
    };

    await this.indexDocument(document);
    console.log('[SearchIndexConsumer] Indexed blueprint:', blueprint.id);
  }

  /**
   * Handle blueprint updated - update search index
   */
  @Subscribe('blueprint.updated')
  @Retry({ maxAttempts: 3, backoff: 'exponential', initialDelay: 1000 })
  async handleBlueprintUpdated(event: BlueprintUpdatedEvent): Promise<void> {
    const { blueprintId, changes } = event.payload;

    await this.removeDocument(blueprintId);

    if (changes.name || changes.description) {
      const document: SearchDocument = {
        id: blueprintId,
        type: 'blueprint',
        title: (changes.name as string) || 'Updated Blueprint',
        description: changes.description as string | undefined,
        content: `${changes.name || ''} ${changes.description || ''}`.toLowerCase(),
        tags: [],
        timestamp: new Date(),
        metadata: { ...changes }
      };

      await this.indexDocument(document);
      console.log('[SearchIndexConsumer] Re-indexed blueprint:', blueprintId);
    }
  }

  /**
   * Handle blueprint deleted - remove from search index
   */
  @Subscribe('blueprint.deleted')
  @Retry({ maxAttempts: 2, backoff: 'linear', initialDelay: 500 })
  async handleBlueprintDeleted(event: BlueprintDeletedEvent): Promise<void> {
    const { blueprintId } = event.payload;

    await this.removeDocument(blueprintId);
    console.log('[SearchIndexConsumer] Removed blueprint from index:', blueprintId);
  }

  /**
   * Index a search document
   */
  private async indexDocument(document: SearchDocument): Promise<void> {
    // Add to in-memory index
    this._searchIndex.update(index => [...index, document]);

    // Simulate indexing delay
    await new Promise(resolve => setTimeout(resolve, 50));

    // In production, integrate with:
    // - Elasticsearch
    // - Algolia
    // - Meilisearch
    // - Typesense
    // await this.elasticsearchClient.index({
    //   index: 'documents',
    //   id: document.id,
    //   body: document
    // });
  }

  /**
   * Remove document from search index
   */
  private async removeDocument(documentId: string): Promise<void> {
    this._searchIndex.update(index => index.filter(doc => doc.id !== documentId));

    await new Promise(resolve => setTimeout(resolve, 20));

    // In production:
    // await this.elasticsearchClient.delete({
    //   index: 'documents',
    //   id: documentId
    // });
  }

  /**
   * Search documents (simple in-memory search)
   */
  search(query: string, type?: 'task' | 'blueprint' | 'user'): SearchDocument[] {
    const lowerQuery = query.toLowerCase();

    return this._searchIndex().filter(doc => {
      const typeMatch = !type || doc.type === type;
      const contentMatch = doc.content.includes(lowerQuery);
      return typeMatch && contentMatch;
    });
  }

  /**
   * Get total indexed documents
   */
  getTotalDocuments(): number {
    return this._searchIndex().length;
  }

  /**
   * Get document count by type
   */
  getDocumentCountByType(): Record<string, number> {
    const index = this._searchIndex();
    return {
      task: index.filter(d => d.type === 'task').length,
      blueprint: index.filter(d => d.type === 'blueprint').length,
      user: index.filter(d => d.type === 'user').length
    };
  }
}
