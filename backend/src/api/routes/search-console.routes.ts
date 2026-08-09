import { Router, type Response } from "express";
import { logger } from "../../lib/logger";
import { validateQuery, validateBody } from "../middleware/validate";
import { sendData, sendPaginated } from "../utils/api-response";
import { resolveDateRange, resolvePreviousWindow, parseSort } from "../utils/query-parser";
import {
  gscBaseQuerySchema,
  gscTimeseriesQuerySchema,
  gscDimensionQuerySchema,
  gscDimensionParamSchema,
  gscPropertyQuerySchema,
  gscCoverageQuerySchema,
  gscUrlInspectionQuerySchema,
  gscSyncBodySchema,
  type GscBaseQuery,
  type GscTimeseriesQuery,
  type GscDimensionQuery,
  type GscPropertyQuery,
  type GscCoverageQuery,
  type GscUrlInspectionQuery,
  type GscSyncBody,
} from "../schemas/search-console.schema";
import {
  resolveProperty,
  listProperties,
  getSummary,
  getTimeseries,
  getDimension,
  getIndexStatus,
  getCoverageUrls,
  getSitemaps,
  getUrlInspection,
  getCoreWebVitals,
  getGscSyncStatus,
  type DimensionSortField,
} from "../../integrations/gsc/read";
import { runBackfill, runDaily } from "../../integrations/gsc/sync";

export const searchConsoleRouter = Router();

/** Shared property meta so the UI selector + shareable URLs stay in sync. */
async function propertyMeta(siteUrl?: string) {
  const [property, all] = await Promise.all([resolveProperty(siteUrl), listProperties()]);
  return {
    property,
    meta: {
      property: property?.siteUrl ?? null,
      properties: all.map((p) => ({
        siteUrl: p.siteUrl,
        displayName: p.displayName,
        type: p.type,
        isDefault: p.isDefault,
        permissionLevel: p.permissionLevel,
      })),
    },
  };
}

// GET /properties — drives the property selector.
searchConsoleRouter.get("/properties", async (_req, res, next) => {
  try {
    const properties = await listProperties();
    sendData(
      res,
      properties.map((p) => ({
        siteUrl: p.siteUrl,
        displayName: p.displayName,
        type: p.type,
        isDefault: p.isDefault,
        permissionLevel: p.permissionLevel,
      }))
    );
  } catch (error) {
    next(error);
  }
});

// GET /summary — totals + deltas (weighted CTR/position).
searchConsoleRouter.get("/summary", validateQuery(gscBaseQuerySchema), async (req, res, next) => {
  try {
    const q = req.parsedQuery as GscBaseQuery;
    const { property, meta } = await propertyMeta(q.property);
    if (!property) return sendData(res, null, meta);
    const current = resolveDateRange(q);
    const previous = resolvePreviousWindow(current, q.compare);
    const summary = await getSummary(property.id, q.searchType, current, previous);
    return sendData(res, summary, { ...meta, searchType: q.searchType, range: current, compare: q.compare });
  } catch (error) {
    return next(error);
  }
});

// GET /timeseries — daily/weekly/monthly series, with comparison when requested.
searchConsoleRouter.get("/timeseries", validateQuery(gscTimeseriesQuerySchema), async (req, res, next) => {
  try {
    const q = req.parsedQuery as GscTimeseriesQuery;
    const { property, meta } = await propertyMeta(q.property);
    if (!property) return sendData(res, { current: [], previous: [] }, meta);
    const current = resolveDateRange(q);
    const previous = resolvePreviousWindow(current, q.compare);
    const series = await getTimeseries(property.id, q.searchType, current, previous, q.granularity);
    return sendData(res, series, { ...meta, searchType: q.searchType, granularity: q.granularity, range: current, compare: q.compare });
  } catch (error) {
    return next(error);
  }
});

