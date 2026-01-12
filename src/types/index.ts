import { Request } from "express";

interface IUser {
  _id: any;
  username: string;
  email: string;
  fullName: string;
  avatar: string;
  avatar_id: string;
  coverImage?: string;
  cover_id?: string;
  watchHistory: any[];
  password?: string;
  refreshToken?: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: IUser;
    }
  }
}

export {};
