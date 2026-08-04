import { createClient } from '@/lib/supabase/client-browser';
import type { ScoreRow } from '@/app/data/types';

type ScoreInsert = {
  gameId: string;
  playerName: string;
  score: number;
  userId?: string | null;
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('es-ES');
}

export async function fetchLeaderboard(
  gameId: string,
  limit: number = 12,
): Promise<ScoreRow[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('scores')
    .select('player_name, score, created_at')
    .eq('game_id', gameId)
    .order('score', { ascending: false })
    .order('created_at', { ascending: true })
    .limit(limit);

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((row, i) => ({
    rank: i + 1,
    name: row.player_name,
    score: row.score,
    date: formatDate(row.created_at),
  }));
}

export async function fetchPlayerBest(
  gameId: string,
  playerName: string,
): Promise<{ score: number; date: string } | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('scores')
    .select('player_name, score, created_at')
    .eq('game_id', gameId)
    .eq('player_name', playerName)
    .order('score', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data ? { score: data.score, date: formatDate(data.created_at) } : null;
}

export async function insertScore(entry: ScoreInsert): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from('scores').insert({
    game_id: entry.gameId,
    player_name: entry.playerName,
    score: entry.score,
    user_id: entry.userId ?? null,
  });

  if (error) {
    throw new Error(error.message);
  }
}
