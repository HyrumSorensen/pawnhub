import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

const schema = defineSchema({
  ...authTables,

  gameSaves: defineTable({
    userId: v.id("users"),
    gameId: v.string(),
    moveNumber: v.number(),
    serializedState: v.string(),
    createdAt: v.number(), // UNIX timestamp
  }).index("by_gameId_and_move", ["gameId", "moveNumber"]),
});

export default schema;