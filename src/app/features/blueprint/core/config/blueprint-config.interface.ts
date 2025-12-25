/**
 * Module Configuration
 *
 * Configuration settings for an individual module within a blueprint.
 */
export interface ModuleConfig {
  /** Module ID */
  id: string;

  /** Whether the module is enabled */
  enabled: boolean;

  /** Load order (lower numbers load first) */
  order?: number;

  /** Module-specific configuration */
  config?: Record<string, any>;
}

/**
 * Blueprint Configuration
 *
 * Complete configuration for a blueprint instance.
 * Defines which modules are active and how they're configured.
 */
export interface IBlueprintConfig {
  /** Blueprint ID (unique identifier) */
  blueprintId: string;

  /** Blueprint name */
  name: string;

  /** Blueprint version (semantic versioning) */
  version: string;

  /** Blueprint description */
  description: string;

  /** Module configurations */
  modules: ModuleConfig[];

  /** Global configuration settings */
  featureFlags: Record<string, boolean>;

  /** Theme settings (optional) */
  theme?: {
    primaryColor: string;
    layout: string;
  };

  /** Permission configuration */
  permissions: {
    /** Role-based permission mapping */
    roles: Record<string, string[]>;
  };
}
