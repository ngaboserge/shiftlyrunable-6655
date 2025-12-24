import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { authenticatedOnly } from "../middleware/auth";
import type { HonoContext } from "../types";
import { applications, shifts, users, notifications } from "../db/schema";
import { eq, and, desc, sql } from "drizzle-orm";

export const applicationsRoutes = new Hono<HonoContext>()
  .use("*", authenticatedOnly)
  .post(
    "/",
    zValidator(
      "json",
      z.object({
        shiftId: z.string(),
      })
    ),
    async (c) => {
      const db = c.get("db");
      const user = c.get("user");

      if (user?.role !== "worker") {
        return c.json({ error: "Only workers can apply" }, 403);
      }

      const { shiftId } = c.req.valid("json");

      const shift = await db
        .select()
        .from(shifts)
        .where(eq(shifts.id, shiftId))
        .get();

      if (!shift) {
        return c.json({ error: "Shift not found" }, 404);
      }

      if (shift.status !== "active") {
        return c.json({ error: "This shift is no longer active" }, 400);
      }

      const existingApplication = await db
        .select()
        .from(applications)
        .where(
          and(
            eq(applications.shiftId, shiftId),
            eq(applications.workerId, user.id)
          )
        )
        .get();

      if (existingApplication) {
        return c.json({ error: "You have already applied to this shift" }, 400);
      }

      const applicationId = `app_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      await db.insert(applications).values({
        id: applicationId,
        shiftId,
        workerId: user.id,
      });

      await db.insert(notifications).values({
        id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId: shift.employerId,
        type: "new_application",
        title: "New Application",
        message: `${user.name} applied for ${shift.title}`,
        relatedShiftId: shiftId,
        relatedApplicationId: applicationId,
      });

      return c.json({ applicationId, message: "Application submitted" }, 201);
    }
  )
  .get("/my-applications", async (c) => {
    const db = c.get("db");
    const user = c.get("user");

    if (user?.role !== "worker") {
      return c.json({ error: "Only workers can access this" }, 403);
    }

    const myApplications = await db
      .select({
        application: applications,
        shift: shifts,
        employer: {
          id: users.id,
          name: users.name,
          companyName: users.companyName,
        },
      })
      .from(applications)
      .leftJoin(shifts, eq(applications.shiftId, shifts.id))
      .leftJoin(users, eq(shifts.employerId, users.id))
      .where(eq(applications.workerId, user.id))
      .orderBy(desc(applications.appliedAt));

    return c.json({ applications: myApplications });
  })
  .get("/shift/:shiftId", async (c) => {
    const db = c.get("db");
    const user = c.get("user");
    const { shiftId } = c.req.param();

    const shift = await db
      .select()
      .from(shifts)
      .where(eq(shifts.id, shiftId))
      .get();

    if (!shift) {
      return c.json({ error: "Shift not found" }, 404);
    }

    if (shift.employerId !== user?.id) {
      return c.json({ error: "Unauthorized" }, 403);
    }

    const shiftApplications = await db
      .select({
        application: applications,
        worker: {
          id: users.id,
          name: users.name,
          phone: users.phone,
          reliabilityScore: users.reliabilityScore,
          completedShifts: users.completedShifts,
        },
      })
      .from(applications)
      .leftJoin(users, eq(applications.workerId, users.id))
      .where(eq(applications.shiftId, shiftId))
      .orderBy(desc(applications.appliedAt));

    return c.json({ applications: shiftApplications });
  })
  .patch(
    "/:id/status",
    zValidator(
      "json",
      z.object({
        status: z.enum(["approved", "rejected"]),
      })
    ),
    async (c) => {
      const db = c.get("db");
      const user = c.get("user");
      const { id } = c.req.param();
      const { status } = c.req.valid("json");

      if (user?.role !== "employer") {
        return c.json({ error: "Only employers can update applications" }, 403);
      }

      const application = await db
        .select({
          application: applications,
          shift: shifts,
        })
        .from(applications)
        .leftJoin(shifts, eq(applications.shiftId, shifts.id))
        .where(eq(applications.id, id))
        .get();

      if (!application) {
        return c.json({ error: "Application not found" }, 404);
      }

      if (application.shift?.employerId !== user.id) {
        return c.json({ error: "Unauthorized" }, 403);
      }

      if (status === "approved") {
        if ((application.shift?.workersApproved || 0) >= (application.shift?.workersNeeded || 1)) {
          return c.json({ error: "All positions filled" }, 400);
        }

        await db
          .update(shifts)
          .set({
            workersApproved: sql`${shifts.workersApproved} + 1`,
          })
          .where(eq(shifts.id, application.application.shiftId));

        await db
          .update(users)
          .set({
            totalApprovedShifts: sql`${users.totalApprovedShifts} + 1`,
          })
          .where(eq(users.id, application.application.workerId));
      }

      await db
        .update(applications)
        .set({
          status,
          approvedAt: status === "approved" ? new Date() : null,
        })
        .where(eq(applications.id, id));

      await db.insert(notifications).values({
        id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId: application.application.workerId,
        type: "application_status",
        title: status === "approved" ? "Application Approved! 🎉" : "Application Update",
        message: status === "approved" 
          ? `Your application for ${application.shift?.title} has been approved!`
          : `Your application for ${application.shift?.title} was not selected this time.`,
        relatedShiftId: application.application.shiftId,
        relatedApplicationId: id,
      });

      return c.json({ message: `Application ${status}` });
    }
  )
  .patch(
    "/:id/complete",
    async (c) => {
      const db = c.get("db");
      const user = c.get("user");
      const { id } = c.req.param();

      const application = await db
        .select({
          application: applications,
          shift: shifts,
        })
        .from(applications)
        .leftJoin(shifts, eq(applications.shiftId, shifts.id))
        .where(eq(applications.id, id))
        .get();

      if (!application) {
        return c.json({ error: "Application not found" }, 404);
      }

      const isEmployer = user?.role === "employer" && application.shift?.employerId === user.id;
      const isWorker = user?.role === "worker" && application.application.workerId === user.id;

      if (!isEmployer && !isWorker) {
        return c.json({ error: "Unauthorized" }, 403);
      }

      if (application.application.status !== "approved") {
        return c.json({ error: "Only approved applications can be completed" }, 400);
      }

      await db
        .update(applications)
        .set({
          status: "completed",
          completedAt: new Date(),
        })
        .where(eq(applications.id, id));

      const payRate = application.shift?.payRate || 0;
      await db
        .update(users)
        .set({
          totalEarnings: sql`${users.totalEarnings} + ${payRate}`,
          completedShifts: sql`${users.completedShifts} + 1`,
          reliabilityScore: sql`(${users.completedShifts} + 1) * 100.0 / ${users.totalApprovedShifts}`,
        })
        .where(eq(users.id, application.application.workerId));

      return c.json({ message: "Shift marked as completed" });
    }
  )
  .delete("/:id", async (c) => {
    const db = c.get("db");
    const user = c.get("user");
    const { id } = c.req.param();

    const application = await db
      .select()
      .from(applications)
      .where(eq(applications.id, id))
      .get();

    if (!application) {
      return c.json({ error: "Application not found" }, 404);
    }

    if (application.workerId !== user?.id) {
      return c.json({ error: "Unauthorized" }, 403);
    }

    await db
      .update(applications)
      .set({ status: "cancelled", cancelledAt: new Date() })
      .where(eq(applications.id, id));

    return c.json({ message: "Application cancelled" });
  });
