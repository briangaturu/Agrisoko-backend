import {RateLimiterMemory} from "rate-limiter-flexible";
import { NextFunction,Request,Response } from "express";   

const rateLimiter = new RateLimiterMemory({
    points: 10,
    duration: 60
})

export const rateLimiterMiddleware = async(req:Request, res:Response, next: NextFunction)=>{


try{
await rateLimiter.consume(req.ip || 'unkown');
console.log ('Rate limit check passed for ip:${req.ip})')
next()
}
catch (error){
    res.status(429).json({error:"too many requests, please try again later."})
}
}