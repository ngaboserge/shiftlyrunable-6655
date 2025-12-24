import { integer, sqliteTable, text, real } from "drizzle-orm/sqlite-core";

export * from "./auth-schema";

export const shifts = sqliteTable("shifts", {
  id: text("id").primaryKey(),
  employerId: text("employer_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description").notNull(),
  latitude: real("latitude").notNull(),
  longitude: real("longitude").notNull(),
  address: text("address").notNull(),
  date: text("date").notNull(),
  startTime: text("start_time").notNull(),
  endTime: text("end_time").notNull(),
  payRate: real("pay_rate").notNull(),
  shiftType: text("shift_type", { 
    enum: ["warehouse", "retail", "hospitality", "delivery", "events", "other"] 
  }).notNull(),
  workersNeeded: integer("workers_needed").notNull().default(1),
  workersApproved: integer("workers_approved").notNull().default(0),
  isUrgent: integer("is_urgent", { mode: "boolean" }).default(false).notNull(),
  status: text("status", { 
    enum: ["active", "completed", "cancelled"] 
  }).default("active").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .defaultNow()
    .notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

export const applications = sqliteTable("applications", {
  id: text("id").primaryKey(),
  shiftId: text("shift_id")
    .notNull()
    .references(() => shifts.id, { onDelete: "cascade" }),
  workerId: text("worker_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  status: text("status", { 
    enum: ["pending", "approved", "rejected", "completed", "cancelled"] 
  }).default("pending").notNull(),
  appliedAt: integer("applied_at", { mode: "timestamp" })
    .defaultNow()
    .notNull(),
  approvedAt: integer("approved_at", { mode: "timestamp" }),
  completedAt: integer("completed_at", { mode: "timestamp" }),
  cancelledAt: integer("cancelled_at", { mode: "timestamp" }),
  cancellationReason: text("cancellation_reason"),
});

export const ratings = sqliteTable("ratings", {
  id: text("id").primaryKey(),
  shiftId: text("shift_id")
    .notNull()
    .references(() => shifts.id, { onDelete: "cascade" }),
  raterId: text("rater_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  ratedId: text("rated_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  score: integer("score").notNull(),
  review: text("review"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .defaultNow()
    .notNull(),
});

export const notifications = sqliteTable("notifications", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  type: text("type", { 
    enum: ["application_status", "new_application", "urgent_shift", "shift_reminder", "rating"] 
  }).notNull(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  relatedShiftId: text("related_shift_id"),
  relatedApplicationId: text("related_application_id"),
  read: integer("read", { mode: "boolean" }).default(false).notNull(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .defaultNow()
    .notNull(),
});

export const favoriteShifts = sqliteTable("favorite_shifts", {
  id: text("id").primaryKey(),
  workerId: text("worker_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  shiftId: text("shift_id")
    .notNull()
    .references(() => shifts.id, { onDelete: "cascade" }),
  createdAt: integer("created_at", { mode: "timestamp" })
    .defaultNow()
    .notNull(),
});

export const shiftTemplates = sqliteTable("shift_templates", {
  id: text("id").primaryKey(),
  employerId: text("employer_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  shiftType: text("shift_type", { 
    enum: ["warehouse", "retail", "hospitality", "delivery", "events", "other"] 
  }).notNull(),
  payRate: real("pay_rate").notNull(),
  workersNeeded: integer("workers_needed").notNull().default(1),
  createdAt: integer("created_at", { mode: "timestamp" })
    .defaultNow()
    .notNull(),
});

import { users } from "./auth-schema";
