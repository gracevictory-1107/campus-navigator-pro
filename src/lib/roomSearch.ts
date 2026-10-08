import type { Room } from "@/data/floorPlans";

export type SearchableRoom = {
  room: Room;
  floorId: string;
  floorTitle: string;
};

function normalizeSearchText(value: string): string {
  return value
    .toLowerCase()
    .replace(/[&+]/g, " and ")
    .replace(/[—–−_/.():]+/g, " ")
    .replace(/[^a-z0-9\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function rankRoomSearchResults(query: string, rooms: SearchableRoom[]): SearchableRoom[] {
  const normalizedQuery = normalizeSearchText(query);
  if (!normalizedQuery) return [];

  const queryTokens = normalizedQuery.split(" ").filter(Boolean);

  return rooms
    .map((item) => {
      const label = normalizeSearchText(item.room.label);
      const id = normalizeSearchText(item.room.id);
      const sublabel = normalizeSearchText(item.room.sublabel ?? "");
      const description = normalizeSearchText(item.room.description ?? "");
      const floorTitle = normalizeSearchText(item.floorTitle);
      const floorId = normalizeSearchText(item.floorId);
      const composite = [label, id, sublabel, description, floorTitle, floorId].filter(Boolean).join(" ");

      let score = Number.POSITIVE_INFINITY;

      if (label === normalizedQuery || id === normalizedQuery) {
        score = 0;
      } else if (label.startsWith(normalizedQuery)) {
        score = 10;
      } else if (id.startsWith(normalizedQuery)) {
        score = 12;
      } else if (queryTokens.every((token) => label.includes(token) || id.includes(token))) {
        score = 20;
      } else if (queryTokens.every((token) => composite.includes(token))) {
        score = 30;
      } else if (composite.includes(normalizedQuery)) {
        score = 40;
      } else if (queryTokens.some((token) => composite.includes(token))) {
        score = 50;
      }

      return { item, score };
    })
    .filter(({ score }) => Number.isFinite(score))
    .sort((a, b) =>
      a.score - b.score ||
      a.item.floorTitle.localeCompare(b.item.floorTitle) ||
      a.item.room.label.localeCompare(b.item.room.label)
    )
    .map(({ item }) => item);
}
