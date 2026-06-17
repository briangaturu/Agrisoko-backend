import {RateLimiterMemory} from "rate-limiter-flexible";
import { NextFunction,Request,Response } from "express";   

const rateLimiter = new RateLimiterMemory({
    points: 120,
    duration: 60
})

export const rateLimiterMiddleware = async(req:Request, res:Response, next: NextFunction)=>{


try{
await rateLimiter.consume(req.ip || "unknown");
console.log(`Rate limit check passed for ip:${req.ip}`)
next()
}
catch (error: any){
    const retryAfterSec = Math.max(1, Math.ceil((error?.msBeforeNext || 1000) / 1000));
    res.set("Retry-After", String(retryAfterSec));
    res.status(429).json({
        error: "Too many requests, please try again later.",
        retryAfterSec
    })
}
}