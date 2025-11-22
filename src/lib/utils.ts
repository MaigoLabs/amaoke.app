import type { NeteaseSong } from "../lib/types";

export const artistAndAlbum = (song: NeteaseSong) => `${song.ar.map(it => it.name).join(', ')} - ${song.al.name}`

/**
 * Waits for a condition to become true.
 * @param condition A function that returns a boolean or a Promise<boolean>.
 * @param options Optional configuration for interval and timeout.
 * @returns A Promise that resolves when the condition becomes true.
 * @throws Error if the timeout is reached.
 */
export async function waitFor(
  condition: () => boolean | Promise<boolean>,
  options: { interval?: number; timeout?: number } = {}
): Promise<void> {
  const { interval = 100, timeout = 5000 } = options;
  const startTime = Date.now();

  while (true) {
    if (await condition()) return
    if (Date.now() - startTime > timeout) throw new Error(`Timeout of ${timeout}ms waiting for condition`)
    await new Promise((resolve) => setTimeout(resolve, interval))
  }
}
