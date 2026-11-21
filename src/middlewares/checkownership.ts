import type { Request, Response, NextFunction } from "express";
import prisma from "../config/prisma.js";

export const checkPostOwnership = (...allowedRoles:string[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const postId = Number(req.params.id);

      if (!Number.isInteger(postId) || postId <= 0) {
        return res.status(400).json({ message: "Invalid post ID" });
      }

      const post = await prisma.prisma.post.findUnique({ where: { id: postId }, });

      if (!post) {
        return res.status(404).json({ message: "Post not found" });
      }

      if (!req.user ) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const isOwner = post.authorId === req.user.id;
      const hasElevatedRole = allowedRoles.includes(req.user.role);

      if (!isOwner && !hasElevatedRole) {
        return res.status(403).json({
          message: "You cannot modify another user's post",
        });
      }

      req.post = post; // Attach database result to request

      return next();
    } catch (error) {
      console.error("Ownership error:", error);
      return res.status(500).json({
        message: "Internal server error",
      });
    }
  };
};

