import { GAMES, CATS } from "@/app/data/games";
import { Nav } from "@/components/Nav";
import { LibraryScreen } from "@/components/LibraryScreen";

export default function BibliotecaPage() {
  return (
    <>
      <Nav />
      <LibraryScreen games={GAMES} cats={CATS} />
    </>
  );
}
