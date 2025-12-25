/**
 * Storage Module Index
 * 
 * Exports all storage-related components for centralized imports
 * 
 * @author Global Event Bus Team
 * @version 1.0.0
 * @phase Phase 1 (P0 - Critical) - Task 1.1
 */

// Interfaces
export * from '../../interfaces/storage-strategy.interface';

// Implementations
export * from './inmemory-storage.strategy';
export * from './firestore-storage.strategy';
export * from './storage-router.service';
