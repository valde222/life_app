import { List } from './models';

export interface ListDrop {
  moved: List;
  group: string;
  index: number;
}

export function nextOrder(items: readonly { order: number }[]): number {
  return Math.max(-1, ...items.map((item) => item.order)) + 1;
}

export function reorderLists(lists: List[], drop: ListDrop): List[] {
  const others = lists.filter((list) => list.id !== drop.moved.id);
  const inTarget = others.filter((list) => list.group === drop.group);
  inTarget.splice(drop.index, 0, { ...drop.moved, group: drop.group });
  const rest = others.filter((list) => list.group !== drop.group);
  return [...rest, ...inTarget];
}
