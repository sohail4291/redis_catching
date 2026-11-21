// Define permissions for each role
import type {Request,Response,NextFunction} from "express"

const permissions = {
  admin: [
    "post:create",
    "post:read",
    "post:update",
    "post:delete",
    "user:manage",
  ],

  editor: [
    "post:create",
    "post:read",
    "post:update",
  ],

  user: [
    "post:create",
    "post:read",
  ],
};

// Check role
export const requireRole = (...allowedRoles : string[]) => {
  return (req:Request, res:Response, next:NextFunction) => {
    
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        message: "You don't have permission to access this resource",
      });
    }

    next();
  };
};

// Check permission
export const requirePermission = (requiredPermission :string) => {
  return (req:Request, res:Response, next:NextFunction) => {
    if (!req.user) {
      return res.status(403).json({
        message: "Permission denied",
      });
    }

    const userPermissions = permissions[req.user.role] || [];

    if (!userPermissions.includes(requiredPermission)) {
      return res.status(403).json({
        message: "Permission denied",
      });
    }

    next();
  };
};