import jwt, { type JwtPayload } from "jsonwebtoken";
import type{Request, Response, NextFunction} from "express"
import dotenv from "dotenv"

dotenv.config();
const secret = process.env.JWT_SECRET;
if(!secret){
    throw new Error("secert misssing");
}



declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number;
        role: "admin" | "editor" | "user";
      };
    }
  }
}


const roles = ["admin", "editor", "user"] as const;

type Role = (typeof roles)[number];

interface AccessTokenPayload extends JwtPayload {
  sub: string;
  role: Role;
}

const authenticate = ( req: Request,  res: Response,  next: NextFunction) => {
  try {
    // 1. Read Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Access token required", });
    }

    // 2. Extract token
    const token = authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        message: "Access token required",
      });
    }

    // 3. Verify JWT
    const decoded = jwt.verify(token, secret, {
      algorithms: ["HS256"],
    });

    // 4. Validate decoded payload
    if (typeof decoded === "string") {
      return res.status(401).json({
        message: "Invalid token payload",
      });
    }

    const payload = decoded as AccessTokenPayload;

    const userId = Number(payload.sub);

    if ( !Number.isInteger(userId) ||  userId <= 0 || !roles.includes(payload.role) ) {
      return res.status(401).json({
        message: "Invalid token payload",
      });
    }

    // 5. Attach authenticated user to request
    req.user = {
      id: userId,
      role: payload.role,
    };

    // 6. Continue to next middleware/controller
    next();

  } catch (error) {
    return res.status(401).json({
      message: "Invalid or expired token",
    });
  }
};


export default authenticate;