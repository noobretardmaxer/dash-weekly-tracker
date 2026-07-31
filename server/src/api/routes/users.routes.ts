import { Router } from "express";
import { prisma } from "../../db/prisma-client";
import { sendData } from "../utils/api-response";

export const usersRouter = Router();

usersRouter.get("/", async (_req, res, next) => {
  try {
    const users = await prisma.user.findMany({
      select: { id: true, name: true, initials: true, role: true },
      orderBy: { name: "asc" },
    });
    sendData(res, users);
  } catch (error) {
    next(error);
  }
});
