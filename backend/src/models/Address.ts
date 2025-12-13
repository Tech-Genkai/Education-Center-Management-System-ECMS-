import { Schema, model } from 'mongoose';

const AddressSchema = new Schema(
  {
    street: String,
    city: String,
    state: String,
    country: String,
    zipCode: String
  },
  { timestamps: true }
);

export const Address = model('Address', AddressSchema);
