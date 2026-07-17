import * as academic_placeRepository from '../repositories/academic_place.repository.js'
import { NotFoundError, ConflictError } from '../errors/errors.js';

export const newPlace = async (lugar) =>{
    const placeExists = await academic_placeRepository.findPlaceByName(lugar);

    if(!placeExists){
        const newPlace = await academic_placeRepository.createPlace({
            lugar: lugar,
        });
        return newPlace;
    }else{
        throw new ConflictError("El lugar ya existe");
    }
};


export const updatePlace= async (lugar, nuevoLugar) =>{
    const placeExists = await academic_placeRepository.findPlaceByName(lugar);
    if(placeExists){
        const updatedPlace = await academic_placeRepository.updatePlaceById(placeExists.id, {lugar: nuevoLugar});
        return updatedPlace;
    }else{
        throw new NotFoundError("El lugar no existe");
    }
};

export const erasePlace = async (lugar)=>{
    const placeExists = await academic_placeRepository.findPlaceByName(lugar);

    if(placeExists){
        return await academic_placeRepository.deletePlaceById(placeExists.id);
    }else{
        throw new NotFoundError("El lugar no existe");
    }
};

// Devuelve null en vez de tirar, para no dejar ramas muertas en quien la llama
export const searchPlaceByName = async (lugar) =>{
    return await academic_placeRepository.findPlaceByName(lugar);
};

export const getPlaces = async () =>{
    return await academic_placeRepository.findAllPlaces();
};

export const getPlaceById = async(id) =>{
    const place = await academic_placeRepository.findPlaceById(id);
    if(place){
        return place;
    }else{
        throw new NotFoundError("No existe el lugar");
    }
}