// src/lib/events.ts
import { EventEmitter } from "events";

/** App-wide event hub.
 *  Usage:
 *    appEvents.emit("db:saved", { id: string })
 *    appEvents.on("db:saved", (p) => { ... })
 */
export const appEvents = new EventEmitter();