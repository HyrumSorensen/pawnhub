import { query } from "./_generated/server";
import { v } from "convex/values";

export const getMyRecentGames = query({
  args: {
    userId: v.id("users"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 10;

    const myGames = await ctx.db
      .query("games")
      .filter((q) =>
        q.or(
          q.eq(q.field("player1"), args.userId),
          q.eq(q.field("player2"), args.userId),
          q.eq(q.field("player3"), args.userId),
          q.eq(q.field("player4"), args.userId),
        )
      )
      .collect();

    // Sort by most recently created
    const sorted = myGames.sort((a, b) => b.createdAt - a.createdAt);

    return sorted.slice(0, limit).map((game) => ({
      gameId: game._id,
      game: game.game,
      createdAt: game.createdAt,
      players: [game.player1, game.player2, game.player3, game.player4].filter(Boolean),
      completed: game.completed,
    }));
  },
});

// (Optional) Get specific game details by ID
export const getGameInfoById = query({
  args: {
    gameId: v.id("games"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.gameId);
  },
});
