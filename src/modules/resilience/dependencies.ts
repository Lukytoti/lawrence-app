import { db } from '@/lib/db';
import { eventBus } from '@/lib/events';
import { CreateDependencyInput } from './types';

/**
 * Create a new service dependency.
 */
export async function createDependency(input: CreateDependencyInput) {
  return db.resilienceDependency.create({
    data: {
      dependencyCode: input.dependencyCode,
      name: input.name,
      serviceName: input.serviceName,
      dependencyType: input.dependencyType,
      criticality: input.criticality,
      healthCheckReference: input.healthCheckReference,
      fallbackStrategy: input.fallbackStrategy,
      rpoMinutes: input.rpoMinutes,
      rtoMinutes: input.rtoMinutes,
    },
  });
}

/**
 * Update a service dependency.
 */
export async function updateDependency(id: string, data: Partial<CreateDependencyInput>) {
  const { dependencyCode, ...updateData } = data;
  return db.resilienceDependency.update({ where: { id }, data: updateData });
}

/**
 * Deactivate a service dependency.
 */
export async function deactivateDependency(id: string) {
  return db.resilienceDependency.update({ where: { id }, data: { isActive: false } });
}

/**
 * List all dependencies with optional filtering.
 */
export async function listDependencies(options?: { type?: string; criticality?: string; isActive?: boolean }) {
  const where: any = {};
  if (options?.type) where.dependencyType = options.type;
  if (options?.criticality) where.criticality = options.criticality;
  if (options?.isActive !== undefined) where.isActive = options.isActive;

  return db.resilienceDependency.findMany({ where, orderBy: { criticality: 'asc' } });
}

/**
 * Detect circular recovery dependencies.
 * Dependencies are modeled as a directed graph via dependencyJson references.
 * Returns true if circular dependency is detected.
 */
export function detectCircularDependencies(dependencies: Array<{ dependencyCode: string; dependencyJson?: string | null }>): {
  hasCircular: boolean;
  cycle: string[];
} {
  // Build adjacency map from dependencyJson references
  const adjacency = new Map<string, string[]>();
  for (const dep of dependencies) {
    const deps: string[] = [];
    if (dep.dependencyJson) {
      try {
        const parsed = JSON.parse(dep.dependencyJson);
        if (Array.isArray(parsed.dependsOn)) {
          deps.push(...parsed.dependsOn);
        }
      } catch {
        // Invalid JSON, skip
      }
    }
    adjacency.set(dep.dependencyCode, deps);
  }

  // DFS cycle detection
  const visited = new Set<string>();
  const inStack = new Set<string>();
  const path: string[] = [];

  function dfs(node: string): string[] | null {
    if (inStack.has(node)) {
      const cycleStart = path.indexOf(node);
      return path.slice(cycleStart).concat(node);
    }
    if (visited.has(node)) return null;

    visited.add(node);
    inStack.add(node);
    path.push(node);

    const neighbors = adjacency.get(node) || [];
    for (const neighbor of neighbors) {
      const cycle = dfs(neighbor);
      if (cycle) return cycle;
    }

    inStack.delete(node);
    path.pop();
    return null;
  }

  for (const node of adjacency.keys()) {
    const cycle = dfs(node);
    if (cycle) {
      return { hasCircular: true, cycle };
    }
  }

  return { hasCircular: false, cycle: [] };
}

/**
 * Get dependency health overview.
 */
export async function getDependencyHealth() {
  const dependencies = await db.resilienceDependency.findMany({
    where: { isActive: true },
  });

  const circularCheck = detectCircularDependencies(
    dependencies.map(d => ({ dependencyCode: d.dependencyCode, dependencyJson: null }))
  );

  const criticalDeps = dependencies.filter(d => d.criticality === 'CRITICAL');
  const highDeps = dependencies.filter(d => d.criticality === 'HIGH');

  return {
    totalActive: dependencies.length,
    criticalCount: criticalDeps.length,
    highCount: highDeps.length,
    hasCircularDependencies: circularCheck.hasCircular,
    circularCycle: circularCheck.cycle,
    dependencies,
  };
}
