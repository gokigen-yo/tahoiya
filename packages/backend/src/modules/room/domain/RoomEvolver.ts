import {
  INITIAL_PLAYER_SCORE,
  type MeaningInputRoom,
  type Player,
  type Room,
  type ThemeInputRoom,
  type VotingRoom,
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

    case "ThemeInputted": {
      const { theme } = event.payload;
      if (!state) {
        throw new Error("Cannot input theme for non-existent room");
      }

      return {
        ...state,
        phase: "meaning_input",
        theme,
        meanings: [],
      } as MeaningInputRoom;
    }

    case "MeaningListUpdated": {
      const { meanings } = event.payload;
      if (!state) {
        throw new Error("Cannot input meaning for non-existent room");
      }

      // Check if all players have submitted meanings (including parent?)
      // Rules say:
      // Child: inputs fake meaning
      // Parent: inputs real meaning (or edits it)
      // So ALL players must input meaning.

      if (meanings.length === state.players.length) {
        // Transition to VotingRoom
        // Note: Shuffling and choiceIndex assignment should happen here or be handled by the specialized view model.
        // For Domain entity state, we might need to assign arbitrary indices or just hold them.
        // The VotingRoom type definition requires 'choiceIndex'.
        // We will assign provisional indices here (e.g. shuffle order).
        // Since we can't easily shuffle deterministically without an external seed or service in a pure function,
        // we might just list them. Ideally, shuffling should be part of the "Next Phase" transition logic or random seed should be passed.
        // For now, we simply map them to indices in order of submission (or ID order).
        // Real shuffling might be better done in the Application Service or by passing a seed in the command/event.
        // Let's assume for now 0..N indices.

        const meaningsWithIndex = meanings.map((m, index) => ({
          ...m,
          choiceIndex: index, // TODO: Shuffle these!
        }));

        return {
          ...state,
          phase: "voting",
          meanings: meaningsWithIndex,
          votes: [],
        } as VotingRoom;
      }

      return {
        ...state,
        meanings: meanings,
      } as MeaningInputRoom;
    }
    default:
      return state as Room; // Should not happen if types are correct
  }
};
