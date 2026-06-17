"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.emailjsRouter = void 0;
const express_1 = require("express");
const emailjs_controller_1 = require("./emailjs.controller");
exports.emailjsRouter = (0, express_1.Router)();
exports.emailjsRouter.post("/send", emailjs_controller_1.sendEmail);
