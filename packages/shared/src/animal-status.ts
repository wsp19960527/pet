/** Status machine helpers — string-based to avoid circular imports. */

export const ANIMAL_STATUS_FLOW = [
  'discovered',
  'contacting',
  'rescued',
  'at_vet',
  'fostering',
  'adopted',
] as const;

export type AnimalStatusValue =
  | (typeof ANIMAL_STATUS_FLOW)[number]
  | 'deceased'
  | 'abandoned';

export const ANIMAL_STATUS_LABELS: Record<AnimalStatusValue, string> = {
  discovered: '发现',
  contacting: '联系',
  rescued: '救助',
  at_vet: '送医',
  fostering: '待领养',
  adopted: '已领养',
  deceased: '已离世',
  abandoned: '救助中止',
};

const TRANSITIONS: Record<string, string[]> = {
  discovered: ['contacting', 'abandoned'],
  contacting: ['rescued', 'abandoned'],
  rescued: ['at_vet', 'deceased'],
  at_vet: ['fostering', 'deceased'],
  fostering: ['adopted', 'deceased'],
  adopted: [],
  deceased: [],
  abandoned: [],
};

export function canTransition(from: string, to: string): boolean {
  return TRANSITIONS[from]?.includes(to) ?? false;
}

export function assertTransition(from: string, to: string): void {
  if (!canTransition(from, to)) {
    throw new Error(`Invalid status transition: ${from} -> ${to}`);
  }
}
