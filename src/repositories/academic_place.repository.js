import Academic_place from "../models/academic_place.model.js";

export const findPlacebyId = async (id) => {
    return await Academic_place.findById(id);
};
export const findPlaceByName = async (lugar) => {
    return await Academic_place.findOne({lugar: lugar});
};
export const findAllPlaces = async () =>{
    return await Academic_place.find();
};
export const createPlace = async (placeData) => {
    const place = new Academic_place(placeData); 
    return await place.save();
};
export const updatePlaceById = async (id, updates) => {
    return await Academic_place.findByIdAndUpdate(id, updates, { new: true, runValidators: true });
};
export const deletePlaceById = async (id) => {
    return await Academic_place.findByIdAndDelete(id);
};