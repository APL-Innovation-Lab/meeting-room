import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { varlockVitePlugin } from "@varlock/vite-integration";
import { defineConfig } from "vite";
import devtoolsJson from "vite-plugin-devtools-json";

export default defineConfig({
    // varlock runs first so it loads + validates .env (against .env.schema) and
    // injects resolved values before the framework plugins evaluate their config.
    plugins: [varlockVitePlugin(), tailwindcss(), reactRouter(), devtoolsJson()],
    resolve: { tsconfigPaths: true },
});
