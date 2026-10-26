import { Notification} from "../models/notificationModel.js";


export const getUserNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ user: req.user._id })
      .sort({ createdAt: -1 });

    res.json(notifications);
  } catch (e) {
    res.status(500).json({ message: "Erreur lors de la récupération" });
  }
};

export const markNotificationAsRead = async (req, res) => {
  try {
    const notif = await Notification.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      { read: true },
      { new: true }
    );

    if (!notif) {
      return res.status(404).json({ message: "Notification introuvable" });
    }

    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ message: "Erreur" });
  }
};

export const dropNtifications = async (req, res) => {

  const dropedAll = await Notification.deleteMany({user:req.user._id})

  if(!dropedAll)  throw new  Error('Erreur lors de suppression des notification')

    res.status(200).json({message:'Notifications supprimes', data: dropedAll})
  
}
