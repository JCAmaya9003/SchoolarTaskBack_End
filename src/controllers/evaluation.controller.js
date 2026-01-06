import { validationResult } from 'express-validator';
import * as evaluationService from '../services/evaluation.service.js'

export const newEvaluation = async (req, res) =>{
    const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { nombre, nombreMateria, descripcion, fecha, peso } = req.body;
  try {
    const evaluation = await evaluationService.createEvaluation({nombre, nombreMateria, descripcion, fecha, peso });
    
    if (evaluation) {
      

      return res.json({
        message: 'Evaluacion creada con exito',
        evaluationNombre: evaluation.nombre,
        evaluationMateria: evaluation.materia.nombre,
        evaluationDescripcion: evaluation.descripcion,
        evaluationFecha: evaluation.fecha,
        evaluationPeso: evaluation.peso,
        });
    }else{
      return res.status(401).json({ message: 'Datos invalidos para crear la evaluacion!' });
    }

  } catch (error) {
    res.status(500).json({ message: 'Error al crear la evaluacion: ', error: error.message });
  }
};

export const updateEvaluation = async (req, res) =>{
    const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { nombre, nuevoNombre, nombreMateria, nuevaMateria, descripcion, fecha, peso } = req.body;
  try {
    const evaluationUpdated = await evaluationService.editEvaluation({nombre, nuevoNombre, nombreMateria, nuevaMateria, descripcion, fecha, peso });
    
    if (evaluationUpdated) {
      
      return res.json({
        message: 'Evaluacion editada con exito',
        evaluationNombre: evaluationUpdated.nombre,
        evaluationMateria: evaluationUpdated.materia.nombre,
        evaluationDescripcion: evaluationUpdated.descripcion,
        evaluationFecha: evaluationUpdated.fecha,
        evaluationPeso: evaluationUpdated.peso,
        });
    }else{
      return res.status(401).json({ message: 'Datos invalidos para editar la evaluacion!' });
    }

  } catch (error) {
    res.status(500).json({ message: 'Error al editar la evaluacion: ', error: error.message });
  }
};

export const eraseEvaluation = async (req, res) =>{
    const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { nombre, nombreMateria} = req.body;
  try {
    const evaluationDeleted = await evaluationService.deleteEvaluation({nombre, nombreMateria});
    
    if (evaluationDeleted) {
      
      return res.json({
        message: 'Evaluacion editada con exito',
        evaluationNombre: evaluationDeleted.nombre,
        evaluationMateria: evaluationDeleted.materia.nombre,
        evaluationDescripcion: evaluationDeleted.descripcion,
        evaluationFecha: evaluationDeleted.fecha,
        evaluationPeso: evaluationDeleted.peso,
        });
    }else{
      return res.status(401).json({ message: 'Datos invalidos para borrar la evaluacion!' });
    }

  } catch (error) {
    res.status(500).json({ message: 'Error al borrar la evaluacion: ', error: error.message });
  }
};

export const searchEvaluationByNameAndSubject = async (req, res) =>{
    const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { nombre, nombreMateria} = req.body;
  try {
    const evaluation = await evaluationService.searchEvaluationbyNameAndSubject({nombre, nombreMateria});
    
    if (evaluation) {
      
      return res.json({
        message: 'Evaluacion editada con exito',
        evaluationNombre: evaluation.nombre,
        evaluationMateria: evaluation.materia.nombre,
        evaluationDescripcion: evaluation.descripcion,
        evaluationFecha: evaluation.fecha,
        evaluationPeso: evaluation.peso,
        });
    }else{
      return res.status(401).json({ message: 'Datos invalidos para obtener la evaluacion!' });
    }

  } catch (error) {
    res.status(500).json({ message: 'Error al obtener la evaluacion: ', error: error.message });
  }
};

export const getEvaluations = async (req, res) =>{
    const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  try {
    const evaluations = await evaluationService.getAllEvaluations();
      
    res.json(evaluations);

  } catch (error) {
    res.status(500).json({ message: 'Error al obtener las evaluaciones: ', error: error.message });
  }
};