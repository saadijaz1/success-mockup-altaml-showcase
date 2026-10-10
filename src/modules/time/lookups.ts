import type { WorkRef } from '../../types';
import { projects, tasks } from '../../data/mock';

export function projectName(id?: string) {
  return projects.find((p) => p.id === id)?.name;
}

export function workRefLabel(projectId: string | undefined, ref: WorkRef): string | undefined {
  if (ref.kind === 'none') return undefined;
  if (ref.kind === 'task') return tasks.find((t) => t.id === ref.id)?.title;
  const stage = projects.find((p) => p.id === projectId)?.stages.find((s) => s.id === ref.id);
  return stage ? `${stage.name} (stage)` : undefined;
}
