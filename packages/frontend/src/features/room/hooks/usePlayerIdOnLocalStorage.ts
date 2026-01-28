"use client";

import { useEffect, useState } from "react";

const PLAYER_ID_KEY = "tahoiya_player_id";

export function usePlayerIdOnLocalStorage() {
  const [playerId, setPlayerIdState] = useState<string | null>(null);

  useEffect(() => {
    // localStorage から playerId を取得
    const stored = localStorage.getItem(PLAYER_ID_KEY);
    if (stored) {
      setPlayerIdState(stored);
    }
  }, []);

  const setPlayerId = (id: string) => {
    localStorage.setItem(PLAYER_ID_KEY, id);
    setPlayerIdState(id);
  };

  const clearPlayerId = () => {
    localStorage.removeItem(PLAYER_ID_KEY);
    setPlayerIdState(null);
  };

  return { playerId, setPlayerId, clearPlayerId };
}
