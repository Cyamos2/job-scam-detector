// src/lib/events.ts
type Listener<T = any> = (payload: T) => void;

class TinyEvents {
  private map = new Map<string, Set<Listener>>();

  on<T = any>(event: string, cb: Listener<T>) {
    if (!this.map.has(event)) this.map.set(event, new Set());
    this.map.get(event)!.add(cb as Listener);
  }

  off<T = any>(event: string, cb: Listener<T>) {
    this.map.get(event)?.delete(cb as Listener);
  }

  emit<T = any>(event: string, payload: T) {
    const set = this.map.get(event);
    if (!set) return;
    for (const cb of Array.from(set)) {
      try { (cb as Listener<T>)(payload); } catch {}
    }
  }
}

export const appEvents = new TinyEvents();

/*
Usage:
  appEvents.emit("db:saved", { id })
  const handler = (p: { id: string }) => { ... }
  appEvents.on("db:saved", handler)
  appEvents.off("db:saved", handler)
*/