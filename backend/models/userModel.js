import { Schema, model } from 'mongoose'

const userSchema = new Schema(
  {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },

    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },

    role: {
      type: String,
      enum: ["SUPER_ADMIN", "COORDINATEUR", "AUDITEUR"],
      default: "AUDITEUR"
    },

    specialite: {
      type: String,
      enum: ["PEDAGOGIQUE", "ORIENTATION", "PLANIFICATION", "FINANCIER",""],
      
    },

    grade: {
      type: String,
      enum: ["A", "B", "C",""],
    },

    diplomes: {type: [String]},
    formations: {type: [String]},

    anciennete: { type: Number, default: 0 },

    actif: { type: Boolean, default: true },
    email: {
      type: String,
      required: true,    
      unique: true,      
    },
  },
  { timestamps: true }
);


userSchema.pre("findOneAndDelete", async function (next) {
  const user = await this.model.findOne(this.getQuery());
  if (user) {
    await mongoose.model("Affectation").deleteMany({ auditeur: user._id });
  }
  next();
});


export const User = model("User", userSchema);
