import { Schema, model } from 'mongoose'
import mongoose from 'mongoose'



const taskSchema = new Schema(
  {
    nom: { type: String, required: true },
    description: { type: String, required: true },

    type: {
      type: String,
      enum: [
        "FORMATEUR",
        "MEMBRE_JURY",
        "BENEFICIAIRE",
        "OBSERVATEUR",
        "CONCEPTEUR_EVALUATION"
      ],
      required: true
    },

    dateDebut: { type: Date, required: true },
    dateFin: { type: Date, required: true },

    remuneree: { type: Boolean, default: false },
    prixRemuneree: {type:Number, default:0},

    specialites: [
      {
        type: String,
        enum: ["PEDAGOGIQUE", "ORIENTATION", "PLANIFICATION", "FINANCIER"]
      }
    ],

    estCommune: { type: Boolean, default: false },

    grades: [{ type: String, enum: ["A", "B", "C"] }],

    vehiculeRequis: { type: Boolean, default: false },

    ligne: {
      type: String,
      enum: ["RABAT_CASA", "MEKNES_ERRACHIDIA", "MARRAKECH_AGADIR"]
    },

    adminFile: { type: String }, 

    nombrePlaces: { type: Number, required: true },

    affectations: [{ type: mongoose.Schema.Types.ObjectId, ref: "Affectation" }],

    statut: {
      type: String,
      enum: ["PLANIFIEE", "EN_COURS", "TERMINEE"],
      default: "PLANIFIEE"
    },
    ville: { type: String },
    vehicule: { type: mongoose.Schema.Types.ObjectId, ref: "Vehicle" }

  },
  { timestamps: true }
);


taskSchema.pre("findOneAndDelete", async function (next) {
  const task = await this.model.findOne(this.getQuery());
  if (task) {
    await mongoose.model("Affectation").deleteMany({ task: task._id });
  }
  // next();
});

export const Task = model("Task", taskSchema);
