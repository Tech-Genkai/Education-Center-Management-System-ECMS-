import { Schema, model } from 'mongoose';

const AddressSchema = new Schema(
  {
    houseNo: { type: String, trim: true },
    buildingName: { type: String, trim: true },
    street: { type: String, trim: true },
    city: { type: String, trim: true },
    district: { type: String, trim: true },
    state: { type: String, trim: true },
    country: { type: String, trim: true },
    pinCode: { type: String, trim: true },
    landmark: { type: String, trim: true },
    zipCode: { type: String, trim: true }
  },
  { timestamps: true }
);

export const Address = model('Address', AddressSchema);
