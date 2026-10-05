import Notification from "../models/Notification";

export interface NotifyParams {
  schoolId: string;
  userId: string;
  title: string;
  message: string;
  category: "ACADEMIC" | "FINANCE" | "ATTENDANCE" | "ADMISSION" | "SYSTEM" | "COMMUNICATION" | "HEALTH";
}

export const notify = async (params: NotifyParams) => {
  try {
    await Notification.create(params);
  } catch (err) {
    console.error("Notification failed:", err);
  }
};

// Sends many notifications with ONE database call instead of one per person
// (a class-wide fee run or a result publish used to do hundreds of
// sequential inserts).
export const notifyMany = async (list: NotifyParams[]) => {
  if (list.length === 0) return;
  try {
    await Notification.insertMany(list, { ordered: false });
  } catch (err) {
    console.error("Bulk notification failed:", err);
  }
};
