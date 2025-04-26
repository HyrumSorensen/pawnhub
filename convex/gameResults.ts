import { mutation, query } from "./_generated/server";
import { v } from "convex/values";


export const recordGameResult = mutation({
    args: {
      userId: v.id("users"),
      game: v.string(),
      gameId: v.id("games"),
      won: v.boolean(),
    },
    handler: async (ctx, args) => {
      const stats = await ctx.db
        .query("gameStats")
        .filter((q) => q.and(
          q.eq(q.field("userId"), args.userId),
          q.eq(q.field("game"), args.game),
          q.eq(q.field("gameId"), args.gameId)
        ))
        .first();
  
      if (!stats) {
        await ctx.db.insert("gameStats", {
          userId: args.userId,
          game: args.game,
          gameId: args.gameId,
          wins: args.won ? 1 : 0,
          losses: args.won ? 0 : 1,
          gamesPlayed: 1,
          winRate: args.won ? 100 : 0,
          rankPoints: args.won ? 10 : 0,
        });
      } else {
        const newWins = stats.wins + (args.won ? 1 : 0);
        const newLosses = stats.losses + (args.won ? 0 : 1);
        const newGames = stats.gamesPlayed + 1;
        const winRate = (newWins / newGames) * 100;
        const newPoints = (stats.rankPoints ?? 0) + (args.won ? 10 : 0);

        await ctx.db.patch(stats._id, {
          wins: newWins,
          losses: newLosses,
          gamesPlayed: newGames,
          winRate: winRate,
          rankPoints: newPoints,
        });
      }
    },
  });
  

  export const getTopPlayersForGame = query({
    args: {
      game: v.string(),
      limit: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
      const limit = args.limit ?? 10;
      const allStats = await ctx.db
        .query("gameStats")
        .filter((q) => q.eq(q.field("game"), args.game))
        .collect();
  
      const sorted = allStats.sort((a, b) => (b.rankPoints ?? 0) - (a.rankPoints ?? 0));
  
      return sorted.slice(0, limit);
    },
  });
  
  export const getMyStatsForGame = query({
    args: {
      userId: v.id("users"),
      game: v.string(),
    },
    handler: async (ctx, args) => {
      return await ctx.db
        .query("gameStats")
        .filter((q) =>
          q.and(
            q.eq(q.field("userId"), args.userId),
            q.eq(q.field("game"), args.game)
          )
        )
        .first();
    },
  });
  
  // ⬇️ New: all stats across all games
  export const getAllMyStats = query({
    args: {
      userId: v.id("users"),
    },
    handler: async (ctx, args) => {
      return await ctx.db
        .query("gameStats")
        .filter((q) => q.eq(q.field("userId"), args.userId))
        .collect();
    },
  });