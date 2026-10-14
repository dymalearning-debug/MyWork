import { KeyboardCode, type Announcements } from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";

// Drag and drop of the boards, lists, cards and checklist items (docs/boards.md): with the mouse,
// or with the keyboard, like the sections of the Profil module: Space, the arrows, Space again.
// Enter is left to the element itself (open a card, follow a link).

export const KEYBOARD_CODES = {
  start: [KeyboardCode.Space],
  cancel: [KeyboardCode.Esc],
  end: [KeyboardCode.Space, KeyboardCode.Enter],
};

export const sortableCoordinates = sortableKeyboardCoordinates;

export const SCREEN_READER_INSTRUCTIONS = {
  draggable:
    "Pour déplacer cet élément, appuyez sur Espace, puis utilisez les flèches. Appuyez de nouveau sur Espace pour le déposer, ou sur Échap pour annuler.",
};

export function sortableAnnouncements(
  labelOf: (id: string | number) => string,
  positionOf: (id: string | number) => number,
  count: () => number,
): Announcements {
  return {
    onDragStart: ({ active }) => `« ${labelOf(active.id)} » saisi, position ${positionOf(active.id)} sur ${count()}.`,
    onDragOver: ({ active, over }) =>
      over ? `« ${labelOf(active.id)} » en position ${positionOf(over.id)} sur ${count()}.` : undefined,
    onDragEnd: ({ active, over }) =>
      over ? `« ${labelOf(active.id)} » déposé en position ${positionOf(over.id)} sur ${count()}.` : undefined,
    onDragCancel: ({ active }) => `Déplacement de « ${labelOf(active.id)} » annulé.`,
  };
}
