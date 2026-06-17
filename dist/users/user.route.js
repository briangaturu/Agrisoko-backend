"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userRouter = void 0;
const express_1 = require("express");
const user_controller_1 = require("./user.controller");
exports.userRouter = (0, express_1.Router)();
//Gell all users
exports.userRouter.get("/", user_controller_1.getUsers);
//Get user by id
exports.userRouter.get("/:id", user_controller_1.getUserById);
//Create user
exports.userRouter.post("/", user_controller_1.createUser);
//update user
exports.userRouter.put("/:id", user_controller_1.updateUser);
//delete user
exports.userRouter.delete("/:id", user_controller_1.deleteUser);
