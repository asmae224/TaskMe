import express from 'express';
import { Task } from '../models/TaskModel.js';
import { User } from '../models/userModel.js';
import { ChatMessage } from '../models/chatModel.js';
import mongoose from 'mongoose';
import { auth } from '../middlewares/authMiddleware.js';
import { Affectation } from '../models/affectationModel.js';
import { createNotification } from '../services/notificationServer.js';

const router = express.Router();
// geyt conversations de l'utilisateur

router.get('/conversations', auth, async (req, res) => {
  try {
    const userId = req.user._id;
    console.log(userId);

    const conversations = await ChatMessage.aggregate([
      {
        $match: {
          $or: [
            { sender: new mongoose.Types.ObjectId(userId) },
            { receiver: new mongoose.Types.ObjectId(userId) },
          ],
          messageType: { $in: ['direct', 'group'] },
        },
      },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: {
            $cond: [
              { $eq: ['$sender', new mongoose.Types.ObjectId(userId)] },
              '$receiver',
              '$sender',
            ],
          },
          lastMessage: { $first: '$$ROOT' },
          unreadCount: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ['$receiver', new mongoose.Types.ObjectId(userId)] },
                    { $eq: ['$read', false] },
                  ],
                },
                1,
                0,
              ],
            },
          },
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user',
        },
      },
      { $unwind: '$user' },
      {
        $project: {
          userId: '$user._id',
          userName: { $concat: ['$user.firstName', ' ', '$user.lastName'] },
          userRole: '$user.role',
          userSpecialite: '$user.specialite',
          lastMessage: '$lastMessage.content',
          lastMessageDate: '$lastMessage.createdAt',
          unreadCount: 1,
        },
      },
      { $sort: { lastMessageDate: -1 } },
    ]);

    res.json({ success: true, conversations });
  } catch (err) {
    console.error('CONVERSATIONS ERROR:', err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// get messages avec un utilisateur spécifique
router.get('/direct/:userId', auth, async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user._id;

    // Vérifier que l'utilisateur existe et est actif
    const targetUser = await User.findById(userId);
    if (!targetUser) {
      return res
        .status(404)
        .json({ message: 'Utilisateur introuvable ou désactivé' });
    }

    const messages = await ChatMessage.find({
      $or: [
        { sender: currentUserId, receiver: userId, messageType: 'direct' },
        { sender: userId, receiver: currentUserId, messageType: 'direct' },
      ],
    })
      .populate('sender', 'firstName lastName role specialite')
      .populate('receiver', 'firstName lastName role specialite')
      .sort({ createdAt: 1 });

    // Marquer les messages comme lus
    await ChatMessage.updateMany(
      {
        sender: userId,
        receiver: currentUserId,
        read: false,
      },
      {
        read: true,
        readAt: new Date(),
      }
    );

    res.json({
      success: true,
      messages,
      targetUser: {
        id: targetUser._id,
        firstName: targetUser.firstName,
        lastName: targetUser.lastName,
        role: targetUser.role,
        specialite: targetUser.specialite,
      },
    });
  } catch (err) {
    console.error('DIRECT CHAT ERROR:', err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// POST envoyer message direct
router.post('/direct', auth, async (req, res) => {
  try {
    const { receiverId, content } = req.body;

    if (!receiverId || !content || content.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Destinataire et contenu requis',
      });
    }

    // Vérifier que le destinataire exist
    const receiver = await User.findById(receiverId);
    if (!receiver) {
      return res.status(404).json({
        success: false,
        message: 'Destinataire introuvable ou désactivé',
      });
    }

    // Empêcher l'envoi de message à soi-même
    if (receiverId === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'Vous ne pouvez pas vous envoyer de message',
      });
    }

    const message = new ChatMessage({
      sender: req.user.id,
      receiver: receiverId,
      content: content.trim(),
      messageType: 'direct',
      read: false,
    });

    await message.save();

    // Populer pour la réponse
    const populatedMessage = await ChatMessage.findById(message._id)
      .populate('sender', 'firstName lastName role')
      .populate('receiver', 'firstName lastName role');

    res.status(201).json({
      success: true,
      message: populatedMessage,
    });
    const notif = await createNotification({
      user: receiverId,
      title: `Nouveau message est envoye par ${req.user.firstName}`,
      message: content.substring(0, 70) + '...',
      link: `/chat/direct/${receiverId}`,
    });
    // console.log('notification cree',notif);
  } catch (err) {
    console.error('SEND DIRECT ERROR:', err);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur',
    });
  }
});
// ENVOYER UN MES

router.post('/send/:taskId', auth, async (req, res) => {
  try {
    const { content } = req.body;
    const { taskId } = req.params;

    if (!content || content.trim() === '') {
      return res.status(400).json({ message: 'Message vide' });
    }

    const task = await Task.findById(taskId);
    if (!task) return res.status(404).json({ message: 'Tâche introuvable' });

    const userId = req.user.id; // ou _id selon ton auth middleware

    const affectations = await Affectation.find({ task: taskId }).populate(
      'auditeur'
    );

    const isAdmin = ['SUPER_ADMIN', 'COORDINATEUR'].includes(req.user.role);

    const isAssigned = affectations.some(
      (a) => a.auditeur && a.auditeur._id.equals(userId)
    );

    if (!isAssigned && !isAdmin) {
      return res.status(403).json({ message: 'Accès refusé au chat' });
    }

    const message = new ChatMessage({
      sender: userId,
      task: taskId,
      content,
      messageType: 'group',
    });

    await message.save();

    const populatedMessage = await ChatMessage.findById(message._id).populate(
      'sender',
      'firstName lastName role'
    );

    // Notifications
    const participants = affectations
      .map((a) => a.auditeur?._id)
      .filter(Boolean);
    for (const participantId of participants) {
      if (participantId.equals(userId)) continue;
      try {
        await createNotification({
          user: participantId,
          title: `Nouveau message dans la tâche : ${task.titre || task.nom}`,
          message: content.substring(0, 70) + '...',
          link: `/chat/task/${taskId}`,
        });
      } catch (e) {
        console.error('Erreur création notification pour', participantId, e);
      }
    }

    res.status(201).json({ success: true, message: populatedMessage });
  } catch (err) {
    console.error('CHAT POST ERROR:', err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

router.get('/unread', auth, async (req, res) => {
  try {
    const userId = req.user._id;
    const unreadCount = await ChatMessage.countDocuments({
      receiver: userId,
      read: false,
    });
    console.log(unreadCount);
    
    res.json({ unreadCount });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
})

// GET messages d'une tâche

router.get('/:taskId', auth, async (req, res) => {
  try {
    const { taskId } = req.params;
    const userId = req.user.id;

    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ message: 'Tâche introuvable' });
    }

    // Récupérer les affectations pour cette tâche
    const affectations = await Affectation.find({ task: taskId });

    const isAdmin = ['SUPER_ADMIN', 'COORDINATEUR'].includes(req.user.role);
    const isAssigned = affectations.some((a) => a.auditeur.equals(userId));

    if (!isAssigned && !isAdmin) {
      return res.status(403).json({ message: 'Accès refusé au chat' });
    }

    // Récupérer les messages
    const messages = await ChatMessage.find({ task: taskId })
      .populate('sender', 'firstName lastName role')
      .sort({ createdAt: 1 });

    res.json({
      success: true,
      messages,
    });
  } catch (err) {
    console.error('CHAT GET ERROR:', err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
})

export const chatRouter = router;
