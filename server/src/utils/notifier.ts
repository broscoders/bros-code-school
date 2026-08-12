import Notification from "../models/Notification";

interface NotifyParams {
  schoolId: string;
  userId: string;
  title: string;
  message: string;
  category: "ACADEMIC" | "FINANCE" | "ATTENDANCE" | "ADMISSION" | "SYSTEM" | "COMMUNICATION";
}

export const notify = async (params: NotifyParams) => {
  try {
    await Notification.create(params);
  } catch (err) {
    console.error("Notification failed:", err);
  }
};
