import express from 'express'
import { allUsers, createUser, deleteUser, distribution, getToken, loginUser, logout, updateUser } from '../controllers/userController.js'
import { authorizeRoles } from '../middlewares/isAdmin.js'
import { auth } from '../middlewares/authMiddleware.js'

export const router = express.Router()


router.post('/register',createUser)
router.post('/login', loginUser)
router.get('/user', getToken)
router.get('/logout', logout)
router.get('/users',auth,allUsers);
router.delete('/user/:id',auth, authorizeRoles(['SUPER_ADMIN', 'COORDINATEUR']),deleteUser)
router.get('/users/distribution', auth,authorizeRoles(['SUPER_ADMIN',"COORDINATEUR"]), distribution)
router.put('/user/:id',auth, authorizeRoles(['SUPER_ADMIN', 'COORDINATEUR']), updateUser)
