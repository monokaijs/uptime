import mongoose, { Schema, Document } from 'mongoose';

export interface IService extends Document {
  name: string;
  url: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IServiceStatus extends Document {
  serviceId: mongoose.Types.ObjectId;
  status: 'up' | 'down';
  responseTime: number;
  timestamp: Date;
}

const ServiceSchema: Schema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    url: { type: String, required: true, trim: true },
  },
  { timestamps: true }
);

const ServiceStatusSchema: Schema = new Schema({
  serviceId: { type: Schema.Types.ObjectId, ref: 'Service', required: true },
  status: { type: String, enum: ['up', 'down'], required: true },
  responseTime: { type: Number, required: true }, // in milliseconds
  timestamp: { type: Date, default: Date.now },
});

// Check if models are already defined to prevent overwriting during hot reloads
export const Service = mongoose.models.Service || mongoose.model<IService>('Service', ServiceSchema);
export const ServiceStatus = mongoose.models.ServiceStatus || mongoose.model<IServiceStatus>('ServiceStatus', ServiceStatusSchema);
