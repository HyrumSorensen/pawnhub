import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

const schema = defineSchema({
  ...authTables,

  gameSaves: defineTable({
    userId: v.id("users"),
    gameId: v.string(),
    moveHistory: v.array(v.string()), // Array of serialized game states
    createdAt: v.number(), // UNIX timestamp
  }).index("by_gameId", ["gameId"]),

  games: defineTable({
    room: v.string(),
    player1: v.id("users"),
    player2: v.optional(v.id("users")),
    state: v.string(),
    createdAt: v.number(),
  }).index("by_room", ["room"]),
});

export default schema;
