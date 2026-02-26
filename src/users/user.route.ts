import {Router} from "express";
import { getUserById, getUsers, createUser, updateUser,deleteUser } from "./user.controller";

export const userRouter = Router();


//Gell all users
userRouter.get("/",getUsers);
//Get user by id
userRouter.get("/:id",getUserById);
//Create user
userRouter.post("/",createUser);
//update user
userRouter.put("/:id",updateUser);
//delete user
userRouter.delete("/:id",deleteUser);