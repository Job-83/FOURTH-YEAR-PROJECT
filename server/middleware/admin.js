
import prisma from "../config/prisma.js";

// Allow both ADMIN and SUPER_ADMIN into the admin dashboard.
export default async function requireAdmin(req, res, next) {
  try {
    const user = await prisma.user.findUnique({
      where: {
        id: req.userId,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    });

    if (!user) {
      return res.status(401).json({
        status: "error",
        message: "Account not found. Please log in again.",
      });
    }

    if (!["ADMIN", "SUPER_ADMIN"].includes(user.role)) {
      return res.status(403).json({
        status: "error",
        message: "Administrator access is required.",
      });
    }

    req.admin = user;
    next();
  } catch (error) {
    console.error("Admin authorization error:", error);

    return res.status(500).json({
      status: "error",
      message: "Unable to verify administrator access.",
    });
  }
}

// Only SUPER_ADMIN can manage other administrators.
export async function requireSuperAdmin(req, res, next) {
  try {
    const user = await prisma.user.findUnique({
      where: {
        id: req.userId,
      },
      select: {
        id: true,
        role: true,
      },
    });

    if (!user) {
      return res.status(401).json({
        status: "error",
        message: "Account not found. Please log in again.",
      });
    }

    if (user.role !== "SUPER_ADMIN") {
      return res.status(403).json({
        status: "error",
        message: "Only the Super Admin can perform this action.",
      });
    }

    next();
  } catch (error) {
    console.error("Super Admin authorization error:", error);

    return res.status(500).json({
      status: "error",
      message: "Unable to verify Super Admin access.",
    });
  }
}
