import { notFound } from "next/navigation";
import { getGameById } from "@/app/data/games";
import { GameDetailScreen } from "@/components/GameDetailScreen";

export default async function DetallePage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  const game = getGameById(id);

  if (!game) {
    notFound();
  }

  return <GameDetailScreen game={game} />;
}
