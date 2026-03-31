import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

export const list = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    return await ctx.db
      .query("drawings")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();
  },
});

export const get = query({
  args: { id: v.id("drawings") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const create = mutation({
  args: {
    title: v.string(),
    width: v.number(),
    height: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const now = Date.now();
    return await ctx.db.insert("drawings", {
      userId,
      title: args.title,
      strokes: [],
      width: args.width,
      height: args.height,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const addStroke = mutation({
  args: {
    id: v.id("drawings"),
    stroke: v.object({
      points: v.array(v.object({
        x: v.number(),
        y: v.number(),
      })),
      color: v.string(),
      strokeWidth: v.number(),
      tool: v.string(),
    }),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const drawing = await ctx.db.get(args.id);
    if (!drawing || drawing.userId !== userId) throw new Error("Not found");
    await ctx.db.patch(args.id, {
      strokes: [...drawing.strokes, args.stroke],
      updatedAt: Date.now(),
    });
  },
});

export const clearCanvas = mutation({
  args: { id: v.id("drawings") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const drawing = await ctx.db.get(args.id);
    if (!drawing || drawing.userId !== userId) throw new Error("Not found");
    await ctx.db.patch(args.id, {
      strokes: [],
      updatedAt: Date.now(),
    });
  },
});

export const undoStroke = mutation({
  args: { id: v.id("drawings") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const drawing = await ctx.db.get(args.id);
    if (!drawing || drawing.userId !== userId) throw new Error("Not found");
    if (drawing.strokes.length === 0) return;
    await ctx.db.patch(args.id, {
      strokes: drawing.strokes.slice(0, -1),
      updatedAt: Date.now(),
    });
  },
});

export const remove = mutation({
  args: { id: v.id("drawings") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const drawing = await ctx.db.get(args.id);
    if (!drawing || drawing.userId !== userId) throw new Error("Not found");
    await ctx.db.delete(args.id);
  },
});

export const updateTitle = mutation({
  args: {
    id: v.id("drawings"),
    title: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const drawing = await ctx.db.get(args.id);
    if (!drawing || drawing.userId !== userId) throw new Error("Not found");
    await ctx.db.patch(args.id, {
      title: args.title,
      updatedAt: Date.now(),
    });
  },
});
