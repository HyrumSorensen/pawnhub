import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const createGame = mutation({
  args: {
    room: v.string(),
    player1: v.id("users"),
    initialState: v.string(),
    createdAt: v.number(),
  },
  handler: async (ctx, args) => {
    const existingGame = await ctx.db
      .query("games")
      .filter((q) => q.eq(q.field("room"), args.room))
      .first();

    if (existingGame) {
      return JSON.stringify({
        error: "A game with this room ID already exists",
      });
    }

    await ctx.db.insert("games", {
      room: args.room,
      player1: args.player1,
      state: [args.initialState],
      createdAt: args.createdAt,
      public: false,
      game: "quoridor",
      completed: false,
    });
  },
});

export const joinGame = mutation({
  args: {
    room: v.string(),
    player: v.id("users"),
  },
  handler: async (ctx, args) => {
    const existingGame = await ctx.db
      .query("games")
      .filter((q) => q.eq(q.field("room"), args.room))
      .first();

    if (!existingGame) {
      return { error: "Game not found" };
    }

    if (
      existingGame.player1 === args.player ||
      existingGame.player2 === args.player
    ) {
      return { error: "Player already in game" };
    }

    await ctx.db.patch(existingGame._id, {
      player2: args.player,
    });
  },
});

export const updateGameState = mutation({
  args: {
    room: v.string(),
    state: v.string(),
  },
  handler: async (ctx, args) => {
    const existingGame = await ctx.db
      .query("games")
      .filter((q) => q.eq(q.field("room"), args.room))
      .first();

    if (!existingGame) {
      return { error: "Game not found" };
    }

    await ctx.db.patch(existingGame._id, {
      state: [...existingGame.state, args.state],
    });
  },
});

export const getGameState = query({
  args: {
    room: v.string(),
  },
  handler: async (ctx, args) => {
    const existingGame = await ctx.db
      .query("games")
      .filter((q) => q.eq(q.field("room"), args.room))
      .first();

    return existingGame?.state;
  },
});

export const setGameCompleted = mutation({
  args: {
    room: v.string(),
  },
  handler: async (ctx, args) => {
    const existingGame = await ctx.db
      .query("games")
      .filter((q) => q.eq(q.field("room"), args.room))
      .first();

    if (!existingGame) {
      return { error: "Game not found" };
    }

    await ctx.db.patch(existingGame._id, {
      completed: true,
    });
  },
});
