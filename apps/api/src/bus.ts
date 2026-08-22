import { EventEmitter } from "node:events";

type GenomeEvent =
  | { type: "mutation"; payload: Record<string, unknown> }
  | { type: "reaction"; payload: Record<string, unknown> }
  | { type: "genome"; payload: Record<string, unknown> };

class GenomeBus extends EventEmitter {
  emitGenome(event: GenomeEvent): void {
    super.emit("genome", event);
  }

  onGenome(listener: (event: GenomeEvent) => void): () => void {
    const handler = (event: GenomeEvent): void => listener(event);
    super.on("genome", handler);
    return () => super.off("genome", handler);
  }
}

export const bus = new GenomeBus();
