import {
  type FinalResultRoom,
  INITIAL_PLAYER_SCORE,
  type MeaningInputRoom,
  type Player,
  type PlayerId,
  type Room,
  type RoundResultRoom,
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

      return {
        ...state,
        meanings: meanings,
      } as MeaningInputRoom;
    }

    case "VotingStarted": {
      const { meanings } = event.payload;
      if (!state) {
        throw new Error("Cannot start voting for non-existent room");
      }

      return {
        ...state,
        phase: "voting",
        meanings: meanings,
        votes: [],
      } as VotingRoom;
    }

    case "VoteListUpdated": {
      const { votes } = event.payload;
      if (!state) {
        throw new Error("Cannot update vote list in current phase");
      }

      return {
        ...state,
        votes: votes,
      } as VotingRoom;
    }

    case "RoundResultAnnounced": {
      if (!state) {
        throw new Error("Cannot announce round result in current phase");
      }

      return {
        ...state,
        phase: "round_result",
      } as RoundResultRoom;
    }

    case "ScoreUpdated": {
      const { playerId, betPoints, isChoosingCorrectMeaning, meaningSubmittedPlayerId } =
        event.payload;
      if (!state) {
        throw new Error("Cannot update score for non-existent room");
      }

      // 誰が親か、誰がその意味を作ったかによって配分が変わる
      // この evolve では単純に event の内容を反映する
      const updatePlayerScore = (players: Player[], targetId: PlayerId, diff: number): Player[] =>
        players.map((p) => (p.id === targetId ? { ...p, score: p.score + diff } : p));

      let newPlayers = [...state.players];

      if (isChoosingCorrectMeaning) {
        // 子が正解: 親から賭け点を受け取る
        const { parentPlayerId } = event.payload;
        newPlayers = updatePlayerScore(newPlayers, playerId, betPoints);
        newPlayers = updatePlayerScore(newPlayers, parentPlayerId, -betPoints);
      } else {
        // 子が不正解: 偽の意味の作者に賭け点、親に1点を支払う
        newPlayers = updatePlayerScore(newPlayers, playerId, -(betPoints + 1));
        newPlayers = updatePlayerScore(newPlayers, meaningSubmittedPlayerId, betPoints);
        // ペイロードに含まれる parentPlayerId を使って +1 する
        const { parentPlayerId } = event.payload;
        newPlayers = updatePlayerScore(newPlayers, parentPlayerId, 1);
      }

      return {
        ...state,
        players: newPlayers,
      };
    }

    case "AllChildrenMissed": {
      const { parentPlayerId, gainedPoints } = event.payload;
      if (!state) {
        throw new Error("Cannot apply bonus for non-existent room");
      }

      const childrenCount = state.players.length - 1;
      const totalGained = gainedPoints * childrenCount;

      return {
        ...state,
        players: state.players.map((p) =>
          p.id === parentPlayerId
            ? { ...p, score: p.score + totalGained }
            : { ...p, score: p.score - gainedPoints },
        ),
      };
    }

    case "NextRoundStarted": {
      const { nextRound, nextParentId } = event.payload;
      if (!state) {
        throw new Error("Cannot start next round for non-existent room");
      }

      const nextRoundRoom: ThemeInputRoom = {
        id: state.id,
        players: state.players,
        hostId: state.hostId,
        phase: "theme_input",
        round: nextRound,
        parentPlayerId: nextParentId,
      };

      return nextRoundRoom;
    }

    case "GameEnded": {
      if (!state) {
        throw new Error("Cannot end game for non-existent room");
      }

      return {
        ...state,
        phase: "final_result",
      } as FinalResultRoom;
    }

    default:
      return state as Room;
  }
};
