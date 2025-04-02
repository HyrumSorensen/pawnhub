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
});

export default schema;
