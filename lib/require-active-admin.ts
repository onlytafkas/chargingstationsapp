import { getUserInfo } from "@/data/usersinfo";

export class AdminAuthorizationError extends Error {
  constructor(message: "Unauthorized" | "Forbidden: Admin access required") {
    super(message);
    this.name = "AdminAuthorizationError";
  }
}

export async function requireActiveAdminUser(userId: string | null | undefined) {
  if (!userId) {
    throw new AdminAuthorizationError("Unauthorized");
  }

  const userInfo = await getUserInfo(userId);
  if (!userInfo?.isAdmin || !userInfo?.isActive) {
    throw new AdminAuthorizationError("Forbidden: Admin access required");
  }

  return { userId, userInfo };
}