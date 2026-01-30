// src/lib/events.ts
type Listener<T = unknown> = (payload: T) => void;

class TinyEvents {
  private map = new Map<string, Set<Listener<unknown>>>();

  on<T = unknown>(event: string, cb: Listener<T>) {
    if (!this.map.has(event)) this.map.set(event, new Set());
    (this.map.get(event) as Set<Listener<unknown>>).add(cb as unknown as Listener<unknown>);
  }

  off<T = unknown>(event: string, cb: Listener<T>) {
    (this.map.get(event) as Set<Listener<unknown>> | undefined)?.delete(cb as unknown as Listener<unknown>);
  }

  emit<T = unknown>(event: string, payload: T) {
    const set = this.map.get(event);
    if (!set) return;
    for (const cb of Array.from(set)) {
      try { (cb as unknown as Listener<T>)(payload); } catch {}
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