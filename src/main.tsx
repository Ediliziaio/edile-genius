import { ViteReactSSG } from "vite-react-ssg";
import { routes } from "./App";
import "./index.css";

// Entry unificato SSG + client: al build vite-react-ssg pre-renderizza in HTML
// statico le rotte selezionate in `ssgOptions.includedRoutes` (vite.config.ts);
// nel browser idrata la stessa app. Le rotte auth/app restano client-only.
export const createRoot = ViteReactSSG({ routes });
