import { RoomAuthGuard } from "@/features/room/containers/RoomAuthGuard";

export default async function RoomPage({ params }: { params: Promise<{ roomId: string }> }) {
  const { roomId } = await params;

  return <RoomAuthGuard roomId={roomId} />;
}
