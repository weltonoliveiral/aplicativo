import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const createReview = mutation({
  args: {
    taskId: v.id("tasks"),
    revieweeId: v.id("users"),
    rating: v.number(),
    comment: v.optional(v.string()),
    reviewType: v.union(v.literal("helper_to_seeker"), v.literal("seeker_to_helper")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const task = await ctx.db.get(args.taskId);
    if (!task) throw new Error("Task not found");
    if (task.status !== "completed") throw new Error("Task must be completed to review");

    // Verify reviewer is part of the task
    if (task.seekerId !== userId && task.helperId !== userId) {
      throw new Error("Not authorized to review this task");
    }

    // Check if review already exists
    const existingReview = await ctx.db
      .query("reviews")
      .withIndex("by_task", (q) => q.eq("taskId", args.taskId))
      .filter((q) => q.eq(q.field("reviewerId"), userId))
      .first();

    if (existingReview) {
      throw new Error("Review already submitted for this task");
    }

    // Validate rating
    if (args.rating < 1 || args.rating > 5) {
      throw new Error("Rating must be between 1 and 5");
    }

    await ctx.db.insert("reviews", {
      ...args,
      reviewerId: userId,
    });

    // Update reviewee's rating
    const reviewee = await ctx.db.get(args.revieweeId);
    if (reviewee) {
      const currentReviewCount = reviewee.reviewCount || 0;
      const currentRating = reviewee.rating || 5.0;
      const newReviewCount = currentReviewCount + 1;
      const newRating = ((currentRating * currentReviewCount) + args.rating) / newReviewCount;
      
      await ctx.db.patch(args.revieweeId, {
        rating: Math.round(newRating * 10) / 10, // Round to 1 decimal place
        reviewCount: newReviewCount,
      });
    }

    return true;
  },
});

export const getUserReviews = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const reviews = await ctx.db
      .query("reviews")
      .withIndex("by_reviewee", (q) => q.eq("revieweeId", args.userId))
      .order("desc")
      .take(20);

    return await Promise.all(
      reviews.map(async (review) => {
        const reviewer = await ctx.db.get(review.reviewerId);
        const task = await ctx.db.get(review.taskId);
        return {
          ...review,
          reviewerName: reviewer?.name || "Anonymous",
          taskTitle: task?.title || "Unknown Task",
        };
      })
    );
  },
});

export const getTaskReviews = query({
  args: { taskId: v.id("tasks") },
  handler: async (ctx, args) => {
    const reviews = await ctx.db
      .query("reviews")
      .withIndex("by_task", (q) => q.eq("taskId", args.taskId))
      .collect();

    return await Promise.all(
      reviews.map(async (review) => {
        const reviewer = await ctx.db.get(review.reviewerId);
        const reviewee = await ctx.db.get(review.revieweeId);
        return {
          ...review,
          reviewerName: reviewer?.name || "Anonymous",
          revieweeName: reviewee?.name || "Anonymous",
        };
      })
    );
  },
});
