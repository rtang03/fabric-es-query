import type { Commit } from './Commit';

export const isCommitRecord = (input: unknown): input is Record<string, Commit> =>
  Object.entries(input)
    .map(([_, value]) => value.id !== undefined && value.entityName !== undefined)
    .reduce((prev, curr) => prev && curr, true);
