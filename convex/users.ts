import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    
    const user = await ctx.db.get(userId);
    if (!user || !user.name || !user.email || !user.location) {
      return null; // Profile not complete
    }
    
    return user;
  },
});

export const getUserById = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.userId);
  },
});

export const createUserProfile = mutation({
  args: {
    name: v.string(),
    email: v.string(),
    bio: v.optional(v.string()),
    userType: v.union(v.literal("helper"), v.literal("seeker"), v.literal("both")),
    location: v.object({
      lat: v.number(),
      lng: v.number(),
      address: v.string(),
    }),
    skills: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const existingUser = await ctx.db.get(userId);
    if (existingUser && existingUser.name && existingUser.email) {
      throw new Error("User profile already exists");
    }

    // Update existing user record or create new one
    await ctx.db.patch(userId, {
      ...args,
      totalPoints: 0,
      rating: 5.0,
      reviewCount: 0,
      isActive: true,
    });

    return userId;
  },
});

export const updateUserProfile = mutation({
  args: {
    name: v.optional(v.string()),
    bio: v.optional(v.string()),
    userType: v.optional(v.union(v.literal("helper"), v.literal("seeker"), v.literal("both"))),
    location: v.optional(v.object({
      lat: v.number(),
      lng: v.number(),
      address: v.string(),
    })),
    skills: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const updates: any = {};
    Object.entries(args).forEach(([key, value]) => {
      if (value !== undefined) {
        updates[key] = value;
      }
    });

    await ctx.db.patch(userId, updates);
    return userId;
  },
});

export const getNearbyHelpers = query({
  args: {
    lat: v.number(),
    lng: v.number(),
    radiusKm: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const radiusKm = args.radiusKm || 10;
    const latRange = radiusKm / 111; // Rough conversion: 1 degree lat ≈ 111km
    const lngRange = radiusKm / (111 * Math.cos(args.lat * Math.PI / 180));

    const helpers = await ctx.db
      .query("users")
      .withIndex("by_user_type", (q) => q.eq("userType", "helper"))
      .filter((q) => 
        q.and(
          q.gte(q.field("location.lat"), args.lat - latRange),
          q.lte(q.field("location.lat"), args.lat + latRange),
          q.gte(q.field("location.lng"), args.lng - lngRange),
          q.lte(q.field("location.lng"), args.lng + lngRange),
          q.eq(q.field("isActive"), true)
        )
      )
      .collect();

    return helpers;
  },
});
