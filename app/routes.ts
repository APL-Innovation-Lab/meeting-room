// import { flatRoutes } from "@react-router/fs-routes";

// export default flatRoutes();

import { createRoutes, RouteConfig } from "@withsprinkles/react-router-route-map";
import { routes } from "./route-map";

export default (await createRoutes(routes))[RouteConfig];
