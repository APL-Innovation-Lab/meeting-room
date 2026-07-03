import { reactRouter } from "@react-router/dev/vite";
import babel from "@rolldown/plugin-babel";
import tailwindcss from "@tailwindcss/vite";
import { varlockVitePlugin as varlock } from "@varlock/vite-integration";
import { reactCompilerPreset } from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import devtoolsJson from "vite-plugin-devtools-json";

export default defineConfig({
    plugins: [
        varlock(),
        tailwindcss(),
        reactRouter(),
        babel({ presets: [reactCompilerPreset()] }),
        devtoolsJson(),
    ],
    resolve: { tsconfigPaths: true },
});
