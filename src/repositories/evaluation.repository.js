import Evaluation from "../models/evaluation-model.js";
import { getPaginationParams, getPaginationMeta } from "../utils/pagination-helper.js";

export const findEvaluationByNameAndSubject = async (materia, nombre) => {
    return await Evaluation.findOne({materia: materia, nombre: nombre }).populate('materia', 'nombre');
  };
  
  export const findAllEvaluations = async (page, limit, subjectIds = null) =>{
    const { skip, limit: validLimit, page: validPage } = getPaginationParams(page, limit);
    const filter = subjectIds ? { materia: { $in: subjectIds } } : {};

    const [evaluations, total] = await Promise.all([
      Evaluation.find(filter)
        .skip(skip)
        .limit(validLimit)
        .populate('materia', 'nombre'),
      Evaluation.countDocuments(filter),
    ]);

    return {
      data: evaluations,
      pagination: getPaginationMeta(validPage, validLimit, total),
    };
  }
  
  export const createEvaluation = async (evaluationData) => {
    const evaluation = new Evaluation(evaluationData);
    return await (await evaluation.save()).populate('materia', 'nombre');
  };
  
  export const updateEvaluationById = async (id, updates) => {
    return await Evaluation.findByIdAndUpdate(id, updates, { new: true, runValidators: true }).populate('materia');
  };
      
  export const deleteEvaluationById = async (id) => {
    return await Evaluation.findByIdAndDelete(id).populate('materia', 'nombre');
  };

  export const findEvaluationsBySubject = async (materia) => {
    const evaluations = await Evaluation.find({ materia: materia });
    return evaluations;
};

// Optimización: Obtener evaluaciones de múltiples materias de una vez
export const findEvaluationsBySubjects = async (materiaIds) => {
    const evaluations = await Evaluation.find({
      materia: { $in: materiaIds }
    }).populate('materia', 'nombre');
    return evaluations;
};