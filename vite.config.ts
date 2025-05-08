import { ValidateEnv as env } from "@julr/vite-plugin-validate-env";
import { reactRouter } from "@react-router/dev/vite";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
    plugins: [reactRouter(), env(), tsconfigPaths()],
});
