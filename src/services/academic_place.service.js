import * as academic_placeRepository from '../repositories/academic_place.repository.js'

export const newPlace = async (lugar) =>{
    const placeExists = await academic_placeRepository.findPlaceByName(lugar);

    if(!placeExists){
        const newPlace = await academic_placeRepository.createPlace({
            lugar: lugar,
        });
        return newPlace;
    }else{
        throw new Error("Lugar ya existente");
    }
};
    

export const updatePlace= async (lugar, nuevoLugar) =>{
    const placeExists = await academic_placeRepository.findPlaceByName(lugar);
    if(placeExists){
        const updatedPlace = await academic_placeRepository.updatePlaceById(placeExists.id, {lugar: nuevoLugar});
        return updatedPlace;
    }else{
        throw new Error("Lugar inexistente");
    }
};

export const erasePlace = async (lugar)=>{
    const placeExists = await academic_placeRepository.findPlaceByName(lugar);

    if(placeExists){
        const deletedPlace = await academic_placeRepository.deletePlaceById(placeExists.id);
        if(deletedPlace){
            return deletedPlace;
        }else{
            throw new Error("Datos invalidos para eliminar el lugar");
        }
    }else{
        throw new Error("Lugar inexistente");
    }
};

export const searchPlaceByName = async (lugar) =>{
    const placeExists = await academic_placeRepository.findPlaceByName(lugar);

    if(placeExists){
        return placeExists;
    }else{
        throw new Error("Lugar inexistente");
    }
};

export const getPlaces = async () =>{
    return await academic_placeRepository.findAllPlaces();
};

export const getPlaceById = async(id) =>{
    const place = await academic_placeRepository.findPlacebyId(id);
    if(place){
        return place;
    }else{
        throw new Error("No existe el lugar");
    }
}