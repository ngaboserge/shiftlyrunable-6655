import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { authenticatedOnly } from "../middleware/auth";
import type { HonoContext } from "../types";
import { users, notifications } from "../db/schema";
import { eq, desc, and } from "drizzle-orm";

export const userRoutes = new Hono<HonoContext>()
  .use("*", authenticatedOnly)
  .get("/profile", async (c) => {
    const user = c.get("user");
    return c.json({ user });
  })
  .patch(
    "/profile",
    zValidator(
      "json",
      z.object({
        name: z.string().optional(),
        phone: z.string().optional(),
        latitude: z.number().optional(),
        longitude: z.number().optional(),
        address: z.string().optional(),
        skills: z.string().optional(),
        industry: z.string().optional(),
        companyName: z.string().optional(),
        notificationRadius: z.number().optional(),
        notificationsEnabled: z.boolean().optional(),
      })
    ),
    async (c) => {
      const db = c.get("db");
      const user = c.get("user");
      const data = c.req.valid("json");

      if (!user) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      await db
        .update(users)
        .set(data)
        .where(eq(users.id, user.id));

      const updatedUser = await db
        .select()
        .from(users)
        .where(eq(users.id, user.id))
        .get();

      return c.json({ user: updatedUser });
    }
  )
  .get("/notifications", async (c) => {
    const db = c.get("db");
    const user = c.get("user");

    if (!user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const userNotifications = await db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, user.id))
      .orderBy(desc(notifications.createdAt))
      .limit(50);

    return c.json({ notifications: userNotifications });
  })
  .patch("/notifications/:id/read", async (c) => {
    const db = c.get("db");
    const user = c.get("user");
    const { id } = c.req.param();

    const notification = await db
      .select()
      .from(notifications)
      .where(eq(notifications.id, id))
      .get();

    if (!notification) {
      return c.json({ error: "Notification not found" }, 404);
    }

    if (notification.userId !== user?.id) {
      return c.json({ error: "Unauthorized" }, 403);
    }

    await db
      .update(notifications)
      .set({ read: true })
      .where(eq(notifications.id, id));

    return c.json({ message: "Notification marked as read" });
  })
  .patch("/notifications/mark-all-read", async (c) => {
    const db = c.get("db");
    const user = c.get("user");

    if (!user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    await db
      .update(notifications)
      .set({ read: true })
      .where(
        and(
          eq(notifications.userId, user.id),
          eq(notifications.read, false)
        )
      );

    return c.json({ message: "All notifications marked as read" });
  })
  .get("/stats", async (c) => {
    const user = c.get("user");

    if (!user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    return c.json({
      stats: {
        completedShifts: user.completedShifts || 0,
        totalEarnings: user.totalEarnings || 0,
        reliabilityScore: user.reliabilityScore || 100,
        totalApprovedShifts: user.totalApprovedShifts || 0,
      },
    });
  });
