import { Router } from "express";
import { websiteRouter } from "./website.routes";
import { searchConsoleRouter } from "./search-console.routes";
import { seoRouter } from "./seo.routes";
import { twitterRouter } from "./twitter.routes";
import { discordRouter } from "./discord.routes";
import { redditRouter } from "./reddit.routes";
import { blogRouter } from "./blog.routes";
import { socialLeaderboardRouter } from "./social-leaderboard.routes";
import { reportsRouter } from "./reports.routes";
import { settingsRouter } from "./settings.routes";
import { alertsRouter } from "./alerts.routes";
import { dashboardRouter } from "./dashboard.routes";
import { usersRouter } from "./users.routes";

// `health` and `auth` are mounted directly in app.ts, ahead of the `requireAuth` gate —
// every router mounted here requires a logged-in session.
export const apiRouter = Router();

apiRouter.use("/dashboard", dashboardRouter);
apiRouter.use("/website", websiteRouter);
apiRouter.use("/search-console", searchConsoleRouter);
apiRouter.use("/seo", seoRouter);
apiRouter.use("/twitter", twitterRouter);
apiRouter.use("/reddit", redditRouter);
apiRouter.use("/discord", discordRouter);
apiRouter.use("/blog", blogRouter);
apiRouter.use("/social-leaderboard", socialLeaderboardRouter);
apiRouter.use("/reports", reportsRouter);
apiRouter.use("/settings", settingsRouter);
apiRouter.use("/alerts", alertsRouter);
apiRouter.use("/users", usersRouter);
