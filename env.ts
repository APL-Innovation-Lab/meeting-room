import { defineConfig } from "@julr/vite-plugin-validate-env";
import { z } from "zod";

export default defineConfig({
    validator: "zod",
    schema: {
        VITE_APP_MAPBOX_TOKEN: z.string().describe("Mapbox API key"),
    },
});
