import { useEffect, useState } from "react";

// The current time, in the browser, refreshed every `intervalMs`. It starts from the time of the
// server (`serverNow`), so that the first render matches the page sent; then the offset between
// the two clocks is kept, so that a wrong clock on the visitor's computer does not open the room
// too early or too late in the page (the server decides anyway).
export function useNow(serverNow: string, intervalMs = 1000) {
  const [now, setNow] = useState(() => new Date(serverNow));
  useEffect(() => {
    const offset = new Date(serverNow).getTime() - Date.now();
    const tick = () => setNow(new Date(Date.now() + offset));
    tick();
    const timer = setInterval(tick, intervalMs);
    return () => clearInterval(timer);
  }, [serverNow, intervalMs]);
  return now;
}
