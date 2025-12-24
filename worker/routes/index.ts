import { Hono } from "hono";
import type { HonoContext } from "../types";
import { adminRoutes } from "./admin-routes";
import { aiRoutes } from "./ai-routes";
import { authRoutes } from "./auth-routes";
import { shiftsRoutes } from "./shifts-routes";
import { applicationsRoutes } from "./applications-routes";
import { userRoutes } from "./user-routes";
import { onboardingRoutes } from "./onboarding-routes";

export const apiRoutes = new Hono<HonoContext>()
.route("/admin", adminRoutes)
.route("/ai", aiRoutes)
.route("/auth", authRoutes)
.route("/shifts", shiftsRoutes)
.route("/applications", applicationsRoutes)
.route("/users", userRoutes)
.route("/onboarding", onboardingRoutes)