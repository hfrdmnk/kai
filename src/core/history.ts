/** One undoable change: the state before and after it, and what the HUD calls it (`padding-right`, `clear all`) */
export type Step<T> = { label: string; before: T; after: T };

/** Linear undo history; `future` holds undone steps until a new step drops them */
export type History<T> = { past: Step<T>[]; future: Step<T>[] };

/** Steps kept; older ones fall off */
export const HISTORY_LIMIT = 100;

export const emptyHistory = <T>(): History<T> => ({ past: [], future: [] });

export const record = <T>(history: History<T>, step: Step<T>): History<T> =>
  ({ past: [...history.past, step].slice(-HISTORY_LIMIT), future: [] });

/** The step to take back (restore its `before`), or null when there's nothing to undo */
export const undo = <T>(history: History<T>): { history: History<T>; step: Step<T> | null } => {
  const step = history.past.at(-1);
  if (!step) return { history, step: null };
  return { history: { past: history.past.slice(0, -1), future: [...history.future, step] }, step };
};

/** The step to apply again (restore its `after`), or null when there's nothing to redo */
export const redo = <T>(history: History<T>): { history: History<T>; step: Step<T> | null } => {
  const step = history.future.at(-1);
  if (!step) return { history, step: null };
  return { history: { past: [...history.past, step], future: history.future.slice(0, -1) }, step };
};
