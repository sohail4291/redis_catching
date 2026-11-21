import express from "express";
import {redis} from "./config/redis.js"
import authRoutes from "./routes/auth.routes.js"
import postRoutes from "./routes/posts.routes.js"

const app = express();
app.use(express.json());


// Create a post.
// Get all posts.
// Get a single post.
// Update a post.
// Delete a post.
// Cache frequently accessed GET requests.
// Automatically invalidate cache when data changes.
// Continue working even if Redis becomes unavailable.

app.use("/auth",authRoutes);
app.use("/posts",postRoutes)

app.post("/add",async (req,res)=>{

    res.status(200).json({message : "added"});
})

app.listen(3000, () => {
    console.log("server is listening at port 3000");
    redis.on("ready", () => { console.log("redis is ready")});
});