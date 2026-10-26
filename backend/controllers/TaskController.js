import { Task } from '../models/TaskModel.js';
import { User } from '../models/userModel.js';
import { addHistorique } from '../services/historyService.js';
import { createNotification } from '../services/notificationServer.js';

export const createTask = async (req, res) => {
  try {
    const filePath = req.file? req.file.path : null
        console.log(filePath);
    if (new Date(req.body.dateDebut) > new Date(req.body.dateFin)) {
        return res.status(400).json({
            message: "dateDebut doit être <= dateFin"
        });
    }

    if (req.body.nombrePlaces < 1)
        return res.status(400).json({ message:"nombrePlaces doit être >= 1" });

        
    const task = await Task.create({
      nom: req.body.nom,
      description: req.body.description,
      type: req.body.type,
      dateDebut: req.body.dateDebut,
      dateFin: req.body.dateFin,
      remuneree: req.body.remuneree,
      prixRemuneree: req.body.remuneree ? req.body.prixRemuneree : undefined,
      specialites: req.body.specialites,
      estCommune: req.body.estCommune,
      grades: req.body.grades,
      vehiculeRequis: req.body.vehiculeRequis,
      ligne: req.body.ligne,
      nombrePlaces: req.body.nombrePlaces,
      ville:req.body.ville,
      adminFile:filePath
    });

    await addHistorique({
      type: "Creation du tache",
      taskId: task._id,
      acteur: req.user._id, 
      details: {
        nom: task.nom,
        type: task.type,
        dateDebut: task.dateDebut,
        nombrePlaces: task.nombrePlaces
      }})
    //    console.log(h)
    const users = await User.find({role:'AUDITEUR'})
    
    for (const u of users) {
        await createNotification({
            user: u._id,
            title: 'Tache ajoutée',
            message: 'Une nouvelle tache est ajoutée, vous pouvez voir les detailles',
            link: `/tasks/${task._id}`
        });
}

    

    return res.status(201).json({
      message: "task created successfully",
      data: task,
    });

  } catch (error) {
    return res.status(500).json({
      message: "error creating task",
      error: error.message,
    });
  }
};

export const getTasks = async (req, res) => {
    try {
        const tasks = await Task.find();
        res.status(200).json({
            date:tasks,
            message:"tasks gotten successfly"
        })
        return (tasks);
    } catch (error) {
        res.status(500).json({
            message:"error getting tasks",
            error:error.message
        })
    }
}

export const getSingleTask = async (req, res) => {

    try {


        const task = await Task.findById(req.params.id);
        if (!task) {
            return res.status(404).json({ message: "Task not found" });
        }
        else{
            return res.status(200).json({
                message:"task gotten successfly",
                data:task
            });
        }
    } catch (error) {
        res.status(500).json({
            message:"error getting task",
            error:error.message
        })
    }
}

export const updateTask = async (req, res) => {
    try {
        if (req.body.dateDebut && req.body.dateFin) {
            if (new Date(req.body.dateDebut) > new Date(req.body.dateFin)) {
                return res.status(400).json({
                    message: "dateDebut doit être <= dateFin"
                });
            }}

        if (req.body.nombrePlaces < 1)
            return res.status(400).json({ message:"nombrePlaces doit être >= 1" });


        const id = req.params.id;
        const taskUpdated = await  Task.findByIdAndUpdate(id, req.body,{
            new :true,
            runValidators:true
        });

        const h =await addHistorique({
            type: "Modification du tache",
            taskId: taskUpdated._id,
            acteur: req.user._id,
            details: req.body 
        });
        const users = await User.find({role:'AUDITEUR'})
    
        for (const u of users) {    
            await createNotification({
                user: u._id,
                title: 'Tache modifiée',
                message: 'Une tâche a été modifiée',
                link: `/tasks/${taskUpdated._id}`
            })
        }
        console.log(h)
        res.status(200).json({
            message:"task updated successfully",
            data:taskUpdated
        })

    } catch (error) {
        res.status(500).json({
            message:"error updating task",
            error:error.message
        })
    }
}

export const deleteTask = async (req, res) =>
{
    try {
        const {id} = req.params
        console.log(id);
        
        const taskDeleted = await Task.findByIdAndDelete(id)
        if(!taskDeleted) {
            console.log('erreur');
            
            res.status(404).json({
                message:"task not found"
            })
        }

        const h = await addHistorique({
            type: "Suppression du tache",
            taskId: taskDeleted._id,
            acteur: req.user._id,
            details: { action: "suppression" }
            });
        console.log(h)
        
        res.status(200).json({
            message:"task deleted successfully",
            data:taskDeleted
        })


    } catch (error) {
        res.status(500).json({
            message:"error deleting task",
            error:error.message
        })
    }
}

