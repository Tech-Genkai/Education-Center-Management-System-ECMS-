import { Schema, model } from 'mongoose';

const AddressSchema = new Schema(
  {
    street: String,
    city: String,
    state: String,
    country: String,
    zipCode: String,
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

export const Address = model('Address', AddressSchema);
