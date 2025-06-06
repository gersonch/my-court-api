import { Schema } from 'mongoose';

export const UserSchema = new Schema({
  name: String,
  email: { type: String, unique: true, required: true },
  password: String,
  createdAt: { type: Date, default: Date.now },
});
