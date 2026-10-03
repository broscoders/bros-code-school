import AuditLog from "../models/AuditLog";
import User from "../models/User";

interface LogParams {
  schoolId: string;
  userId: string;
  userName: string;
  userRole: string;
  action: string;
  recordType: string;
  recordId?: string;
  oldValue?: any;
  newValue?: any;
}

export const logAudit = async (params: LogParams) => {
  try {
    // The acting user's name is always looked up from the account itself.
    // Several controllers used to pass a name taken from the request body
    // (e.g. changedByName), which any client could fake in the audit trail.
    let userName = "Unknown";
    try {
      const u = params.userId ? await User.findById(params.userId).select("name") : null;
      if (u?.name) userName = u.name;
    } catch {
      /* fall back to Unknown */
    }
    await AuditLog.create({
      schoolId: params.schoolId,
      userId: params.userId,
      userName,
      userRole: params.userRole,
      action: params.action,
      recordType: params.recordType,
      recordId: params.recordId,
      oldValue: params.oldValue ? JSON.stringify(params.oldValue) : undefined,
      newValue: params.newValue ? JSON.stringify(params.newValue) : undefined,
    });
  } catch (err) {
    console.error("Audit log failed:", err);
  }
};
