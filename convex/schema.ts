import { defineSchema, defineTable } from "convex/server";
import { authTables } from "@convex-dev/auth/server";
import { v } from "convex/values";

export default defineSchema({
  ...authTables,

  drawings: defineTable({
    userId: v.id("users"),
    title: v.string(),
    strokes: v.array(v.object({
      points: v.array(v.object({
        x: v.number(),
        y: v.number(),
      })),
      color: v.string(),
      strokeWidth: v.number(),
      tool: v.string(),
    })),
    width: v.number(),
    height: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_user", ["userId"]).index("by_updated", ["updatedAt"]),

  collaborators: defineTable({
    drawingId: v.id("drawings"),
    sessionId: v.string(),
    cursorX: v.number(),
    cursorY: v.number(),
    lastActive: v.number(),
  }).index("by_drawing", ["drawingId"]).index("by_session", ["sessionId"]),
});
