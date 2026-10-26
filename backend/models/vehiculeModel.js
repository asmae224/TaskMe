import mongoose from "mongoose";

const vehicleSchema = new mongoose.Schema(
  {
    immatriculation: { type: String, required: true, unique: true },
    marque: { type: String, required: true },
    modele: { type: String, required: true },
    annee: { type: Number, required: true },
    disponible: { type: Boolean, default: true },
    description: { type: String },
    occupations: [
  {
    start: { type: Date, required: true },
    end: { type: Date, required: true },
    taskId: { type: mongoose.Schema.Types.ObjectId, ref: 'Task' },
    taskTitle:{ type: String }
  }
],
  ville: { type: String, required: true },

  },
  { timestamps: true }
);

export const Vehicle = mongoose.model("Vehicle", vehicleSchema);
