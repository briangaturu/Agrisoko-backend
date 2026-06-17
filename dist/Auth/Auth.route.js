"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authRouter = void 0;
const express_1 = require("express");
const Auth_controller_1 = require("./Auth.controller");
exports.authRouter = (0, express_1.Router)();
// Register (Create account)
exports.authRouter.post("/register", Auth_controller_1.createUser);
// Login
exports.authRouter.post("/login", Auth_controller_1.loginUser);
// Request password reset (send email link)
exports.authRouter.post("/password-reset", Auth_controller_1.passwordReset);
// Reset password using token
exports.authRouter.put("/reset-password/:token", Auth_controller_1.updatePassword);
