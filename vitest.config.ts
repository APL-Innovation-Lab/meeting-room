import { defineConfig } from "vitest/config";

// Standalone Vitest config (intentionally without the React Router Vite plugin) for unit-testing
// pure domain logic. setupFiles pins the timezone so server-side date logic is exercised under a
// west-of-UTC zone (the deployment reality for an Austin app) rather than the runner's local zone.
export default defineConfig({
    test: {
        environment: "node",
        setupFiles: ["./vitest.setup.ts"],
    },
    resolve: {
        tsconfigPaths: true,
    },
});
