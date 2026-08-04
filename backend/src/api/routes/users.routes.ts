import { Router } from "express";
import { prisma } from "../../db/prisma-client";
import { requireRole } from "../middleware/auth";
import { validateBody } from "../middleware/validate";
import { sendData } from "../utils/api-response";
import { NotFoundError, ValidationError } from "../../lib/errors";
import { updateUserRoleBodySchema, type UpdateUserRoleBody } from "../schemas/users.schema";

export const usersRouter = Router();

const USER_LIST_SELECT = { id: true, name: true, email: true, initials: true, role: true, status: true } as const;

usersRouter.get("/", async (_req, res, next) => {
  try {
    const users = await prisma.user.findMany({
      select: USER_LIST_SELECT,
      orderBy: { name: "asc" },
    });
    sendData(res, users);
  } catch (error) {
    next(error);
  }
});

usersRouter.patch(
  "/:id/role",
  requireRole("admin"),
  validateBody(updateUserRoleBodySchema),
  async (req, res, next) => {
    try {
      const body = req.body as UpdateUserRoleBody;
      const target = await prisma.user.findUnique({ where: { id: req.params.id } });
      if (!target) {
        next(new NotFoundError("User not found"));
        return;
      }

      if (target.role === "admin" && body.role === "member") {
        const adminCount = await prisma.user.count({ where: { role: "admin" } });
        if (adminCount <= 1) {
          next(new ValidationError("Cannot demote the only remaining admin"));
          return;
        }
      }

      const updated = await prisma.user.update({
        where: { id: req.params.id },
        data: { role: body.role },
        select: USER_LIST_SELECT,
      });
      sendData(res, updated);
    } catch (error) {
      next(error);
    }
  }
);
