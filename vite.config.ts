import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import devtoolsJson from "vite-plugin-devtools-json";

export default defineConfig({
    resolve: {
        tsconfigPaths: true,
    },
    // tailwindcss() must come before reactRouter() per the Tailwind v4 Vite guide.
    plugins: [tailwindcss(), reactRouter(), devtoolsJson()],
});
