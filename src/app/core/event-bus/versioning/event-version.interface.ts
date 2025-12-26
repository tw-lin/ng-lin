/**
 * Event Version Interface
 * 
 * Defines version metadata for events to support evolution and backward compatibility.
 * Follows Semantic Versioning (major.minor.patch) for event schema changes.
 * 
 * @see docs/event-bus(Global Event Bus)-4.md for versioning strategy
 */

/**
 * Semantic version interface for events
 * 
 * @example
 * ```typescript
 * const version: EventVersion = {
 *   major: 2,
 *   minor: 1,
 *   patch: 0,
 *   toString: () => '2.1.0'
 * };
 * ```
 */
export interface EventVersion {
  /** Major version - Incremented for breaking changes */
  readonly major: number;
  
  /** Minor version - Incremented for backward-compatible additions */
  readonly minor: number;
  
  /** Patch version - Incremented for backward-compatible bug fixes */
  readonly patch: number;
  
  /** Convert version to string format (e.g., "1.2.3") */
  toString(): string;
}

/**
 * Version comparison result
 */
export type VersionComparison = -1 | 0 | 1; // older, same, newer

/**
 * Version compatibility check result
 */
export interface VersionCompatibility {
  /** Whether the versions are compatible */
  readonly compatible: boolean;
  
  /** Reason for incompatibility */
  readonly reason?: string;
  
  /** Required migration steps if incompatible */
  readonly migrationPath?: string[];
}

/**
 * Event version metadata
 */
export interface EventVersionMetadata {
  /** Current version of the event */
  readonly version: EventVersion;
  
  /** Previous versions this event schema has evolved from */
  readonly previousVersions: EventVersion[];
  
  /** Minimum compatible version */
  readonly minCompatibleVersion: EventVersion;
  
  /** Whether this version is deprecated */
  readonly deprecated: boolean;
  
  /** Deprecation message if deprecated */
  readonly deprecationMessage?: string;
  
  /** Target version for migration if deprecated */
  readonly migrateTo?: EventVersion;
}

/**
 * Versioned event interface
 */
export interface IVersionedEvent {
  /** Get the current version of this event */
  getVersion(): EventVersion;
  
  /** Check if this event is compatible with a target version */
  isCompatibleWith(targetVersion: EventVersion): VersionCompatibility;
  
  /** Get version metadata */
  getVersionMetadata(): EventVersionMetadata;
}

/**
 * Utility functions for version comparison and manipulation
 */
export class EventVersionUtil {
  /**
   * Parse version string to EventVersion object
   * 
   * @example
   * ```typescript
   * const version = EventVersionUtil.parse('2.1.0');
   * // { major: 2, minor: 1, patch: 0 }
   * ```
   */
  static parse(versionString: string): EventVersion {
    const parts = versionString.split('.').map(Number);
    
    if (parts.length !== 3 || parts.some(isNaN)) {
      throw new Error(`Invalid version string: ${versionString}`);
    }
    
    const [major, minor, patch] = parts;
    
    return {
      major,
      minor,
      patch,
      toString: () => `${major}.${minor}.${patch}`
    };
  }
  
  /**
   * Compare two versions
   * 
   * @returns -1 if v1 < v2, 0 if v1 === v2, 1 if v1 > v2
   * 
   * @example
   * ```typescript
   * EventVersionUtil.compare({ major: 1, minor: 0, patch: 0 }, 
   *                          { major: 2, minor: 0, patch: 0 }); // -1
   * ```
   */
  static compare(v1: EventVersion, v2: EventVersion): VersionComparison {
    if (v1.major !== v2.major) {
      return v1.major < v2.major ? -1 : 1;
    }
    
    if (v1.minor !== v2.minor) {
      return v1.minor < v2.minor ? -1 : 1;
    }
    
    if (v1.patch !== v2.patch) {
      return v1.patch < v2.patch ? -1 : 1;
    }
    
    return 0;
  }
  
  /**
   * Check if v1 is compatible with v2
   * 
   * Compatible if:
   * - Same major version (backward compatible within major version)
   * - v1 >= v2 (newer or equal)
   */
  static isCompatible(v1: EventVersion, v2: EventVersion): VersionCompatibility {
    if (v1.major !== v2.major) {
      return {
        compatible: false,
        reason: `Major version mismatch: ${v1.major} !== ${v2.major}`,
        migrationPath: [`${v1.toString()}`, `${v2.toString()}`]
      };
    }
    
    const comparison = this.compare(v1, v2);
    
    if (comparison < 0) {
      return {
        compatible: false,
        reason: `Version ${v1.toString()} is older than ${v2.toString()}`,
        migrationPath: [`${v1.toString()}`, `${v2.toString()}`]
      };
    }
    
    return { compatible: true };
  }
  
  /**
   * Increment version based on change type
   */
  static increment(
    version: EventVersion,
    type: 'major' | 'minor' | 'patch'
  ): EventVersion {
    switch (type) {
      case 'major':
        return {
          major: version.major + 1,
          minor: 0,
          patch: 0,
          toString: () => `${version.major + 1}.0.0`
        };
      case 'minor':
        return {
          major: version.major,
          minor: version.minor + 1,
          patch: 0,
          toString: () => `${version.major}.${version.minor + 1}.0`
        };
      case 'patch':
        return {
          major: version.major,
          minor: version.minor,
          patch: version.patch + 1,
          toString: () => `${version.major}.${version.minor}.${version.patch + 1}`
        };
    }
  }
}
