import express from 'express'
import { affectation, affectedTask, autoAffectationIA, deleteAffectation, getAllAffectation, getMyAffectations, respondAffectation, semiAutoAffectation, statut, updateAffectation} from '../controllers/affectationController.js'
import { auth } from '../middlewares/authMiddleware.js';
import {  authorizeRoles } from '../middlewares/isAdmin.js';

export const router = express.Router()


router.post('/affectation', auth, authorizeRoles(['SUPER_ADMIN','COORDINATEUR']),affectation);
router.get('/tasks/affectation',auth, affectedTask)

router.patch('/affectation/:id',auth, statut)
router.get("/affectations/me", auth, getMyAffectations);
router.post("/affectation/respond", auth, respondAffectation);

router.post("/affectation/semi-auto", auth, semiAutoAffectation);
router.post("/affectation/auto", auth, autoAffectationIA)

router.get("/affectations",auth,getAllAffectation)
router.delete('/affectation/:id', auth, deleteAffectation)
router.put('/affectation/:id',auth,updateAffectation)