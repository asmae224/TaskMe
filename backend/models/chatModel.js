import mongoose from "mongoose";

const chatMessageSchema = new mongoose.Schema(
  {
    sender: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "User", 
      required: true 
    },
    receiver: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "User" 
    },
    task: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "Task" 
    },
    content: { 
      type: String, 
      required: true,
      maxlength: 2000
    },
    messageType: {
      type: String,
      enum: ["task", "direct", "group"],
      default: "task"
    },
    read: { 
      type: Boolean, 
      default: false 
    },
    readAt: { 
      type: Date 
    }
  },
  { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Index pour optimiser les requêtes
chatMessageSchema.index({ task: 1, createdAt: -1 });
chatMessageSchema.index({ sender: 1, receiver: 1 });
chatMessageSchema.index({ messageType: 1 });

export const ChatMessage = mongoose.model('ChatMessage',chatMessageSchema)
