
import { Historique } from "../models/historiqueModel.js";

export const getHistorique = async (req, res) => {
  try {
    const user = req.user; 
    let filter = {};

    if ( user.role === "COORDINATEUR") {
      filter.acteur=user._id
      filter.type = { $in: ["Affectation", "Suppression du tache", "Modification du tache", "Creation du tache", "Suppression d'affectation","Affectation d'une vehicule"] };
    } else if (user.role === "AUDITEUR") {
      filter.acteur = user._id;
      filter.type = { $in: ["Acceptation de delegation", "Acceptation d'affectation", "Refus de delegation"," Un refus d'affectation",] };
    }else if(user.role === "SUPER_ADMIN" ){
      filter.acteur=user._id
      filter.type={$in: ['creation de vehicule','modification de vehicule',"suppression de vehicule"]}
    }

    const historiques = await Historique.find(filter)
      .populate("acteur", "firstName lastName role")   
      .populate("cible", "firstName lastName")        
      .populate("taskId", "nom title")                
      .sort({ date: -1 });

    res.json(historiques);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erreur serveur" });
  }
};




export const deleteAllHistorique = async (req, res) => {
  try {
    const userId = req.user._id;

    const result = await Historique.deleteMany({
      $or: [
        { acteur: userId },
        { cible: userId }   
      ]
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({
        message: "Aucun historique trouvé pour cet utilisateur"
      });
    }

    res.status(200).json({
      message: "Historique de l'utilisateur supprimé avec succès",
      deletedCount: result.deletedCount
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


