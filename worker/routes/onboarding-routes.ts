import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { authenticatedOnly } from "../middleware/auth";
import type { HonoContext } from "../types";
import { users } from "../db/schema";
import { eq } from "drizzle-orm";

export const onboardingRoutes = new Hono<HonoContext>()
  .use("*", authenticatedOnly)
  .post(
    "/worker",
    zValidator(
      "json",
      z.object({
        phone: z.string().min(1),
        latitude: z.number(),
        longitude: z.number(),
        address: z.string().min(1),
        skills: z.string().optional(),
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
        .set({
          ...data,
          role: "worker",
        })
        .where(eq(users.id, user.id));

      const updatedUser = await db
        .select()
        .from(users)
        .where(eq(users.id, user.id))
        .get();

      return c.json({ user: updatedUser });
    }
  )
  .post(
    "/employer",
    zValidator(
      "json",
      z.object({
        companyName: z.string().min(1),
        phone: z.string().min(1),
        latitude: z.number(),
        longitude: z.number(),
        address: z.string().min(1),
        industry: z.string().optional(),
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
        .set({
          ...data,
          role: "employer",
        })
        .where(eq(users.id, user.id));

      const updatedUser = await db
        .select()
        .from(users)
        .where(eq(users.id, user.id))
        .get();

      return c.json({ user: updatedUser });
    }
  );
