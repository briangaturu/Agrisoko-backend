import { Router } from "express";
import { sendEmail } from "./emailjs.controller";

export const emailjsRouter = Router();

emailjsRouter.post("/send", sendEmail);
