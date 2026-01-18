import {
  INITIAL_PLAYER_SCORE,
  type Player,
  type Room,
  type ThemeInputRoom,
  type WaitingForJoinRoom,
} from "./Room";
import type { RoomEvent } from "./RoomEvents";

export const getInitialState = (): Room | null => null;

export const evolve = (state: Room | null, event: RoomEvent): Room => {
  switch (event.type) {
    case "RoomCreated": {
      const { roomId, hostId, hostName } = event.payload;
      const hostPlayer: Player = {
        id: hostId,
        name: hostName,
        score: INITIAL_PLAYER_SCORE,
      };

      const newRoom: WaitingForJoinRoom = {
        id: roomId,
        phase: "waiting_for_join",
        players: [hostPlayer],
        hostId,
      };
      return newRoom;
    }
    case "PlayerJoined": {
      const { playerId, playerName } = event.payload;
      if (!state) {
        throw new Error("Cannot join a non-existent room");
      }

      const newPlayer: Player = {
        id: playerId,
        name: playerName,
        score: INITIAL_PLAYER_SCORE,
      };

      return {
        ...state,
        players: [...state.players, newPlayer],
      };
    }

    case "GameStarted": {
      if (!state) {
        throw new Error("Cannot start game for non-existent room");
      }

      const newRoom: ThemeInputRoom = {
        ...state,
        phase: "theme_input",
        round: 1,
        parentPlayerId: state.hostId,
      };

      return newRoom;
    }
    default:
      return state as Room; // Should not happen if types are correct
  }
};
