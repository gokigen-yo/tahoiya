export class InMemorySessionStore {
  private socketToPlayer = new Map<string, string>();
  private playerToSocket = new Map<string, string>();

  bind(socketId: string, playerId: string): void {
    this.socketToPlayer.set(socketId, playerId);
    this.playerToSocket.set(playerId, socketId);
  }

  getPlayerId(socketId: string): string | undefined {
    return this.socketToPlayer.get(socketId);
  }

  getSocketId(playerId: string): string | undefined {
    return this.playerToSocket.get(playerId);
  }

  unbind(socketId: string): void {
    const playerId = this.socketToPlayer.get(socketId);
    if (playerId) {
      this.socketToPlayer.delete(socketId);
      // to prevent clearing a new connection if a re-join occurred efficiently.
      if (this.playerToSocket.get(playerId) === socketId) {
        this.playerToSocket.delete(playerId);
      }
    }
  }
}
