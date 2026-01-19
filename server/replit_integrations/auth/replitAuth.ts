import type { Express, RequestHandler } from "express";
import session from "express-session";

export function getSession() {
  return session({
    secret: "dummy-secret",
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }
  });
}

export async function setupAuth(app: Express) {
  app.use(getSession());
  app.use((req: any, res, next) => {
    // Mock user for development
    req.user = {
      claims: {
        sub: "dummy-user-id",
        email: "user@example.com",
        first_name: "User",
        last_name: "Test"
      }
    };
    req.isAuthenticated = () => true;
    next();
  });
}

export const isAuthenticated: RequestHandler = (req, res, next) => {
  next();
};
