// import { ValidateEnv as env } from "@julr/vite-plugin-validate-env";
import { reactRouter } from "@react-router/dev/vite";
import { defineConfig } from "vite";
import devtoolsJson from "vite-plugin-devtools-json";

export default defineConfig({
    resolve: {
        tsconfigPaths: true,
    },
    plugins: [reactRouter(), devtoolsJson()],
});
