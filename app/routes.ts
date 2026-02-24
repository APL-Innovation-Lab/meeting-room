import { createRoutes, RouteConfig } from "@withsprinkles/react-router-route-map";
import { routes } from "./route-map";

const config = await createRoutes(routes);
export default config[RouteConfig];
