import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

const schema = defineSchema({
  ...authTables,

  users: defineTable({
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    image: v.optional(v.string()),
    emailVerificationTime: v.optional(v.number()),
    phoneVerificationTime: v.optional(v.number()),
    isAnonymous: v.optional(v.boolean()),
    avatarUrl: v.optional(v.string()),
  }),

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
    state: v.array(v.string()), // serialized game state
    chat: v.array(v.string()), // serialized chat messages
    createdAt: v.number(),
    public: v.boolean(),
    game: v.string(),
    completed: v.boolean(),
  }).index("by_room", ["room"]),
});

export default schema;
