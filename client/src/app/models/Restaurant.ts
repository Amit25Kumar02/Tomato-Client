import mongoose, { Schema, Document } from "mongoose";

export interface IMenuItem {
  name: string;
  price: number;
}

export interface IRestaurant extends Document {
  name: string;
  cuisine: string;
  rating: number;
  priceRange: string;
  address: string;
  imageUrl: string;
  img: string;
  latitude: number;
  longitude: number;
  menu: IMenuItem[];
  userId: string;
}

const MenuItemSchema: Schema = new Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true },
});

const RestaurantSchema: Schema = new Schema({
  name: { type: String, required: true },
  cuisine: { type: String, required: true },
  rating: { type: Number, required: true },
  priceRange: { type: String, required: true },
  address: { type: String, required: true },
  imageUrl: { type: String },
  img: { type: String },
  latitude: { type: Number, required: true },
  longitude: { type: Number, required: true },
  userId: { type: String, required: true, index: true },
  menu: { type: [MenuItemSchema], default: [] },
}, { timestamps: true });

export default mongoose.models.Restaurant || mongoose.model<IRestaurant>("Restaurant", RestaurantSchema);
