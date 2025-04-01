import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const saveGame = mutation({
  args: {
    userId: v.id("users"),
    gameId: v.string(),
    moveNumber: v.number(),
    serializedState: v.string(),
    createdAt: v.number(),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("gameSaves", args);
  },
});