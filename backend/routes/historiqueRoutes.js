import express from "express";
import { deleteAllHistorique, getHistorique } from "../controllers/historiqueController.js";
import { authorizeRoles } from "../middlewares/isAdmin.js";
import { auth } from "../middlewares/authMiddleware.js";



const router = express.Router();

router.get("/historique",auth, authorizeRoles(["SUPER_ADMIN", "COORDINATEUR", "AUDITEUR"]), getHistorique);
router.delete("/historique/delete-all",auth, deleteAllHistorique)
export const historiqueRouter = router;
