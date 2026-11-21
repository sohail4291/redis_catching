import prisma from "../config/prisma.js"
import type { Request, Response,NextFunction} from "express"
import {getOrSetCache, invalidateCache} from "../services/cache.service.js"
import type {Post} from "../generated/prisma/client.js"

// declare global{
//     namespace express{
//         interface create  {
//             User : { 
//                 title : String,
//                 content : String,
//                 authorId : Number,
//             },
            
//         }
//     }
// }


export const getPosts = async (req:Request,res:Response,next:NextFunction) =>{
    try{
        const id = req.user?.id;
        const { data, cacheStatus} = await getOrSetCache("posts:all", 
             () => prisma.prisma.post.findMany({
                include : {
                    author : { select : { id : true, name : true , email : true}}
                }
            }), 60
        );
        console.log("data", data);
        // res.set("X-Cache ", cacheStatus)
         res.json({data});
    }catch(error){
        next(error);
    }
}



export const getPost = async ( req:Request, res:Response,next:NextFunction)=>{
    try{
        const postId = Number(req.params.id);
        if(!Number.isInteger(postId) || postId <= 0){
            return res.status(400).json({
                error : "Invalid Post Id"
            })
        }
        const {data, cacheStatus} = await getOrSetCache(`posts:${postId}`,
            async()=> await prisma.prisma.post.findUnique({
                where : { id : postId}, 
                include : { author : { select : { id : true, name : true}} }
            }),
            60
        );
        if(!data){
            return res.status(404).json({ error : "Post not found"});
        }
        res.set("X-Cache", cacheStatus).json({ data : data});
        
    }catch(err:any){
        console.log("error in getting allposts", err.message);
    }
}


declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number;
        role: "user" | "admin" | "editor";
      },
      post ?: Post,
    }
  }
}

export const createPost = async ( req:Request, res:Response,next:NextFunction) => {
    try{
        const { title, content} = req.body;
        if(!title || !content){
            return res.status(400).json({
                error : "title and content are required"
            });
        }
        if(!req.user){
            return res.status(401).json({ error : "unauthorised"})
        }
        const id = req.user?.id;
        const post = await prisma.prisma.post.create({
            data : { title ,content ,authorId : Number(req.user.id) }
        });
        await invalidateCache("posts:all");
        res.status(201).json({
            message : "Post created successfully", post : post
        })
    }catch(err:any){
        console.log("error : ",err.message)
    }
}


export const updatePost = async (req:Request, res:Response, next : NextFunction) => {
    try{
        const {title, content} = req.body;
        if(!req.user){
            return res.status(401).json({ error : "un authenticated"});
        }
        const postid = Number(req.params.id);
        const  post = await prisma.prisma.post.update({ where : { id : postid },
        data : {
            ...(title != undefined && {title}),
            ...(content != undefined && {content})
        }});

        await invalidateCache("posts:all", `posts:${postid}`);
        res.json({
            message : "Post updated successfully",
            post 
        });

    }catch(err:any){
        console.log("err in update : ", err.message);
    }
}


export const deletePost = async (req:Request, res:Response, next: NextFunction) => {
  try {
    const postId = Number(req.params.id);

    await prisma.prisma.post.delete({
      where: { id: postId }
    });

    // Invalidate both caches why
    await invalidateCache( "posts:all",`posts:${postId}`);

    res.json({
      message: "Post deleted successfully"
    });

  } catch (error) {
    next(error);
  }
};
