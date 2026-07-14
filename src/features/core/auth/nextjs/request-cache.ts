import { cache } from "react";

import { getAuth } from "./actions";

// React cache() dedupes within a single request/render pass, so layouts and
// providers that both need the auth state share one session + DB lookup.
// Lives outside the "use server" action files, which may only export actions.
export const getCachedAuth = cache(getAuth);
