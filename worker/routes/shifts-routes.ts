import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { authenticatedOnly } from "../middleware/auth";
import type { HonoContext } from "../types";
import { shifts, applications, notifications, users } from "../db/schema";
import { eq, and, desc, sql, gte } from "drizzle-orm";
import { calculateDistance } from "../utils/distance";

export const shiftsRoutes = new Hono<HonoContext>()
  .use("*", authenticatedOnly)
  .get("/", async (c) => {
    const db = c.get("db");
    const user = c.get("user");
    
    const { 
      distance, 
      minPay, 
      maxPay, 
      shiftType, 
      startDate, 
      endDate,
      sortBy = "nearest"
    } = c.req.query();

    let allShifts = await db
      .select({
        shift: shifts,
        employer: {
          id: users.id,
          name: users.name,
          companyName: users.companyName,
        },
      })
      .from(shifts)
      .leftJoin(users, eq(shifts.employerId, users.id))
      .where(eq(shifts.status, "active"))
      .orderBy(desc(shifts.createdAt));

    let shiftsWithDistance = allShifts.map(({ shift, employer }) => {
      const dist = user?.latitude && user?.longitude
        ? calculateDistance(
            user.latitude,
            user.longitude,
            shift.latitude,
            shift.longitude
          )
        : null;

      return {
        ...shift,
        employer,
        distance: dist,
      };
    });

    if (distance && user?.latitude && user?.longitude) {
      shiftsWithDistance = shiftsWithDistance.filter(
        (s) => s.distance !== null && s.distance <= parseFloat(distance)
      );
    }

    if (minPay) {
      shiftsWithDistance = shiftsWithDistance.filter(
        (s) => s.payRate >= parseFloat(minPay)
      );
    }

    if (maxPay) {
      shiftsWithDistance = shiftsWithDistance.filter(
        (s) => s.payRate <= parseFloat(maxPay)
      );
    }

    if (shiftType) {
      shiftsWithDistance = shiftsWithDistance.filter(
        (s) => s.shiftType === shiftType
      );
    }

    if (startDate) {
      shiftsWithDistance = shiftsWithDistance.filter(
        (s) => s.date >= startDate
      );
    }

    if (endDate) {
      shiftsWithDistance = shiftsWithDistance.filter(
        (s) => s.date <= endDate
      );
    }

    if (sortBy === "nearest" && user?.latitude && user?.longitude) {
      shiftsWithDistance.sort((a, b) => {
        if (a.distance === null) return 1;
        if (b.distance === null) return -1;
        return a.distance - b.distance;
      });
    } else if (sortBy === "highest_pay") {
      shiftsWithDistance.sort((a, b) => b.payRate - a.payRate);
    } else if (sortBy === "soonest") {
      shiftsWithDistance.sort((a, b) => a.date.localeCompare(b.date));
    }

    const shiftsWithApplications = await Promise.all(
      shiftsWithDistance.map(async (shift) => {
        const [applicationCount] = await db
          .select({ count: sql<number>`count(*)` })
          .from(applications)
          .where(eq(applications.shiftId, shift.id));

        const userApplication = user
          ? await db
              .select()
              .from(applications)
              .where(
                and(
                  eq(applications.shiftId, shift.id),
                  eq(applications.workerId, user.id)
                )
              )
              .get()
          : null;

        return {
          ...shift,
          applicationCount: Number(applicationCount.count),
          userApplication,
        };
      })
    );

    return c.json({ shifts: shiftsWithApplications });
  })
  .get("/:id", async (c) => {
    const db = c.get("db");
    const user = c.get("user");
    const { id } = c.req.param();

    const shift = await db
      .select({
        shift: shifts,
        employer: {
          id: users.id,
          name: users.name,
          companyName: users.companyName,
        },
      })
      .from(shifts)
      .leftJoin(users, eq(shifts.employerId, users.id))
      .where(eq(shifts.id, id))
      .get();

    if (!shift) {
      return c.json({ error: "Shift not found" }, 404);
    }

    const distance = user?.latitude && user?.longitude
      ? calculateDistance(
          user.latitude,
          user.longitude,
          shift.shift.latitude,
          shift.shift.longitude
        )
      : null;

    const [applicationCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(applications)
      .where(eq(applications.shiftId, id));

    const userApplication = user
      ? await db
          .select()
          .from(applications)
          .where(
            and(
              eq(applications.shiftId, id),
              eq(applications.workerId, user.id)
            )
          )
          .get()
      : null;

    return c.json({
      ...shift.shift,
      employer: shift.employer,
      distance,
      applicationCount: Number(applicationCount.count),
      userApplication,
    });
  })
  .post(
    "/",
    zValidator(
      "json",
      z.object({
        title: z.string().min(1),
        description: z.string().min(1),
        latitude: z.number(),
        longitude: z.number(),
        address: z.string().min(1),
        date: z.string(),
        startTime: z.string(),
        endTime: z.string(),
        payRate: z.number().positive(),
        shiftType: z.enum([
          "warehouse",
          "retail",
          "hospitality",
          "delivery",
          "events",
          "other",
        ]),
        workersNeeded: z.number().int().positive().default(1),
        isUrgent: z.boolean().default(false),
      })
    ),
    async (c) => {
      const db = c.get("db");
      const user = c.get("user");

      if (user?.role !== "employer") {
        return c.json({ error: "Only employers can post shifts" }, 403);
      }

      const data = c.req.valid("json");

      const shiftId = `shift_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      await db.insert(shifts).values({
        id: shiftId,
        employerId: user.id,
        ...data,
      });

      if (data.isUrgent) {
        const radius = user.notificationRadius || 10;
        
        const allWorkers = await db
          .select()
          .from(users)
          .where(eq(users.role, "worker"));

        const nearbyWorkers = allWorkers.filter((worker) => {
          if (!worker.latitude || !worker.longitude || !worker.notificationsEnabled) {
            return false;
          }
          const distance = calculateDistance(
            data.latitude,
            data.longitude,
            worker.latitude,
            worker.longitude
          );
          return distance <= radius;
        });

        for (const worker of nearbyWorkers) {
          await db.insert(notifications).values({
            id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            userId: worker.id,
            type: "urgent_shift",
            title: "🚨 Urgent Shift Available!",
            message: `${data.title} - $${data.payRate}/hr`,
            relatedShiftId: shiftId,
          });
        }
      }

      return c.json({ shiftId, message: "Shift posted successfully" }, 201);
    }
  )
  .get("/employer/my-shifts", async (c) => {
    const db = c.get("db");
    const user = c.get("user");

    if (user?.role !== "employer") {
      return c.json({ error: "Only employers can access this" }, 403);
    }

    const employerShifts = await db
      .select()
      .from(shifts)
      .where(eq(shifts.employerId, user.id))
      .orderBy(desc(shifts.createdAt));

    const shiftsWithApplications = await Promise.all(
      employerShifts.map(async (shift) => {
        const [applicationCount] = await db
          .select({ count: sql<number>`count(*)` })
          .from(applications)
          .where(eq(applications.shiftId, shift.id));

        const [pendingCount] = await db
          .select({ count: sql<number>`count(*)` })
          .from(applications)
          .where(
            and(
              eq(applications.shiftId, shift.id),
              eq(applications.status, "pending")
            )
          );

        return {
          ...shift,
          applicationCount: Number(applicationCount.count),
          pendingApplications: Number(pendingCount.count),
        };
      })
    );

    return c.json({ shifts: shiftsWithApplications });
  })
  .delete("/:id", async (c) => {
    const db = c.get("db");
    const user = c.get("user");
    const { id } = c.req.param();

    const shift = await db
      .select()
      .from(shifts)
      .where(eq(shifts.id, id))
      .get();

    if (!shift) {
      return c.json({ error: "Shift not found" }, 404);
    }

    if (shift.employerId !== user?.id) {
      return c.json({ error: "Unauthorized" }, 403);
    }

    await db
      .update(shifts)
      .set({ status: "cancelled" })
      .where(eq(shifts.id, id));

    return c.json({ message: "Shift cancelled successfully" });
  });
