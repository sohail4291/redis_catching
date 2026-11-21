import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import prisma from "../config/prisma.js";
import dotenv from "dotenv"
import type{Request,Response,NextFunction} from "express"



dotenv.config();
const secret = process.env.JWT_SECRET;

if(!secret){
    throw new Error ("no secret");
}

type User = {
    id: number,
    name : String,
    email : String,
    role : String
}
const generateToken = (user:User) => {
  return jwt.sign( { sub: String(user.id), role: user.role, },secret,{ expiresIn: "15m" });
};

// SIGNUP
export const signup = async (req:Request, res:Response) => {
  try {
    const { name, email, password } = req.body;

    // Basic validation
    if (!name || !email || !password) {
      return res.status(400).json({
        message: "Name, email and password are required",
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        message: "Password must contain at least 8 characters",
      });
    }

    // Check if user already exists
    const existingUser = await prisma.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(409).json({
        message: "Email already registered",
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    
    const user = await prisma.prisma.user.create({
      data: { name, email,password: hashedPassword, },
      select: {id: true,  name: true, email: true,role: true,},
    });

    const token = generateToken(user);

    return res.status(201).json({
      message: "Signup successful",
      user,
      accessToken: token,
    });
  } catch (error) {
    console.error("Signup error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};




export const login = async (req:Request, res:Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required",
      });
    }

    // Find user
    const user = await prisma.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    // Compare password
    const isPasswordValid = await bcrypt.compare(password, user.password );

    if (!isPasswordValid) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    const accessToken = generateToken(user);
  

    return res.status(200).json({
      message: "Login successful",
      user: {id: user.id, name: user.name, email: user.email, role: user.role, },
      accessToken,
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};