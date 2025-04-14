import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

/* ========================================================
   Poker Group Operations
======================================================== */

/**
 * Create a new poker group. The creator becomes the admin.
 */
export const createPokerGroup = mutation({
    args: {
      name: v.string(),
      admin: v.id("users"),
      createdAt: v.number(),
      groupCode: v.string(),
      description: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
      // Optional: check if groupCode already exists
      const existing = await ctx.db
        .query("pokerGroups")
        .filter((q) => q.eq(q.field("groupCode"), args.groupCode))
        .first();
  
      if (existing) {
        throw new Error("Group code already in use");
      }
  
      const groupId = await ctx.db.insert("pokerGroups", {
        name: args.name,
        admin: args.admin,
        createdAt: args.createdAt,
        groupCode: args.groupCode,
        description: args.description,
      });
  
      return groupId;
    },
  });

  export const getGroupByCode = query({
    args: {
      groupCode: v.string(),
    },
    handler: async (ctx, { groupCode }) => {
      const group = await ctx.db
        .query("pokerGroups")
        .filter((q) => q.eq(q.field("groupCode"), groupCode))
        .first();
  
      return group ?? null;
    },
  });
  
  

/**
 * Get a poker group's details by its ID.
 */
export const getPokerGroup = query({
    args: {
      groupId: v.id("pokerGroups"),
    },
    handler: async (ctx, { groupId }) => {
      return await ctx.db.get(groupId as any);
    },
  });
  
  

/**
 * List all poker groups.
 */
export const listPokerGroups = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("pokerGroups" as any).collect();
  },
});

/* ========================================================
   Poker Group Membership Operations
======================================================== */

/**
 * Add a user as a member of a poker group.
 * Default role is "member". (Valid roles are "admin" or "member".)
 */
export const joinPokerGroup = mutation({
  args: {
    groupId: v.id("pokerGroups"),
    userId: v.id("users"),
    joinedAt: v.number(),
  },
  handler: async (ctx, { groupId, userId, joinedAt }) => {
    // Check if the user is already a member of the group.
    const existing = await ctx.db
      .query("pokerGroupMembers" as any)
      .filter((q) =>
        q.and(q.eq(q.field("groupId"), groupId), q.eq(q.field("userId"), userId))
      )
      .first();

    if (existing) {
      return { error: "User already a member of this group" };
    }

    const memberId = await ctx.db.insert("pokerGroupMembers" as any, {
      groupId,
      userId,
      // Use a union of literals in the schema so valid roles are "admin" or "member"
      role: "member",
      joinedAt,
    });
    return memberId;
  },
});

/**
 * List all members for a given poker group.
 */
export const listPokerGroupMembers = query({
  args: {
    groupId: v.id("pokerGroups"),
  },
  handler: async (ctx, { groupId }) => {
    return await ctx.db
      .query("pokerGroupMembers" as any)
      .filter((q) => q.eq(q.field("groupId"), groupId))
      .collect();
  },
});

/**
 * Remove a user from a poker group.
 */
export const removePokerGroupMember = mutation({
  args: {
    groupId: v.id("pokerGroups"),
    userId: v.id("users"),
  },
  handler: async (ctx, { groupId, userId }) => {
    const member = await ctx.db
      .query("pokerGroupMembers" as any)
      .filter((q) =>
        q.and(q.eq(q.field("groupId"), groupId), q.eq(q.field("userId"), userId))
      )
      .first();

    if (!member) {
      return { error: "Member not found in this group" };
    }

    await ctx.db.delete(member._id);
    return { success: true };
  },
});

/* ========================================================
   Chip Type Operations
======================================================== */

/**
 * Create a new chip type for a poker group.
 * Defines the chip’s name, value, and optionally a color.
 */
export const addChipType = mutation({
  args: {
    groupId: v.id("pokerGroups"),
    name: v.string(),
    value: v.number(),
    createdAt: v.number(),
    color: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const chipTypeId = await ctx.db.insert("pokerChipTypes" as any, {
      groupId: args.groupId,
      name: args.name,
      value: args.value,
      createdAt: args.createdAt,
      color: args.color,
    });
    return chipTypeId;
  },
});

