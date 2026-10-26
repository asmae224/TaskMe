import { Affectation } from '../models/affectationModel.js';
import { Task } from '../models/TaskModel.js';
import { User } from '../models/userModel.js';
import { addHistorique } from '../services/historyService.js';
import { createNotification } from '../services/notificationServer.js';
import OpenAI from 'openai'
import { emailService } from '../services/emailService.js';
import { assignmentEmailTemplate } from '../emails/emailTemplate.js'
import dotenv from "dotenv"

dotenv.config()


export const affectation = async (req, res) => {
  try {
    const { taskId, auditeur, mode } = req.body;
    if (!taskId || !auditeur || !mode) return res.status(400).json({ message: "taskId, auditeur et mode sont requis" });

    const task = await Task.findById(taskId);
    const user = await User.findById(auditeur);
    if (!task) return res.status(404).json({ message: "Tâche non trouvée" });
    if (!user) return res.status(404).json({ message: "Auditeur non trouvé" });
    if (!req.user) return res.status(401).json({ message: 'Utilisateur non authentifié' });

    const nouvelleAffectation = await Affectation.create({
      task: taskId,
      auditeur,
      auditeurInitial: auditeur,
      mode,
      statut: "en_attente",
      dateCreation: new Date(),
    });

    
    res.status(201).json({ message: "Affectation créée", affectation: nouvelleAffectation });

    
    (async () => {
      try {
        await addHistorique({
          type: "Affectation",
          taskId: task._id,
          affectationId: nouvelleAffectation._id,
          acteur: req.user._id,
          cible: auditeur,
          details: { mode, message: "Affectation manuelle" }
        });

        await createNotification({
          user: auditeur,
          title: "Affectation",
          message: `Vous avez été affecté à la tâche "${task.nom}".`,
          link: `/tasks/${task._id}`
        });

        if (user.email) {
          await emailService.sendEmail(
            user.email,
            "Nouvelle affectation",
            assignmentEmailTemplate(task.nom, `${user.firstName} ${user.lastName}`)
          );
        }
      } catch (err) {
        console.error("Erreur async affectation:", err);
      }
    })();

  } catch (err) {
    console.error("Erreur serveur affectation:", err);
    if (!res.headersSent) res.status(500).json({ message: 'Erreur serveur : ' + err.message });
  }
};