// GET /dimension/:dimension — paginated, sortable, filterable rows.
searchConsoleRouter.get("/dimension/:dimension", validateQuery(gscDimensionQuerySchema), async (req, res, next) => {
  try {
    const dimensionParse = gscDimensionParamSchema.safeParse(req.params.dimension);
    if (!dimensionParse.success) {
      return sendData(res, [], { error: "unknown_dimension" });
    }
    const q = req.parsedQuery as GscDimensionQuery;
    const { property, meta } = await propertyMeta(q.property);
    if (!property) return sendPaginated(res, [], { page: q.page, pageSize: q.pageSize, total: 0 }, meta);
    const current = resolveDateRange(q);
    const sort = parseSort(q.sort, ["clicks", "impressions", "ctr", "position", "value"]) ?? {
      field: "clicks",
      direction: "desc" as const,
    };
    const result = await getDimension(property.id, q.searchType, dimensionParse.data, current, {
      page: q.page,
      pageSize: q.pageSize,
      sortField: sort.field as DimensionSortField,
      sortDir: sort.direction,
      search: q.search,
    });
    return sendPaginated(res, result.rows, { page: q.page, pageSize: q.pageSize, total: result.total }, {
      ...meta,
      searchType: q.searchType,
      dimension: dimensionParse.data,
      range: current,
    });
  } catch (error) {
    return next(error);
  }
});

// GET /pages/index-status — coverage-state counts (derived from URL Inspection).
searchConsoleRouter.get("/pages/index-status", validateQuery(gscPropertyQuerySchema), async (req, res, next) => {
  try {
    const q = req.parsedQuery as GscPropertyQuery;
    const { property, meta } = await propertyMeta(q.property);
    if (!property) return sendData(res, null, meta);
    const status = await getIndexStatus(property.id);
    return sendData(res, { ...status, source: "URL Inspection API — sampled daily" }, meta);
  } catch (error) {
    return next(error);
  }
});

// GET /pages/coverage — drill-down URL list for a coverage state.
searchConsoleRouter.get("/pages/coverage", validateQuery(gscCoverageQuerySchema), async (req, res, next) => {
  try {
    const q = req.parsedQuery as GscCoverageQuery;
    const { property, meta } = await propertyMeta(q.property);
    if (!property) return sendPaginated(res, [], { page: q.page, pageSize: q.pageSize, total: 0 }, meta);
    const result = await getCoverageUrls(property.id, q.coverageState, { page: q.page, pageSize: q.pageSize });
    return sendPaginated(res, result.rows, { page: q.page, pageSize: q.pageSize, total: result.total }, {
      ...meta,
      coverageState: q.coverageState,
    });
  } catch (error) {
    return next(error);
  }
});

// GET /sitemaps
searchConsoleRouter.get("/sitemaps", validateQuery(gscPropertyQuerySchema), async (req, res, next) => {
  try {
    const q = req.parsedQuery as GscPropertyQuery;
    const { property, meta } = await propertyMeta(q.property);
    if (!property) return sendData(res, [], meta);
    return sendData(res, await getSitemaps(property.id), meta);
  } catch (error) {
    return next(error);
  }
});

// GET /url-inspection?url=
searchConsoleRouter.get("/url-inspection", validateQuery(gscUrlInspectionQuerySchema), async (req, res, next) => {
  try {
    const q = req.parsedQuery as GscUrlInspectionQuery;
    const { property, meta } = await propertyMeta(q.property);
    if (!property) return sendData(res, null, meta);
    const result = await getUrlInspection(property.id, q.url);
    return sendData(res, result, { ...meta, url: q.url, cached: Boolean(result) });
  } catch (error) {
    return next(error);
  }
});

// GET /core-web-vitals — from CrUX (labelled as such in the UI).
searchConsoleRouter.get("/core-web-vitals", async (_req, res, next) => {
  try {
    return sendData(res, await getCoreWebVitals());
  } catch (error) {
    return next(error);
  }
});

// GET /sync-status — GSC pipeline run status (drives the banner + sync-health).
searchConsoleRouter.get("/sync-status", async (_req, res, next) => {
  try {
    return sendData(res, await getGscSyncStatus());
  } catch (error) {
    return next(error);
  }
});

// POST /sync — manual trigger; runs in the background (a full backfill would
// exceed request timeouts), poll /sync-status for progress.
searchConsoleRouter.post("/sync", validateBody(gscSyncBodySchema), (req, res) => {
  const body = req.body as GscSyncBody;
  const properties = body.property ? [body.property] : undefined;
  const run = body.mode === "backfill" ? runBackfill({ properties }) : runDaily({ properties });
  run
    .then((summary) => logger.info({ mode: body.mode, results: summary.results }, "manual gsc sync finished"))
    .catch((err) => logger.error({ err }, "manual gsc sync failed"));

  res.status(202);
  sendData(res, { status: "started", mode: body.mode, property: body.property ?? "all" });
});
