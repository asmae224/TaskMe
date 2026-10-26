import { Historique } from "../models/historiqueModel.js";

export async function addHistorique({
  type,
  taskId = null,
  affectationId = null,
  acteur = null,
  cible = null,
  details = {}
}) {
  if (!type) throw new Error("Le type d'historique est obligatoire");

  await Historique.create({
    type,
    taskId,
    affectationId,
    acteur,
    cible,
    details,
    date: new Date()
  });
}
