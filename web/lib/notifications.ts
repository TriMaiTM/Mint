import { prisma } from "./prisma";

export async function createNotification(
  userId: string,
  title: string,
  message: string,
  type: "INFO" | "SUCCESS" | "TRANSFER" | "PURCHASE" | "SALE"
) {
  try {
    const notification = await prisma.notification.create({
      data: {
        userId,
        title,
        message,
        type,
      },
    });
    return notification;
  } catch (error) {
    console.error(`[createNotification] Failed to create notification for user ${userId}:`, error);
    return null;
  }
}
