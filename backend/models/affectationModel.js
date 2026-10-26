import mongoose from "mongoose";
import { model, Schema} from "mongoose"

const affectationSchema = new Schema(
  {
    task: { type: mongoose.Schema.Types.ObjectId, ref: "Task", required: true },
    auditeur: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    auditeurInitial: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

    mode: {
      type: String,
      enum: ["manuel", "semi_auto", "auto"],
      required: true
    },

    dateAffectation: { type: Date, default: Date.now },
    

    rapport: String,

    justificationRefus: String,
    justificationValidation: String,

    statut: {
      type: String,
      enum: ["en_attente", "accepte", "refuse", "delegue"],
      default: "en_attente"
    },

    delaisExpiration: { type: Date },

    auditeurPropose: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

    confirmationDelegation: {
      type: String,
      enum: ["acceptee", "refusee", "en_attente"],
      default: "en_attente"
    }
  },
  { timestamps: true }
);

export const Affectation = model("Affectation", affectationSchema);
