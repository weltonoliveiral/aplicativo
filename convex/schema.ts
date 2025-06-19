import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

const applicationTables = {
  users: defineTable({
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    bio: v.optional(v.string()),
    profileImage: v.optional(v.id("_storage")),
    userType: v.optional(v.union(v.literal("helper"), v.literal("seeker"), v.literal("both"))),
    location: v.optional(v.object({
      lat: v.number(),
      lng: v.number(),
      address: v.string(),
    })),
    skills: v.optional(v.array(v.string())),
    totalPoints: v.optional(v.number()),
    rating: v.optional(v.number()),
    reviewCount: v.optional(v.number()),
    isActive: v.optional(v.boolean()),
    isAnonymous: v.optional(v.boolean()),
  })
    .index("by_email", ["email"])
    .index("by_location", ["location.lat", "location.lng"])
    .index("by_user_type", ["userType"]),

  tasks: defineTable({
    title: v.string(),
    description: v.string(),
    category: v.union(
      v.literal("household"),
      v.literal("pets"),
      v.literal("elderly"),
      v.literal("digital"),
      v.literal("errands"),
      v.literal("other")
    ),
    seekerId: v.id("users"),
    helperId: v.optional(v.id("users")),
    location: v.object({
      lat: v.number(),
      lng: v.number(),
      address: v.string(),
    }),
    scheduledTime: v.optional(v.number()),
    rewardPoints: v.number(),
    status: v.union(
      v.literal("open"),
      v.literal("assigned"),
      v.literal("in_progress"),
      v.literal("completed"),
      v.literal("cancelled")
    ),
    applicants: v.array(v.id("users")),
    completedAt: v.optional(v.number()),
  })
    .index("by_seeker", ["seekerId"])
    .index("by_helper", ["helperId"])
    .index("by_status", ["status"])
    .index("by_category", ["category"])
    .index("by_location", ["location.lat", "location.lng"]),

  messages: defineTable({
    taskId: v.id("tasks"),
    senderId: v.id("users"),
    receiverId: v.id("users"),
    content: v.string(),
    messageType: v.union(v.literal("text"), v.literal("system")),
    isRead: v.boolean(),
  })
    .index("by_task", ["taskId"])
    .index("by_sender", ["senderId"])
    .index("by_receiver", ["receiverId"]),

  reviews: defineTable({
    taskId: v.id("tasks"),
    reviewerId: v.id("users"),
    revieweeId: v.id("users"),
    rating: v.number(),
    comment: v.optional(v.string()),
    reviewType: v.union(v.literal("helper_to_seeker"), v.literal("seeker_to_helper")),
  })
    .index("by_task", ["taskId"])
    .index("by_reviewee", ["revieweeId"])
    .index("by_reviewer", ["reviewerId"]),

  points: defineTable({
    userId: v.id("users"),
    taskId: v.id("tasks"),
    points: v.number(),
    reason: v.string(),
    awardedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_task", ["taskId"]),
};

export default defineSchema({
  ...authTables,
  ...applicationTables,
});
