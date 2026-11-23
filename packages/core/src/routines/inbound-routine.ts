export type InboundRoutine = { name: string; prompt: string };

/** How an inbound delivery (webhook, GitHub, messaging) quotes a routine it runs. */
export function inboundRoutineBlock(routine: InboundRoutine): string {
  return `Run routine "${routine.name}":\n${routine.prompt.trim()}`;
}

/**
 * The routines an inbound task starts with, in order. Those blocks come first and the untrusted
 * payload after them, and each must match one of `routines` exactly, so text in the payload can
 * never be taken for the owner's instructions.
 */
export function inboundRoutineMatches<Routine extends InboundRoutine>(
  taskPrompt: string,
  routines: Routine[],
): Routine[] {
  // Longest first: names need not be unique, and one routine's block can begin another's.
  const blocks = routines
    .map((routine) => ({ block: `${inboundRoutineBlock(routine)}\n`, routine }))
    .sort((a, b) => b.block.length - a.block.length);
  const matches: Routine[] = [];
  let rest = taskPrompt;
  for (;;) {
    const match = blocks.find(({ block }) => rest.startsWith(block));
    if (!match) return matches;
    matches.push(match.routine);
    rest = rest.slice(match.block.length);
  }
}

/** The prompts of the routines an inbound task starts with; see inboundRoutineMatches. */
export function inboundRoutinePrompts(taskPrompt: string, routines: InboundRoutine[]): string[] {
  return inboundRoutineMatches(taskPrompt, routines).map((routine) => routine.prompt.trim());
}

/**
 * Whether an inbound task runs as if the owner had sent it: it starts at least one routine, and
 * every routine it starts trusts its deliveries.
 */
export function inboundDeliveryTrusted(
  taskPrompt: string,
  routines: Array<InboundRoutine & { trustDeliveries: boolean }>,
): boolean {
  const matches = inboundRoutineMatches(taskPrompt, routines);
  return matches.length > 0 && matches.every((routine) => routine.trustDeliveries);
}
