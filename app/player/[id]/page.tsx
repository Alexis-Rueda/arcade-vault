import { notFound } from "next/navigation";
import { getGameById } from "@/app/data/games";
import { Nav } from "@/components/Nav";
import { PlayerScreen } from "@/components/PlayerScreen";

export default async function PlayerPage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  const game = getGameById(id);

  if (!game) {
    notFound();
  }

  return (
    <>
      <Nav />
      <PlayerScreen game={game} />
    </>
  );
}
