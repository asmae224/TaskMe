import express from 'express';
import { createTask, deleteTask, getSingleTask, getTasks, updateTask } from '../controllers/TaskController.js';
import { authorizeRoles } from '../middlewares/isAdmin.js';
import { auth } from '../middlewares/authMiddleware.js';
import { upload } from '../middlewares/upload.js';

export const router = express.Router();

router.post('/addTask',auth, upload.single('adminFile'), authorizeRoles(['SUPER_ADMIN', 'COORDINATEUR']),createTask)
router.get('/tasks',auth ,getTasks)
router.get('/task/:id',auth ,getSingleTask)
router.put('/task/:id',auth, authorizeRoles(['SUPER_ADMIN', 'COORDINATEUR']),updateTask)
router.delete('/task/:id',auth, authorizeRoles(['SUPER_ADMIN', 'COORDINATEUR']),deleteTask)
