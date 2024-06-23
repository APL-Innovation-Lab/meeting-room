import type { Config } from "tailwindcss";
import uswds from "./tailwindcss-uswds/plugin";

export default {
    content: ["./app/**/*.tsx"],
    plugins: [uswds()],
    darkMode: "media",
} satisfies Config;
