import { ValidateEnv as env } from "@julr/vite-plugin-validate-env";
import { reactRouter } from "@react-router/dev/vite";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

// the following imports are used for calendar export functionality
import react from "@vitejs/plugin-react";
import { generateICS } from "./app/utils/calendar";

export default defineConfig({
    plugins: [
        reactRouter(),
        tsconfigPaths(),
        react(),
        env(),
        {
            name: "calendar-ics-endpoint",
            configureServer(server) {
                //test server
                server.middlewares.use("/calendar.ics", (req, res) => {
                    const url = new URL(req.url || "", "http://localhost:5173");
                    const title = url.searchParams.get("title") || "Event";
                    const description = url.searchParams.get("description") || "";
                    const location = url.searchParams.get("location") || "";
                    const start = new Date(url.searchParams.get("start") || "");
                    const end = new Date(url.searchParams.get("end") || "");

                    // handle invalid or empty start/end time
                    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
                        res.statusCode = 400;
                        res.end("Invalid start or end time given for the reservation.");

                        return;
                    }
                    // generate .ics file using above params
                    const ics = generateICS({ title, description, location, start, end });

                    res.setHeader("Content-Type", "text/calendar");
                    res.setHeader("Content-Disposition", "attachment; filename=event.ics");
                    res.end(ics);
                });
            },
        },
    ],
});
