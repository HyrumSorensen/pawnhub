// convex/users.ts
import { query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const getCurrentUserId = query({
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    return userId;
  },
});