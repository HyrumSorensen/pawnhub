// convex/gameSaves.ts
import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const initializeGame = mutation({
  args: {
    userId: v.id("users"),
    gameId: v.string(),
    initialState: v.string(),
    createdAt: v.number(),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("gameSaves", {
      userId: args.userId,
      gameId: args.gameId,
      moveHistory: [args.initialState],
      createdAt: args.createdAt,
    });
  },
});

export const appendGameState = mutation({
  args: {
    gameId: v.string(),
    newState: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("gameSaves")
      .filter((q) => q.eq(q.field("gameId"), args.gameId))
      .first();

    if (!existing) {
      throw new Error(`Game with ID ${args.gameId} not found`);
    }

    await ctx.db.patch(existing._id, {
      moveHistory: [...existing.moveHistory, args.newState],
    });
  },
});
