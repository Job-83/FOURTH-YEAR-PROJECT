
import "dotenv/config";
import jwt from "jsonwebtoken";

export default function authenticateToken(req, res, next) {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    return res.status(500).json({
      status: "error",
      message: "Authentication is not configured.",
    });
  }

  const authorization = req.headers.authorization;

  if (!authorization || !authorization.startsWith("Bearer ")) {
    return res.status(401).json({
      status: "error",
      message: "Please log in to continue.",
    });
  }

  const token = authorization.slice(7).trim();

  if (!token) {
    return res.status(401).json({
      status: "error",
      message: "Authentication token is missing.",
    });
  }

  try {
    const payload = jwt.verify(token, secret);

    if (
      typeof payload === "string" ||
      !Number.isSafeInteger(payload.userId)
    ) {
      return res.status(401).json({
        status: "error",
        message: "Invalid authentication token.",
      });
    }

    req.userId = payload.userId;
    next();
  } catch {
    return res.status(401).json({
      status: "error",
      message: "Your session is invalid or expired. Please log in again.",
    });
  }
}
