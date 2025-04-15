// convex/users.ts
import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { Id } from "@/convex/_generated/dataModel";
export const getCurrentUserId = query({
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    return userId;
  },
});

export const getUserById = query({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("_id"), args.userId))
      .first();

    return user;
  },
});

export const updateUserProfile = mutation({
  args: {
    userId: v.string(),
    name: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("_id"), args.userId))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    await ctx.db.patch(user._id, {
      name: args.name ?? user.name,
      avatarUrl: args.avatarUrl ?? user.avatarUrl,
    });
  },
});

export const getUsersByIds = query({
  args: {
    userIds: v.array(v.id("users")),
  },
  handler: async (ctx, { userIds }) => {
    const users = await Promise.all(
      userIds.map(async (id) => {
        const user = await ctx.db.get(id);
        return user ? { _id: id, name: user.name ?? "Unnamed" } : null;
      })
    );

    return users.filter(
      (u): u is { _id: Id<"users">; name: string } => u !== null
    );
  },
});