/**
 * List all chip types for a given poker group.
 */
export const listChipTypes = query({
  args: {
    groupId: v.id("pokerGroups"),
  },
  handler: async (ctx, { groupId }) => {
    return await ctx.db
      .query("pokerChipTypes" as any)
      .filter((q) => q.eq(q.field("groupId"), groupId))
      .collect();
  },
});

/* ========================================================
   Chip Transaction Operations
======================================================== */

/**
 * Record a chip transaction.
 * Transactions can be wins, losses, buy-ins, or adjustments.
 */
export const recordChipTransaction = mutation({
  args: {
    groupId: v.id("pokerGroups"),
    userId: v.id("users"),
    chipTypeId: v.id("pokerChipTypes"),
    transactionType: v.string(),
    amount: v.number(),
    timestamp: v.number(),
    note: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const transactionId = await ctx.db.insert("chipTransactions" as any, {
      groupId: args.groupId,
      userId: args.userId,
      chipTypeId: args.chipTypeId,
      transactionType: args.transactionType,
      amount: args.amount,
      timestamp: args.timestamp,
      note: args.note,
    });
    return transactionId;
  },
});

/**
 * List chip transactions for a group.
 * Optionally filter by a specific user.
 */
export const listChipTransactions = query({
  args: {
    groupId: v.id("pokerGroups"),
    userId: v.optional(v.id("users")),
  },
  handler: async (ctx, { groupId, userId }) => {
    let chipTxQuery = ctx.db
      .query("chipTransactions" as any)
      .filter((q) => q.eq(q.field("groupId"), groupId));

    if (userId) {
      chipTxQuery = chipTxQuery.filter((q) =>
        q.eq(q.field("userId"), userId)
      );
    }
    return await chipTxQuery.collect();
  },
});

export const updateMemberChipCount = mutation({
    args: {
      groupId: v.id("pokerGroups"),
      userId: v.id("users"),
      chipTypeId: v.id("pokerChipTypes"),
      amount: v.number(), // positive or negative
    },
    handler: async (ctx, { groupId, userId, chipTypeId, amount }) => {
      const member = await ctx.db
        .query("pokerGroupMembers")
        .filter((q) =>
          q.and(
            q.eq(q.field("groupId"), groupId),
            q.eq(q.field("userId"), userId)
          )
        )
        .first();
  
      if (!member) {
        throw new Error("Member not found in group.");
      }
  
      const currentCounts = member.chipCounts ?? {};
      const currentAmount = currentCounts[chipTypeId] ?? 0;
      const newAmount = currentAmount + amount;
  
      const updatedCounts = {
        ...currentCounts,
        [chipTypeId]: newAmount,
      };
  
      await ctx.db.patch(member._id, {
        chipCounts: updatedCounts,
      });
  
      return updatedCounts;
    },
  });
  

/**
 * Get the current chip total for a user in a poker group.
 * Calculated by summing their transactions.
 */
export const getUserChipTotal = query({
  args: {
    groupId: v.id("pokerGroups"),
    userId: v.id("users"),
  },
  handler: async (ctx, { groupId, userId }) => {
    const transactions = await ctx.db
      .query("chipTransactions" as any)
      .filter((q) =>
        q.and(q.eq(q.field("groupId"), groupId), q.eq(q.field("userId"), userId))
      )
      .collect();

    const total = transactions.reduce(
      (sum: number, tx: { amount: number }) => sum + tx.amount,
      0
    );
    return total;
  },
});

export const getMemberChipCounts = query({
    args: {
      groupId: v.id("pokerGroups"),
      userId: v.id("users"),
    },
    handler: async (ctx, { groupId, userId }) => {
      const member = await ctx.db
        .query("pokerGroupMembers")
        .filter((q) =>
          q.and(
            q.eq(q.field("groupId"), groupId),
            q.eq(q.field("userId"), userId)
          )
        )
        .first();
  
      if (!member) {
        return null;
      }
  
      return member.chipCounts ?? {};
    },
  });
  
