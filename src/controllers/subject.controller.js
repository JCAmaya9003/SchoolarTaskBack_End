import * as subjectService from '../services/subject.service.js';
import { validationResult } from 'express-validator';

export const createNewSubject = async (req, res)=>{
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({message: "Error al intentar crear la materia!", errors: errors.array() });
    }
    try {
        const {nombre} = req.body;

        const createdSubject =  await subjectService.newSubject(nombre);

        if(createdSubject){
            return res.status(201).json({
              message: 'Materia creada con éxito!',
              subjectName: createdSubject.nombre,
            });
          }else{
            return res.status(400).json({ message: 'Materia ya creada' });
          }
    }catch (e) {
        console.error(e);
        res.status(500).json({ message: 'Error al crear la materia.', error: e.message });
    };
};

export const editSubject = async (req, res) =>{
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({message: "Error al intentar editar la materia!", errors: errors.array() });
    }
    
    try {
        const {nombre, nuevoNombre} = req.body;

        const editedSubject =  await subjectService.updateSubject(nombre, nuevoNombre);
        if (editedSubject) {
            return res.status(200).json({
              message: 'Materia actualizado con éxito',
              subjectId: editedSubject.id,
              subjectName: editedSubject.nombre,
            });
          }else{
            return res.status(404).json({ message: 'La materia especificado no existe!' });
          }
    }catch (e) {
        console.error(e);
        res.status(500).json({ message: 'Error al editar la materia.', error: e.message });
    }
};

export const deleteSubject = async (req, res) =>{
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({message: "Error al intentar eliminar la materia!", errors: errors.array() });
    }
    
    try {
        const {nombre} = req.body;

        const erasedSubject =  await subjectService.eraseSubject(nombre);
        if (erasedSubject) {
            return res.status(200).json({
              message: 'Materia eliminada con éxito',
              subjectId: erasedSubject.id,
              subjectName: erasedSubject.nombre,
            });
          }else{
            return res.status(404).json({ message: 'La materia especificada no existe!' });
          }
    }catch (e) {
        console.error(e);
        res.status(500).json({ message: 'Error al eliminar la materia.', error: e.message });
    }
};

export const getAllSubjects = async (req, res) =>{
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({message: "Error al intentar mostrar las materias!", errors: errors.array() });
    }
    
    try {

        const subjects =  await subjectService.getSubjects();
        res.json(subjects);
    }catch (e) {
        console.error(e);
        res.status(500).json({ message: 'Error al mostrar las materias.', error: e.message });
    }
};

export const getSubjectByname = async (req, res) =>{
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({message: "Error al intentar mostrar la materia!", errors: errors.array() });
    }
    
    try {
        const {nombre} = req.body;

        const subjectExists =  await subjectService.searchSubjectByName(nombre);
        if (subjectExists) {
            return res.status(200).json({
              message: 'Materia encontrada con éxito',
              subjectId: subjectExists.id,
              subjectName: subjectExists.nombre,
            });
          }else{
            return res.status(404).json({ message: 'La materia especificada no existe!' });
          }
    }catch (e) {
        console.error(e);
        res.status(500).json({ message: 'Error al mostrar la materia.', error: e.message });
    }
};