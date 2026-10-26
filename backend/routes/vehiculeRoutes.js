import express from "express";

import { auth } from "../middlewares/authMiddleware.js";
import { authorizeRoles } from "../middlewares/isAdmin.js";
import { assignVehicle, createVehicle, deleteVehicle, getAvailableVehicles, getVehicles, updateVehicle } from "../controllers/vehiculeController.js";

const router = express.Router();

router.get("/", auth, getVehicles);
router.post("/", auth, createVehicle);
router.put("/:id", auth,authorizeRoles(['SUPER_ADMIN']), updateVehicle);
router.delete("/:id", auth,authorizeRoles(['SUPER_ADMIN']), deleteVehicle);
router.get('/available',auth, getAvailableVehicles)
router.post("/assign/:id",auth,authorizeRoles(['COORDINATEUR']), assignVehicle)

export const vehiculeRouter = router;
