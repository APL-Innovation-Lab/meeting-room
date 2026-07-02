import { TailwindConfig } from "react-email";

export const emailTailwindConfig: TailwindConfig = {
    theme: {
        extend: {
            colors: {
                "apl-green": "#1e6f98",
            },
            fontFamily: {
                sans: ["Source Sans Pro", "Arial", "sans-serif"],
            },
        },
    },
    darkMode: "media",
};
