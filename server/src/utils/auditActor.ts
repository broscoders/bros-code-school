import type { AuthRequest } from "../middleware/authMiddleware";
import User from "../models/User";

// The name written into audit logs / "uploaded by" / "invited by" fields must
// come from the logged-in account, not from the request body. Before, those
// values were whatever the browser sent (`changedByName`, `markedByName`,
// ...), so anyone could make the audit trail say another person did it.
export async function actorName(req: AuthRequest): Promise<string> {
  try {
    const u = await User.findById(req.user!.userId).select("name");
    return u?.name || "Unknown";
  } catch {
    return "Unknown";
  }
}
