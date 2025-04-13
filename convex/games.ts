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
      chat: [],
      createdAt: args.createdAt,
      public: false,
      game: "quoridor",
      completed: false,
      open: true,
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
    const game = await ctx.db
      .query("games")
      .filter((q) => q.eq(q.field("room"), args.room))
      .first();

    if (!game) {
      return { error: "Game not found" };
    }

    await ctx.db.patch(game._id, {
      state: [...game.state, args.state],
    });
  },
});

export const getGameState = query({
  args: {
    room: v.string(),
  },
  handler: async (ctx, args) => {
    const game = await ctx.db
      .query("games")
      .filter((q) => q.eq(q.field("room"), args.room))
      .first();

    return game?.state;
  },
});

export const getGame = query({
  args: {
    room: v.string(),
  },
  handler: async (ctx, args) => {
    const game = await ctx.db
      .query("games")
      .filter((q) => q.eq(q.field("room"), args.room))
      .first();

    if (!game) {
      return null;
    }

    return {
      player1: game.player1,
      player2: game.player2,
      player3: game.player3,
      player4: game.player4,
      open: game.open,
    };
  },
});

export const setGameCompleted = mutation({
  args: {
    room: v.string(),
  },
  handler: async (ctx, args) => {
    const game = await ctx.db
      .query("games")
      .filter((q) => q.eq(q.field("room"), args.room))
      .first();

    if (!game) {
      return { error: "Game not found" };
    }

    await ctx.db.patch(game._id, {
      completed: true,
    });
  },
});

export const getGameChat = query({
  args: {
    room: v.string(),
  },
  handler: async (ctx, args) => {
    const game = await ctx.db
      .query("games")
      .filter((q) => q.eq(q.field("room"), args.room))
      .first();

    return game?.chat ?? [];
  },
});

export const addGameChat = mutation({
  args: {
    room: v.string(),
    player: v.id("users"),
    name: v.string(),
    avatarUrl: v.optional(v.string()),
    message: v.string(),
  },
  handler: async (ctx, args) => {
    const game = await ctx.db
      .query("games")
      .filter((q) => q.eq(q.field("room"), args.room))
      .first();

    if (!game) {
      throw new Error("Game not found");
    }

    const newChatEntry = JSON.stringify({
      player: args.player,
      message: args.message,
      name: args.name,
      avatarUrl: args.avatarUrl ?? "",
      createdAt: Date.now(),
    });

    await ctx.db.patch(game._id, {
      chat: [...game.chat, newChatEntry],
    });
  },
});

export const closeGame = mutation({
  args: {
    room: v.string(),
  },
  handler: async (ctx, args) => {
    const game = await ctx.db
      .query("games")
      .filter((q) => q.eq(q.field("room"), args.room))
      .first();

    if (!game) {
      return { error: "Game not found" };
    }

    await ctx.db.patch(game._id, {
      open: false,
    });
  },
});