export const affectedTask = async (req, res) => {
  try {
    const affectations = await Affectation
      .find()
      .populate("task")
      .populate("auditeur");

    res.json({
      estAffectee: affectations.filter(a => a.statut !== "en_attente"),
      enAttente: affectations.filter(a => a.statut === "en_attente"),
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// pour mise a jour le statut d'affectation

export const statut = async (req, res) => {
  try {
    const { id } = req.params;
    const { statut, justification } = req.body;

    if (!["accepte", "refuse"].includes(statut)) {
      return res.status(400).json({ message: "Statut invalide" });
    }

    const affectation = await Affectation.findById(id);
    if (!affectation) {
      return res.status(404).json({ message: "Affectation non trouvée" });
    }

    affectation.statut = statut;
    if (statut === "refuse") affectation.justification = justification;

    await affectation.save();

    res.json({ message: "Statut mis à jour", affectation });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateAffectation = async(req,res) => {
  try {
    const {id} =req.params
    const updatedAffec = await Affectation.findByIdAndUpdate(id,{ ...req.body}, { new: true, runValidators: true })
    if(!updatedAffec) res.status(401).json({message:'une erreur se produit lors de recuperartion de affectation'})
    res.status(200).json({message:"Affectation modifie avec succes", data:updatedAffec})
  } catch (error) {
    res.status(401).json({message:error.message})
  }
}
// les affectations de user connecte

export const getMyAffectations = async (req, res) => {
  try {
    if (!req.user?._id) {
      return res.status(401).json({ message: "Utilisateur non authentifié" });
    }

    const affectations = await Affectation.find({
        $or: [
          { auditeur: req.user._id },       
          { auditeurPropose: req.user._id } 
        ]
      })
      .populate("task")
      .populate("auditeur")      // pour afficher le nom de user initial
      .populate("auditeurInitial").
      populate('auditeurPropose') // pour savoir qui a delegue

    res.json({ affectations });
    console.log('affectations récupérées :', affectations);

  } catch (error) {
    res.status(500).json({ message: "Erreur serveur" });
  }
}

// Accept / Refuse / Delegate
export const respondAffectation = async (req, res) => {
  try {
    const { affectationId, status, justification, delegatedTo } = req.body;

    if (!affectationId || !status) {
      return res.status(400).json({ message: "affectationId et status sont requis" });
    }

    const admins = await User.find({ role: "COORDINATEUR" });

    const affectation = await Affectation.findById(affectationId)
      .populate("task")
      .populate("auditeur")
      .populate("auditeurPropose")
      .populate("auditeurInitial");

    if (!affectation) {
      return res.status(404).json({ message: "Affectation introuvable" });
    }

    const isDelegateResponse =
      affectation.auditeurPropose &&
      affectation.auditeurPropose._id.toString() === req.user._id.toString();

    //si user accepte la tache
    if (status === "accept") {
      //si on a delegation qui va etre accepte
      if (isDelegateResponse) {
        //  delegatedTo devient auditeur principal
        affectation.auditeur = req.user._id;
        affectation.auditeurPropose = null;
        affectation.auditeurInitial = null;
        affectation.confirmationDelegation = "acceptee";
        affectation.statut = "en_attente";
      } else {
        affectation.statut = "accepte";
      }

      affectation.delaisExpiration = null;
      await affectation.save();
      await addHistorique({
        type: isDelegateResponse ? "Acceptation de delegation" : "Acceptation d'affectation",
        taskId: affectation.task._id,
        affectationId: affectation._id,
        acteur: req.user._id
      });

      for (const admin of admins) {
        await createNotification({
          user: admin._id,
          title: isDelegateResponse ? "Délégation acceptée" : "Affectation acceptée",
          message: `${req.user.firstName} ${req.user.lastName} a accepté la tâche '${affectation.task.nom}'.`,
          link: `/tasks/${affectation.task._id}`
        });
      }

      
      

      return res.json({ message: "Affectation acceptée", affectation });
    }

   //en cas de refus
    if (status === "refuse") {
      if (!justification) {
        return res.status(400).json({ message: "Justification requise" });
      }

      if (isDelegateResponse) {
        // si le delegatedTo refuse la delegation donc la tache retourne vers user initial
        affectation.confirmationDelegation = "refusee";
        affectation.statut = "en_attente";

        if (affectation.auditeurInitial) {
          affectation.auditeur = affectation.auditeurInitial;
        }

        affectation.auditeurPropose = null;
        affectation.auditeurInitial = null;
        affectation.justificationRefus = justification;
      } else {
        affectation.statut = "refuse";
        affectation.justificationRefus = justification;
      }
      await affectation.save(); 
      await addHistorique({
        type: isDelegateResponse ? "Refus de delegation" : "Un refus d'affectation",
        taskId: affectation.task._id,
        affectationId: affectation._id,
        acteur: req.user._id,
        details: { justification }
      });
      if (isDelegateResponse && affectation.auditeur) {
        await createNotification({
          user: affectation.auditeur,
          title: "Délégation refusée",
          message: `${req.user.firstName} ${req.user.lastName} a refusé la délégation de '${affectation.task.nom}'.`,
          link: `/tasks/${affectation.task._id}`
        });
      }


      for (const admin of admins) {
        await createNotification({
          user: admin._id,
          title: isDelegateResponse ? "Délégation refusée" : "Affectation refusée",
          message: isDelegateResponse
            ? `${req.user.firstName} ${req.user.lastName} a refusé la délégation de '${affectation.task.nom}'.`
            : `${req.user.firstName} ${req.user.lastName} a refusé la tâche '${affectation.task.nom}'.`,
          link: `/tasks/${affectation.task._id}`
        });
      }
      return res.json({ message: "Refus enregistré", affectation });
    }

    //cas de delegtion
    if (status === "delegate") {
      if (!delegatedTo) {
        return res.status(400).json({ message: "Auditeur pour délégation requis" });
      }

      const delegatedUser = await User.findById(delegatedTo);
      if (!delegatedUser) {
        return res.status(404).json({ message: "Auditeur délégué introuvable" });
      }

      affectation.statut = "delegue";
      affectation.auditeurPropose = delegatedTo;
      affectation.auditeurInitial = affectation.auditeur;
      affectation.confirmationDelegation = "en_attente";
      affectation.delaisExpiration = new Date(Date.now() + 15 * 60 * 1000);
      affectation.justificationValidation = justification || "";


      await affectation.save();
      io.to(delegatedTo.toString()).emit("affectation:new", {
                affectationId: affectation._id,
                task: affectation.task,
                statut: "delegue"
              })

              //envoyer une notification a user delegue
      await createNotification({
        user: delegatedTo,
        title: "Tâche déléguée",
        message: `Une tâche vous a été déléguée par ${req.user.firstName} ${req.user.lastName}.`,
        link: `/tasks/${affectation.task._id}`
      });

      
      for (const admin of admins) {
        await createNotification({
          user: admin._id,
          title: "Délégation de tâche",
          message: `${req.user.firstName} ${req.user.lastName} a délégué '${affectation.task.nom}' à ${delegatedUser.firstName} ${delegatedUser.lastName}.`,
          link: `/affectations/${affectation._id}`
        });
      }

      // ENVOYE UN EMAIL AUSSI AU DELEGUE
      if (delegatedUser.email) {
        await emailService.sendEmail(
          delegatedUser.email,
          "Nouvelle tâche déléguée",
          assignmentEmailTemplate(
            affectation.task.nom,
            `${delegatedUser.firstName} ${delegatedUser.lastName}`
          ).replace(
            '</p>',
            `<p>Veuillez accepter ou refuser cette délégation dans les 24 heures.</p></p>`
          )
        );
      }
      return res.json({ message: "Délégation envoyée", affectation });
    }

    return res.status(400).json({ message: "Status invalide" });

  } catch (err) {
    return res.status(500).json({ message: "Erreur : " + err.message });
  }
}



export const semiAutoAffectation = async (req, res) => {
  try {
    const task = await Task.findById(req.params.taskId);
    if (!task) return res.status(404).json({ success: false, message: "Tâche introuvable" });

    // Filtrer auditeurs valides
    let candidates = await User.find({
      specialite: { $in: task.specialites },
      grade: { $in: task.grades },
      role: "AUDITEUR",
      actif: true
    });

    // Vérifier chevauchement
    candidates = await Promise.all(candidates.map(async user => {
      const overlapping = await Affectation.findOne({
        auditeur: user._id,
        statut: { $in: ["en_attente", "accepte"] },
      }).populate("task");

      if (!overlapping) return user;
      const t = overlapping.task;
      const overlap = (t.dateDebut <= task.dateFin && t.dateDebut >= task.dateDebut) ||
                      (t.dateFin >= task.dateDebut && t.dateFin <= task.dateFin);
      return overlap ? null : user;
    }));
    candidates = candidates.filter(u => u !== null);

    // Trier par nombre de tâches
    const candidatesWithCount = await Promise.all(candidates.map(async user => ({
      user,
      taskCount: await Affectation.countDocuments({ auditeur: user._id })
    })));
    candidatesWithCount.sort((a, b) => a.taskCount - b.taskCount);

    const proposals = candidatesWithCount.slice(0, task.nombrePlaces).map(c => ({
      userId: c.user._id,
      name: `${c.user.firstName} ${c.user.lastName}`,
      taskCount: c.taskCount,
      justification: `Disponible, grade ${c.user.grade}, spécialité ${c.user.specialite}`
    }));

    res.json({ success: true, taskId: task._id, proposals });

    // Traitement async : historique, notifications, emails
    (async () => {
      try {
        await addHistorique({
          type: "Affectation",
          taskId: task._id,
          affectationId: null,
          acteur: req.user._id,
          details: { message: "Propositions semi-automatiques générées", proposals }
        });

        for (const p of proposals) {
          const candidate = await User.findById(p.userId);
          if (!candidate) continue;

          await createNotification({
            user: candidate._id,
            title: "Proposition semi-automatique",
            message: `Vous êtes proposé pour la tâche "${task.nom}".`,
            link: `/tasks/${task._id}`
          });

          if (candidate.email) {
            await emailService.sendEmail(
              candidate.email,
              "Proposition d'affectation semi-automatique",
              assignmentEmailTemplate(task.nom, `${candidate.firstName} ${candidate.lastName}`)
            );
          }
        }
      } catch (err) {
        console.error("Erreur async semi-auto:", err);
      }
    })();

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Erreur serveur: " + err.message });
  }
};

export const  getAllAffectation = async(req, res) =>{

  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit
    
    const affectations = await Affectation.find()
      .populate('task', 'nom ')        
      .populate('auditeur', 'firstName lastName')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 })
    
    const total = await Affectation.countDocuments()


    res.status(200).json({ data: affectations,
      total,
      page,
      totalPages: Math.ceil(total / limit),
     });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

export const deleteAffectation = async (req, res) => {
    try {
      const {id} = req.params
      const deletedAffec = await Affectation.findByIdAndDelete(id)
      // console.log(deleteAffectation);
      await addHistorique({
                          type: "Suppression d'affectation",
                          affectationId: deletedAffec._id,
                          acteur: req.user._id,
                          details: { action: "suppression" }
                          });
      res.status(200).json({message : 'affectation supprime avec succes', 
        data : deleteAffectation
      })
    } catch (error) {
        res.status(401).json({message:`une erreur lors de suppression ${error.message}`})
    }

}



const openai = new OpenAI(
  { 
    apiKey: process.env.OPENAI_API_KEY
  }
)

// export const autoAffectationIA = async (req, res) => {
//   try {
//     const { taskId } = req.body;
//     if (!taskId) return res.status(400).json({ message: "taskId requis" });

//     const task = await Task.findById(taskId);
//     if (!task) return res.status(404).json({ message: "Tâche introuvable" });

//     const users = await User.find({ role: "AUDITEUR", actif: true });

//     // Préparer le prompt
//     const prompt = `
// Tu es un moteur d’affectation professionnelle.
// Retourne UNIQUEMENT ce JSON :
// {
//   "recommendations": [
//     { "userId": "...", "score": 0-100, "reasoning": "..." }
//   ],
//   "summary": "..."
// }
// Données :
// ${JSON.stringify({ task, users })}
// `;

//     // Appel à l’API OpenAI
//     const completion = await openai.chat.completions.create({
//       model: "gpt-4o-mini", 
//       messages: [{ role: "user", content: prompt }],
//       max_tokens: 1000,
//     });

//     let text = completion.choices[0].message.content;

    
//     text = text.replace(/```json|```/g, "").trim();

    
//     let json;
//     try {
//       json = JSON.parse(text);
//     } catch (parseErr) {
//       console.error("Erreur parsing JSON OpenAI :", text);
//       return res.status(500).json({ success: false, message: "Erreur parsing JSON OpenAI" });
//     }

//     const recommendations = json.recommendations || [];
//     const affectationsCreees = [];

    
//     for (const rec of recommendations) {
//       const auditeur = await User.findById(rec.userId);
//       if (!auditeur) continue;

//       const newAff = await Affectation.create({
//         task: task._id,
//         auditeur: auditeur._id,
//         auditeurInitial:auditeur._id,
//         mode: "auto",
//         statut: "en_attente",
//         dateCreation: new Date(),
//       });

//       affectationsCreees.push(newAff);

//       // Notification à l'auditeur
//       await createNotification({
//         user: auditeur._id,
//         title: "Nouvelle affectation ",
//         message: `Vous avez été affecté à la tâche "${task.nom}"`,
//         link: `/tasks/${task._id}`,
//       });

//       // Historique
//       await addHistorique({
//         type: "Affectation",
//         taskId: task._id,
//         affectationId: newAff._id,
//         acteur: req.user._id,
//         cible: auditeur._id,
//         details: { message: "Affectation automatique via OpenAI" },
//       });
//     }

//     res.json({
//       success: true,
//       taskId: task._id,
//       affectations: affectationsCreees,
//       summary: json.summary || "",
//     });

//   } catch (err) {
//     console.error("Erreur autoAffectationIA:", err);
//     res.status(500).json({ success: false, message: "Erreur serveur : " + err.message });
//   }
// };


// ===== AFFECTION AUTO VIA IA =====

export const autoAffectationIA = async (req, res) => {
  try {
    const { taskId } = req.body;
    if (!taskId) return res.status(400).json({ message: "taskId requis" });

    const task = await Task.findById(taskId);
    if (!task) return res.status(404).json({ message: "Tâche introuvable" });

    const users = await User.find({ role: "AUDITEUR", actif: true });

    const prompt = `
Tu es un moteur d’affectation professionnelle.
Retourne UNIQUEMENT ce JSON :
{
  "recommendations": [
    { "userId": "...", "score": 0-100, "reasoning": "..." }
  ],
  "summary": "..."
}
Données :
${JSON.stringify({ task, users })}
`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 400, 
      request_timeout: 10_000 // 10 secondes
    });

    let text = completion.choices[0].message.content.replace(/```json|```/g, "").trim();
    let json;
    try { json = JSON.parse(text); } 
    catch { return res.status(500).json({ success: false, message: "Erreur parsing JSON OpenAI" }); }

    
    res.json({ success: true, taskId: task._id, recommendations: json.recommendations, summary: json.summary || "" });

    // traitement async : créer affectations, notifications, emails, historique
    (async () => {
      try {
        for (const rec of json.recommendations) {
          const auditeur = await User.findById(rec.userId);
          if (!auditeur) continue;

          const newAff = await Affectation.create({
            task: task._id,
            auditeur: auditeur._id,
            auditeurInitial: auditeur._id,
            mode: "auto",
            statut: "en_attente",
            dateCreation: new Date(),
          });

          await createNotification({
            user: auditeur._id,
            title: "Nouvelle affectation",
            message: `Vous avez été affecté à la tâche "${task.nom}".`,
            link: `/tasks/${task._id}`
          });

          await addHistorique({
            type: "Affectation",
            taskId: task._id,
            affectationId: newAff._id,
            acteur: req.user._id,
            cible: auditeur._id,
            details: { message: "Affectation automatique via OpenAI" }
          });

          if (auditeur.email) {
            await emailService.sendEmail(
              auditeur.email,
              "Nouvelle affectation automatique",
              assignmentEmailTemplate(task.nom, `${auditeur.firstName} ${auditeur.lastName}`)
            );
          }
        }
      } catch (err) {
        console.error("Erreur async auto IA:", err);
      }
    })();

  } catch (err) {
    console.error("Erreur autoAffectationIA:", err);
    if (!res.headersSent) res.status(500).json({ success: false, message: "Erreur serveur : " + err.message });
  }
};
