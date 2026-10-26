import { Notification } from '../models/notificationModel.js';

export const createNotification = async ({ user, title, message, link }) => {
  const notif = await Notification.create({
    user,
    title,
    message,
    link,
  });

  if (global.io) {
    global.io.to(`user:${user.toString()}`).emit('notification:new', notif);
  }

  return notif;
};

