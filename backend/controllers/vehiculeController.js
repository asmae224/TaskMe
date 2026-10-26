import { User } from "../models/userModel.js";
import { Vehicle } from "../models/vehiculeModel.js";
import { createNotification } from "../services/notificationServer.js";
import { Task } from "../models/TaskModel.js";

import { addHistorique } from "../services/historyService.js";


export const getVehicles = async (req, res) => {
  try {
    const vehicles = await Vehicle.find();
    res.json({ success: true, vehicles });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};


export const createVehicle = async (req, res) => {
  try {
    const { immatriculation, marque, modele, annee, description, disponible, ville } = req.body;

    if (!immatriculation || !marque || !modele || !annee || !ville) {
      return res.status(400).json({ success: false, message: "Champs obligatoires manquants" });
    }

    const existing = await Vehicle.findOne({ immatriculation });
    if (existing) {
      return res.status(400).json({ success: false, message: "Véhicule déjà existant" });
    }

    const vehicle = new Vehicle({
      immatriculation,
      marque,
      modele,
      annee,
      description,
      disponible: disponible ?? true,
      ville,
      occupations: []
    });

    await vehicle.save();

    await addHistorique({
                type: "Creation de vehicule",
                vehiculeId: vehicle._id,
                acteur: req.user._id,
                details: { action: "creation" }
                });
    
    // notifications coordinateurs
    const coords = await User.find({ role: "COORDINATEUR" });
    coords.forEach(c =>
      createNotification({
        user: c._id,
        title: "Nouveau véhicule",
        message: `Le véhicule ${vehicle.immatriculation} a été ajouté.`,
        link: "/vehiculemanagement"
      })
    );

    res.json({ success: true, vehicle });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};


export const updateVehicle = async (req, res) => {
  try {
    const { id } = req.params;

    const updated = await Vehicle.findByIdAndUpdate(id, req.body, {
      new: true
    });

    if (!updated) {
      return res.status(404).json({ success: false, message: "Véhicule non trouvé" });
    }
    await addHistorique({
                type: "Modification de vehicule",
                vehiculeId: updeted._id,
                acteur: req.user._id,
                details: { action: "modification" }
                });
    // notifications
    const coords = await User.find({ role: "COORDINATEUR" });
    coords.forEach(c =>
      createNotification({
        user: c._id,
        title: "Véhicule modifié",
        message: `Le véhicule ${updated.immatriculation} a été mis à jour.`,
        link: "/vehiculemanagement"
      })
    );

    res.json({ success: true, vehicle: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};


export const deleteVehicle = async (req, res) => {
  try {
    const { id } = req.params;

    const deleted = await Vehicle.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: "Véhicule non trouvé" });
    }
    await addHistorique({
                type: "Suppression de vehicule",
                vehiculeId: deleted._id,
                acteur: req.user._id,
                details: { action: "suppression" }
                });
    // notifications
    const coords = await User.find({ role: "COORDINATEUR" });
    coords.forEach(c =>
      createNotification({
        user: c._id,
        title: "Véhicule supprimé",
        message: `Le véhicule ${deleted.immatriculation} a été supprimé.`,
        link: "/vehiculemanagement"
      })
    );

    res.json({ success: true, message: "Véhicule supprimé" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};


export const getAvailableVehicles = async (req, res) => {
  try {
    const { dateDebut, dateFin, ville } = req.query;

    if (!dateDebut || !dateFin || !ville) {
      return res.status(400).json({
        success: false,
        message: "Veuillez fournir dateDebut, dateFin et ville"
      });
    }

    const start = new Date(dateDebut);
    const end = new Date(dateFin);

    if (start > end) {
      return res.status(400).json({
        success: false,
        message: "dateDebut doit être ≤ dateFin"
      });
    }

    const vehicles = await Vehicle.find({ ville });

    const available = vehicles.filter(v =>
      !v.occupations.some(o => start <= o.end && end >= o.start)
    );

    res.json({ success: true, vehicles: available });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};


export const assignVehicle = async (req, res) => {
  try {
    const { id } = req.params; // id du véhicule
    const { taskId } = req.body;

    const vehicle = await Vehicle.findById(id);
    if (!vehicle) return res.status(404).json({ success: false, message: "Véhicule non trouvé" });

    const task = await Task.findById(taskId);
    if (!task) return res.status(404).json({ success: false, message: "Tâche non trouvée" });

    if (!task.vehiculeRequis) {
      return res.status(400).json({ success: false, message: "Cette tâche ne requiert pas de véhicule" });
    }

    if (task.ville !== vehicle.ville) {
      return res.status(400).json({ success: false, message: "Ville de la tâche incompatible avec le véhicule" });
    }

    const start = new Date(task.dateDebut);
    const end = new Date(task.dateFin);

    // conflict check
    const conflict = vehicle.occupations.some(o =>
      start <= o.end && end >= o.start
    );

    if (conflict) {
      return res.status(400).json({ success: false, message: "Véhicule déjà réservé sur cette période" });
    }

    // add reservation
    vehicle.occupations.push({
      start,
      end,
      taskId: task._id,
      taskTitle: task.nom
    });

    await vehicle.save();

    // link vehicle to task
    task.vehicule = vehicle._id;
    await task.save();

    // notifications
    const admins = await User.find({ role: 'SUPER_ADMIN' });
    const coords = await User.find({ role: 'COORDINATEUR' });
    await addHistorique({
                    type: "Affectation d'une vehicule",
                    taskId:taskId,
                    vehiculeId: vehicle._id,
                    acteur: req.user._id,
                    details: { action: "suppression" }
                    });
    [...admins, ...coords].forEach(u =>
      createNotification({
        user: u._id,
        title: "Véhicule assigné",
        message: `Le véhicule ${vehicle.immatriculation} a été assigné à la tâche "${task.nom}".`,
        link: "/vehiculemanagement"
      })
    );

    res.json({ success: true, vehicle });

  } catch (err) {
    console.error("assignVehicle error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};
