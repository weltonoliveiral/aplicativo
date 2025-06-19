import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const getTaskMessages = query({
  args: { taskId: v.id("tasks") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const task = await ctx.db.get(args.taskId);
    if (!task) return [];
    
    // Only allow seeker and assigned helper to see messages
    if (task.seekerId !== userId && task.helperId !== userId) {
      return [];
    }

    const messages = await ctx.db
      .query("messages")
      .withIndex("by_task", (q) => q.eq("taskId", args.taskId))
      .order("asc")
      .collect();

    return await Promise.all(
      messages.map(async (message) => {
        const sender = await ctx.db.get(message.senderId);
        return {
          ...message,
          senderName: sender?.name || "Unknown",
        };
      })
    );
  },
});

export const sendMessage = mutation({
  args: {
    taskId: v.id("tasks"),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const task = await ctx.db.get(args.taskId);
    if (!task) throw new Error("Task not found");
    
    // Only allow seeker and assigned helper to send messages
    if (task.seekerId !== userId && task.helperId !== userId) {
      throw new Error("Not authorized to send messages for this task");
    }

    const receiverId = task.seekerId === userId ? task.helperId : task.seekerId;
    if (!receiverId) throw new Error("No recipient found");

    await ctx.db.insert("messages", {
      taskId: args.taskId,
      senderId: userId,
      receiverId,
      content: args.content,
      messageType: "text",
      isRead: false,
    });

    return true;
  },
});

export const markMessagesAsRead = mutation({
  args: { taskId: v.id("tasks") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const messages = await ctx.db
      .query("messages")
      .withIndex("by_task", (q) => q.eq("taskId", args.taskId))
      .filter((q) => 
        q.and(
          q.eq(q.field("receiverId"), userId),
          q.eq(q.field("isRead"), false)
        )
      )
      .collect();

    await Promise.all(
      messages.map((message) =>
        ctx.db.patch(message._id, { isRead: true })
      )
    );

    return true;
  },
});
