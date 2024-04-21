"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.timeout = void 0;
/**
 * Wait the specified number of milliseconds.
 *
 * @param duration - The number of milliseconds to wait.
 * @returns A promise that resolves after the specified amount of time.
 */
async function timeout(duration) {
    return new Promise((resolve) => setTimeout(resolve, duration));
}
exports.timeout = timeout;
//# sourceMappingURL=timeout.js.map