import mongoose from 'mongoose';

const userCollection = "usuarios";

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, max: 30 },
  lastName: { type: String, required: true, max: 20 },
  email: { type: String, required: true, max: 100 },
  address: { type: String, required: true, max: 100 }
});

const userModel = mongoose.model(userCollection, userSchema);

export default userModel;