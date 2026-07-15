import { useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";

type JobUpdate = { imageId: string; status: string; resultUrl?: string };

export function useJobSocket(onUpdate: (update: JobUpdate) => void) {
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("glyph_token");
    if (!token) return;

    const url = (import.meta.env.VITE_API_URL || "http://localhost:4000/api").replace("/api", "");
    const socket = io(url);
    socketRef.current = socket;

    socket.emit("auth", token);
    socket.on("job:update", onUpdate);

    return () => {
      socket.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
