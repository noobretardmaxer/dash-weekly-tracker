import { Router } from "express";
import { createHttpClient } from "../../integrations/shared/http-client";
import { env } from "../../lib/env";
import { sendData } from "../utils/api-response";

const ALLOWED_DASHBOARD_IDS = new Set([1822339, 1822142, 1822007, 1822164, 1863455]);

export const posthogDashboardsRouter = Router();

posthogDashboardsRouter.get("/:dashboardId", async (req, res, next) => {
  try {
    const dashboardId = Number(req.params.dashboardId);
    if (!Number.isFinite(dashboardId) || !ALLOWED_DASHBOARD_IDS.has(dashboardId)) {
      res.status(404).json({ error: "Dashboard not found" });
      return;
    }

    if (!env.POSTHOG_API_KEY || !env.POSTHOG_PROJECT_ID) {
      res.status(503).json({ error: "PostHog is not configured" });
      return;
    }

    const http = createHttpClient(env.POSTHOG_HOST, {
      Authorization: `Bearer ${env.POSTHOG_API_KEY}`,
    });

    const { data: raw } = await http.get(
      `/api/projects/${env.POSTHOG_PROJECT_ID}/dashboards/${dashboardId}/`
    );

    const tiles = (raw.tiles ?? []).map((tile: any) => {
      const base: Record<string, unknown> = {
        id: tile.id,
        layouts: tile.layouts,
        order: tile.order,
      };

      if (tile.text) {
        base.text = { body: tile.text.body };
      }

      if (tile.insight) {
        base.insight = {
          id: tile.insight.id,
          short_id: tile.insight.short_id,
          name: tile.insight.name,
          description: tile.insight.description,
          query: tile.insight.query,
          result: tile.insight.result,
          last_refresh: tile.insight.last_refresh,
        };
      }

      return base;
    });

    sendData(res, {
      id: raw.id,
      name: raw.name,
      description: raw.description,
      tiles,
    });
  } catch (err: any) {
    if (err.response?.status) {
      res.status(502).json({ error: `PostHog API returned ${err.response.status}` });
      return;
    }
    next(err);
  }
});
