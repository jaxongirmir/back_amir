import { User } from "../shared/schema";

declare global {
  namespace Express {
    interface Request {
      user?: User;
      isAuthenticated(): boolean;
    }

    interface User extends User {
      id: number;
      username: string;
      password: string;
    }
  }
}
