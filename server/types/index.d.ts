import { User } from "@prisma/client"; // optional if you want full User typing

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string; // match your Prisma `User.id` type
        email: string; 
        // add more fields if needed
      }; 
    }
  }
}
