import { NewBoardForm } from "./new-board-form";

// A new account has no board (docs/boards.md, "Tableaux"): the page offers to create the first one,
// which starts with three lists.
export function EmptyBoards() {
  return (
    <div className="flex flex-col gap-2 px-8 py-14 sm:px-16">
      <p className="eyebrow text-muted-foreground">Mes tableaux</p>
      <h1 className="font-heading text-5xl font-medium">Aucun tableau</h1>
      <p className="max-w-md text-sm text-muted-foreground">
        Un tableau range votre travail en listes et en cartes, que vous déplacez à mesure qu&apos;il avance. Il
        commence avec trois listes : « À faire », « En cours » et « Terminé ».
      </p>
      <NewBoardForm submitLabel="Créer mon premier tableau" autoFocus={false} className="mt-6 max-w-sm" />
    </div>
  );
}
