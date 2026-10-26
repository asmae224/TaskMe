export const assignmentEmailTemplate = (taskName, auditeurName) => `
  <div style="font-family: Arial, sans-serif; background-color: #f5f5f5; padding: 20px;">
    <div style="max-width: 600px; margin: auto; background-color: #ffffff; padding: 30px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
      <h2 style="color: #2c3e50; text-align: center;">Nouvelle Affectation</h2>
      <p style="font-size: 16px; color: #34495e;">Bonjour <strong>${auditeurName}</strong>,</p>
      <p style="font-size: 16px; color: #34495e;">
        Vous avez une nouvelle tâche qui vous a été assignée :
      </p>
      <p style="font-size: 18px; color: #2c3e50; font-weight: bold; background-color: #ecf0f1; padding: 10px; border-radius: 4px; text-align: center;">
        ${taskName}
      </p>
      <p style="font-size: 16px; color: #34495e;">Merci d’utiliser <strong>TaskMe</strong> !</p>
      <hr style="border: none; border-top: 1px solid #bdc3c7; margin: 20px 0;">
      <p style="font-size: 12px; color: #7f8c8d; text-align: center;">
        Ceci est un e-mail automatique, veuillez ne pas répondre.
      </p>
    </div>
  </div>
`;
