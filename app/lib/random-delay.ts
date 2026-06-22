import { setTimeout as delay } from "node:timers/promises";

/**
 * Generates a random delay up to a given maximum threshold.
 * @param maxThreshold - The maximum delay in milliseconds.
 * @default 2000
 */
export async function randomDelay(maxThreshold = 2000): Promise<void> {
    const randomTime = Math.floor(Math.random() * maxThreshold);
    await delay(randomTime);
}
