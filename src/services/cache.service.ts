import {redis} from "../config/redis.js";

export async function getOrSetCache(key : string, fetchData : Function, ttl=60){

    // check redis
    if(redis.isReady){
        try{
            const cachedData = await redis.get(key);
            if(cachedData != null && typeof cachedData == "string"){
                console.log("CACHE HIT : ", key);
                return {
                    data : JSON.parse(cachedData),
                    cacheStatus : "HIT",
                }
            }
        }catch(err:any){
            console.log("error : ", err.message);
        }
    }

    // if not found
    console.log("CACHE MISS : ", key);
    const data = await fetchData();

    // store in redis
    if(redis.isReady){
        try{
            const ttlJitter = ttl + Math.floor(Math.random() * 10);
            await redis.set(key,JSON.stringify(data), { EX : ttlJitter});
        }catch(error:any){
        console.log("Error in storeing in redis", error.message)
        }
    }
    return { data : data, cacheStatus : "MISS"};
}





export async function invalidateCache(...keys : string[]){
    if(!redis.isReady || keys.length === 0) return;
    try{
        await redis.del(keys);
        console.log("CACHE Invalidate : ",keys);
    }catch(err:any){
        console.log("cache invalidate failed : ", err.message);
    }
}