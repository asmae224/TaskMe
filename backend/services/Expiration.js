import { Affectation } from '../models/affectationModel.js';
import { createNotification } from './notificationServer.js';
import { emailService } from './emailService.js';
import { assignmentEmailTemplate } from '../emails/emailTemplate.js';

export const checkDelegationExpirations = async () => {
  try {
    const now = new Date();

    const expiredDelegations = await Affectation.find({
      statut: "delegue",
      confirmationDelegation: "en_attente",
      delaisExpiration: { $lte: now }
    }).populate("task auditeur auditeurInitial auditeurPropose");

    for (const aff of expiredDelegations) {
      if (!aff.auditeurInitial) continue; 

      // Remettre la tache a auditeur initial
      aff.statut = "en_attente";
      aff.auditeur = aff.auditeurInitial;
      aff.auditeurInitial = null;
      aff.auditeurPropose = null
      aff.confirmationDelegation = "refusee";
      aff.justificationRefus = "Délégation non acceptée dans le temps imparti";
      await aff.save();

      // Notification à l’auditeur initial
      await createNotification({
        user: aff.auditeur._id,
        title: "Retour de tâche",
        message: `La tâche '${aff.task.nom}' déléguée à ${aff.auditeurPropose.firstName} ${aff.auditeurPropose.lastName} a été refusée ou non répondue. Elle vous est retournée.`,
        link: `/tasks/${aff.task._id}`
      });

      // Email à l’auditeur initial
      if (aff.auditeur.email) {
        await emailService.sendEmail(
          aff.auditeur.email,
          "Retour de tâche suite à délégation non répondue",
          assignmentEmailTemplate(
            aff.task.nom,
            `${aff.auditeur.firstName} ${aff.auditeur.lastName}`
          ).replace(
            '</p>',
            `<p>La délégation de cette tâche a été refusée ou non répondue dans le temps imparti. Elle vous est retournée automatiquement.</p></p>`
          )
        );
      }
    }

    if (expiredDelegations.length > 0) {
      console.log(`${expiredDelegations.length} délégations expirées traitées.`);
    }
  } catch (err) {
    console.error("Erreur checkDelegationExpirations:", err);
  }
};

