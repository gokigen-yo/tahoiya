"use client";

import { useEffect, useState } from "react";

const PLAYER_ID_KEY_PREFIX = "tahoiya_player_id";
const getPlayerIdKey = (roomId?: string) =>
  roomId ? `${PLAYER_ID_KEY_PREFIX}_${roomId}` : PLAYER_ID_KEY_PREFIX;

export function usePlayerId(contextRoomId?: string) {
  const [playerId, setPlayerIdState] = useState<string | null>(null);

  useEffect(() => {
    // contextRoomId がある場合のみ取得を試みる（または全体キーから取得）
    const key = getPlayerIdKey(contextRoomId);
    const stored = localStorage.getItem(key);
    if (stored) {
      setPlayerIdState(stored);
    } else {
      setPlayerIdState(null);
    }
  }, [contextRoomId]);

  const setPlayerId = (id: string, targetRoomId?: string) => {
    const key = getPlayerIdKey(targetRoomId || contextRoomId);
    localStorage.setItem(key, id);
    // 現在のコンテキストと一致する場合のみステートを更新
    if (!targetRoomId || targetRoomId === contextRoomId) {
      setPlayerIdState(id);
    }
  };

  const clearPlayerId = (targetRoomId?: string) => {
    const key = getPlayerIdKey(targetRoomId || contextRoomId);
    localStorage.removeItem(key);
    if (!targetRoomId || targetRoomId === contextRoomId) {
      setPlayerIdState(null);
    }
  };

  return { playerId, setPlayerId, clearPlayerId };
}
