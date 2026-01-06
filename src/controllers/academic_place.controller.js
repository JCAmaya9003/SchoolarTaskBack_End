import * as academic_placeService from '../services/academic_place.service.js';
import { validationResult } from 'express-validator';

export const createNewPlace = async (req, res)=>{
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({message: "Error al intentar crear el lugar!", errors: errors.array() });
    }
    try {
        const {lugar} = req.body;

        const createdPlace =  await academic_placeService.newPlace(lugar);

        if(createdPlace){
            return res.status(201).json({
              message: 'Lugar creado con éxito!',
              placeAdress: createdPlace.lugar,
            });
          }else{
            return res.status(400).json({ message: 'Lugar ya creado' });
          }
    }catch (e) {
        console.error(e);
        res.status(500).json({ message: 'Error al crear el lugar.', error: e.message });
    };
};

export const editPlace = async (req, res) =>{
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({message: "Error al intentar editar el lugar!", errors: errors.array() });
    }
    
    try {
        const {lugar, nuevoLugar} = req.body;

        const editedPlace =  await academic_placeService.updatePlace(lugar, nuevoLugar);
        if (editedPlace) {
            return res.status(200).json({
              message: 'Lugar actualizado con éxito',
              placeId: editedPlace.id,
              placeName: editedPlace.lugar,
            });
          }else{
            return res.status(404).json({ message: 'El lugar especificado no existe!' });
          }
    }catch (e) {
        console.error(e);
        res.status(500).json({ message: 'Error al editar el lugar.', error: e.message });
    }
};

export const deletePlace = async (req, res) =>{
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({message: "Error al intentar eliminar el lugar!", errors: errors.array() });
    }
    
    try {
        const {lugar} = req.body;

        const erasedPlace =  await academic_placeService.erasePlace(lugar);
        if (erasedPlace) {
            return res.status(200).json({
              message: 'Lugar eliminado con éxito',
              placeId: erasedPlace.id,
              placeName: erasedPlace.nombre,
            });
          }else{
            return res.status(404).json({ message: 'El lugar especificado no existe!' });
          }
    }catch (e) {
        console.error(e);
        res.status(500).json({ message: 'Error al eliminar el lugar.', error: e.message });
    }
};

export const getAllPlaces = async (req, res) =>{
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({message: "Error al intentar mostrar los lugares!", errors: errors.array() });
    }
    
    try {
        const places =  await academic_placeService.getPlaces();
        res.json(places);
    }catch (e) {
        console.error(e);
        res.status(500).json({ message: 'Error al mostrar los lugares.', error: e.message });
    }
};

export const getPlaceByName = async (req, res) =>{
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({message: "Error al intentar mostrar el lugar!", errors: errors.array() });
    }
    
    try {
        const {lugar} = req.body;

        const placetExists =  await academic_placeService.searchPlaceByName(lugar);
        if (placetExists) {
            return res.status(200).json({
              message: 'Lugar encontrado con éxito',
              placeId: placetExists.id,
              placeName: placetExists.nombre,
            });
          }else{
            return res.status(404).json({ message: 'El lugar especificado no existe!' });
          }
    }catch (e) {
        console.error(e);
        res.status(500).json({ message: 'Error al mostrar el lugar.', error: e.message });
    }
};

export const getPlaceNameById = async (req, res) =>{
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
      return res.status(400).json({message: "Error al intentar mostrar el lugar!", errors: errors.array() });
  }
  
  try {
      const {id} = req.body;

      const placetExists =  await academic_placeService.getPlaceById(id);
      if (placetExists) {
          return res.status(200).json({
            nombre: placetExists.lugar,
          });
        }else{
          return res.status(404).json({ message: 'El lugar especificado no existe!' });
        }
  }catch (e) {
      console.error(e);
      res.status(500).json({ message: 'Error al mostrar el lugar.', error: e.message });
  }
};