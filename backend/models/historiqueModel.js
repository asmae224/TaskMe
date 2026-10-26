import mongoose from "mongoose";

const historiqueSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true
  },

  taskId: { type: mongoose.Schema.Types.ObjectId, ref: "Task" },
  affectationId: { type: mongoose.Schema.Types.ObjectId, ref: "Affectation" },
  vehiculeId : {type:mongoose.Schema.Types.ObjectId, ref:'Vehicle'},

  acteur: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, 
  cible: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, 

  details: { type: Object, default: {} },

  date: { type: Date, default: Date.now }
});

export const Historique = mongoose.model('Historique', historiqueSchema)