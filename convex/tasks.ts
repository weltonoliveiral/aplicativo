import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const createTask = mutation({
  args: {
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
    location: v.object({
      lat: v.number(),
      lng: v.number(),
      address: v.string(),
    }),
    scheduledTime: v.optional(v.number()),
    rewardPoints: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const taskId = await ctx.db.insert("tasks", {
      ...args,
      seekerId: userId,
      status: "open",
      applicants: [],
    });

    return taskId;
  },
});

export const getNearbyTasks = query({
  args: {
    lat: v.number(),
    lng: v.number(),
    radiusKm: v.optional(v.number()),
    category: v.optional(v.union(
      v.literal("household"),
      v.literal("pets"),
      v.literal("elderly"),
      v.literal("digital"),
      v.literal("errands"),
      v.literal("other")
    )),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    const radiusKm = args.radiusKm || 10;
    const latRange = radiusKm / 111;
    const lngRange = radiusKm / (111 * Math.cos(args.lat * Math.PI / 180));

    let query = ctx.db
      .query("tasks")
      .withIndex("by_status", (q) => q.eq("status", "open"))
      .filter((q) => 
        q.and(
          q.gte(q.field("location.lat"), args.lat - latRange),
          q.lte(q.field("location.lat"), args.lat + latRange),
          q.gte(q.field("location.lng"), args.lng - lngRange),
          q.lte(q.field("location.lng"), args.lng + lngRange),
          userId ? q.neq(q.field("seekerId"), userId) : true
        )
      );

    if (args.category) {
      query = query.filter((q) => q.eq(q.field("category"), args.category));
    }

    const tasks = await query.collect();

    // Get seeker info for each task
    const tasksWithSeekers = await Promise.all(
      tasks.map(async (task) => {
        const seeker = await ctx.db.get(task.seekerId);
        return {
          ...task,
          seeker: seeker ? {
            name: seeker.name || "Unknown",
            rating: seeker.rating || 5.0,
            reviewCount: seeker.reviewCount || 0,
          } : null,
        };
      })
    );

    return tasksWithSeekers;
  },
});

export const getMyTasks = query({
  args: {
    type: v.union(v.literal("posted"), v.literal("helping")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    if (args.type === "posted") {
      const tasks = await ctx.db
        .query("tasks")
        .withIndex("by_seeker", (q) => q.eq("seekerId", userId))
        .order("desc")
        .collect();

      return await Promise.all(
        tasks.map(async (task) => {
          const helper = task.helperId ? await ctx.db.get(task.helperId) : null;
          return {
            ...task,
            helper: helper ? {
              name: helper.name || "Unknown",
              rating: helper.rating || 5.0,
              reviewCount: helper.reviewCount || 0,
            } : null,
          };
        })
      );
    } else {
      const tasks = await ctx.db
        .query("tasks")
        .withIndex("by_helper", (q) => q.eq("helperId", userId))
        .order("desc")
        .collect();

      return await Promise.all(
        tasks.map(async (task) => {
          const seeker = await ctx.db.get(task.seekerId);
          return {
            ...task,
            seeker: seeker ? {
              name: seeker.name || "Unknown",
              rating: seeker.rating || 5.0,
              reviewCount: seeker.reviewCount || 0,
            } : null,
          };
        })
      );
    }
  },
});

export const applyForTask = mutation({
  args: { taskId: v.id("tasks") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const task = await ctx.db.get(args.taskId);
    if (!task) throw new Error("Task not found");
    if (task.status !== "open") throw new Error("Task is not open");
    if (task.seekerId === userId) throw new Error("Cannot apply to your own task");
    if (task.applicants.includes(userId)) throw new Error("Already applied");

    await ctx.db.patch(args.taskId, {
      applicants: [...task.applicants, userId],
    });

    return true;
  },
});

export const assignTask = mutation({
  args: {
    taskId: v.id("tasks"),
    helperId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const task = await ctx.db.get(args.taskId);
    if (!task) throw new Error("Task not found");
    if (task.seekerId !== userId) throw new Error("Not authorized");
    if (task.status !== "open") throw new Error("Task is not open");
    if (!task.applicants.includes(args.helperId)) throw new Error("Helper has not applied");

    await ctx.db.patch(args.taskId, {
      helperId: args.helperId,
      status: "assigned",
    });

    // Send system message
    await ctx.db.insert("messages", {
      taskId: args.taskId,
      senderId: userId,
      receiverId: args.helperId,
      content: "Task has been assigned to you! You can now start working on it.",
      messageType: "system",
      isRead: false,
    });

    return true;
  },
});

export const completeTask = mutation({
  args: { taskId: v.id("tasks") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const task = await ctx.db.get(args.taskId);
    if (!task) throw new Error("Task not found");
    if (task.helperId !== userId && task.seekerId !== userId) {
      throw new Error("Not authorized");
    }
    if (task.status !== "assigned" && task.status !== "in_progress") {
      throw new Error("Task cannot be completed");
    }

    await ctx.db.patch(args.taskId, {
      status: "completed",
      completedAt: Date.now(),
    });

    // Award points to helper
    if (task.helperId) {
      await ctx.db.insert("points", {
        userId: task.helperId,
        taskId: args.taskId,
        points: task.rewardPoints,
        reason: "Task completed",
        awardedAt: Date.now(),
      });

      // Update helper's total points
      const helper = await ctx.db.get(task.helperId);
      if (helper) {
        await ctx.db.patch(task.helperId, {
          totalPoints: (helper.totalPoints || 0) + task.rewardPoints,
        });
      }
    }

    return true;
  },
});

export const getTaskById = query({
  args: { taskId: v.id("tasks") },
  handler: async (ctx, args) => {
    const task = await ctx.db.get(args.taskId);
    if (!task) return null;

    const seeker = await ctx.db.get(task.seekerId);
    const helper = task.helperId ? await ctx.db.get(task.helperId) : null;

    const applicants = await Promise.all(
      task.applicants.map(async (applicantId) => {
        const applicant = await ctx.db.get(applicantId);
        return applicant ? {
          _id: applicant._id,
          name: applicant.name || "Unknown",
          rating: applicant.rating || 5.0,
          reviewCount: applicant.reviewCount || 0,
          skills: applicant.skills || [],
        } : null;
      })
    );

    return {
      ...task,
      seeker: seeker ? {
        name: seeker.name || "Unknown",
        rating: seeker.rating || 5.0,
        reviewCount: seeker.reviewCount || 0,
      } : null,
      helper: helper ? {
        name: helper.name || "Unknown",
        rating: helper.rating || 5.0,
        reviewCount: helper.reviewCount || 0,
      } : null,
      applicants: applicants.filter(Boolean),
    };
  },
});
