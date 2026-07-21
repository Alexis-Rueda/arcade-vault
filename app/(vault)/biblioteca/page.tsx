import { GAMES, CATS } from "@/app/data/games";
import { LibraryScreen } from "@/components/LibraryScreen";

export default function BibliotecaPage() {
  return <LibraryScreen games={GAMES} cats={CATS} />;
}
