import { useCallback } from "react";
import type { RoomStateResponse } from "../types/RoomStateResponse";

const KEY_PREFIX = "room_init_state_";
const getRoomInitialStateKey = (roomId: string) => `${KEY_PREFIX}${roomId}`;

export function saveRoomInitialState(roomId: string, state: RoomStateResponse) {
  if (typeof window !== "undefined") {
    sessionStorage.setItem(getRoomInitialStateKey(roomId), JSON.stringify(state));
  }
}

export function useRoomInitialState(roomId: string) {
  const storageKey = getRoomInitialStateKey(roomId);

  const getInitialState = useCallback(() => {
    if (typeof window === "undefined") return null;

    const saved = sessionStorage.getItem(storageKey);
    if (!saved) return null;

    // 一度取得したら削除する（使い捨て）
    sessionStorage.removeItem(storageKey);

    try {
      return JSON.parse(saved) as RoomStateResponse;
    } catch (e) {
      console.error("Failed to parse initial state from sessionStorage", e);
      return null;
    }
  }, [storageKey]);

  return { getInitialState };
}
