import type { Config } from "tailwindcss";
import uswds from "./tailwindcss-uswds/plugin";

export default {
    content: [
        "./app/**/*.tsx",
        // TODO: Figure out how to only scan components we use,
        // so Tailwind can purge our styles better
        "./node_modules/@trussworks/react-uswds/lib/index.js",
    ],
    plugins: [uswds()],
    darkMode: "media",
} satisfies Config;
