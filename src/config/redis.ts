import {createClient} from "redis";

export const redis = createClient({
    url : process.env.REDIS_URL || "redis://localhost:6379"
})

redis.on("connect",() => {
    console.log("connected to redis");
});


redis.connect().catch(err => console.log("err in connection redis"));