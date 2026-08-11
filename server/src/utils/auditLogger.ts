import AuditLog from "../models/AuditLog";

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
    await AuditLog.create({
      schoolId: params.schoolId,
      userId: params.userId,
      userName: params.userName,
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
