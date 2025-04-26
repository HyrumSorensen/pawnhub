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


  games: defineTable({
    room: v.string(),
    player1: v.id("users"),
    player2: v.optional(v.id("users")),
    player3: v.optional(v.id("users")), 
    player4: v.optional(v.id("users")),
    state: v.array(v.string()), // serialized game state
    chat: v.array(v.string()), // serialized chat messages
    createdAt: v.number(),
    public: v.boolean(),
    game: v.string(),
    completed: v.boolean(),
    open: v.boolean()
  }).index("by_room", ["room"]),
  pokerGroups: defineTable({
    name: v.string(),
    admin: v.id("users"),
    createdAt: v.number(),
    description: v.optional(v.string()),
    groupCode: v.string(),
  }),
  
  
  pokerGroupMembers: defineTable({
    groupId: v.id("pokerGroups"),
    userId: v.id("users"),
    role: v.optional(v.union(v.literal("admin"), v.literal("member"))),
    joinedAt: v.number(),
  
    chipCounts: v.optional(
      v.record(v.id("pokerChipTypes"), v.number())
    ),
  
    distributedChipCounts: v.optional(
      v.record(v.id("pokerChipTypes"), v.number())
    ),
  }).index("by_group", ["groupId"])
  .index("by_user", ["userId"]),
  
  
  
  pokerChipTypes: defineTable({
    groupId: v.id("pokerGroups"),
    name: v.string(),
    value: v.number(),
    color: v.optional(v.string()),
    createdAt: v.number(),
  }).index("by_group", ["groupId"]),
  
  chipTransactions: defineTable({
    // The poker group where the transaction occurred.
    groupId: v.id("pokerGroups"),
    // The user whose chip count changed.
    userId: v.id("users"),
    // Reference to the chip type for this transaction.
    chipTypeId: v.id("pokerChipTypes"),
    transactionType: v.string(),
    amount: v.number(),
    timestamp: v.number(),
    note: v.optional(v.string()),
  }).index("by_group_user", ["groupId", "userId"]),

  gameStats: defineTable({
    userId: v.id("users"),
    game: v.string(),       // "mancala", "quoridor", "tic-tac-toe", etc.
    gameId: v.id("games"),   // Reference to the specific game session
    wins: v.number(),
    losses: v.number(),
    gamesPlayed: v.number(),
    winRate: v.optional(v.number()),
    rankPoints: v.optional(v.number()),
  
    // Optional extras for future-proofing:
    highestScore: v.optional(v.number()),
    fastestWinTime: v.optional(v.number()), // in seconds
  }).index("by_user_game", ["userId", "game"])
});







export default schema;
