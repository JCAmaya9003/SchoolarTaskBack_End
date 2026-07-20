import Evaluation from "../models/evaluation-model.js";
import { getPaginationParams, getPaginationMeta } from "../utils/pagination-helper.js";

// Una evaluación se identifica por nombre + materia + clase (grado/sección).
export const findEvaluationByNameSubjectAndGradeSection = async (materia, nombre, gradeSectionId) => {
    return await Evaluation.findOne({ materia, nombre, grado_seccion: gradeSectionId })
      .populate('materia', 'nombre')
      .populate('grado_seccion', 'grado seccion');
  };

  export const findAllEvaluations = async (page, limit, subjectIds = null) =>{
    const { skip, limit: validLimit, page: validPage } = getPaginationParams(page, limit);
    const filter = subjectIds ? { materia: { $in: subjectIds } } : {};

    const [evaluations, total] = await Promise.all([
      Evaluation.find(filter)
        .skip(skip)
        .limit(validLimit)
        .populate('materia', 'nombre')
        .populate('grado_seccion', 'grado seccion'),
      Evaluation.countDocuments(filter),
    ]);

    return {
      data: evaluations,
      pagination: getPaginationMeta(validPage, validLimit, total),
    };
  }

  export const createEvaluation = async (evaluationData) => {
    const evaluation = new Evaluation(evaluationData);
    return await (await evaluation.save()).populate([
      { path: 'materia', select: 'nombre' },
      { path: 'grado_seccion', select: 'grado seccion' },
    ]);
  };

  export const updateEvaluationById = async (id, updates) => {
    return await Evaluation.findByIdAndUpdate(id, updates, { new: true, runValidators: true })
      .populate('materia', 'nombre')
      .populate('grado_seccion', 'grado seccion');
  };

  export const deleteEvaluationById = async (id) => {
    return await Evaluation.findByIdAndDelete(id)
      .populate('materia', 'nombre')
      .populate('grado_seccion', 'grado seccion');
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

// Evaluaciones de una clase concreta (grado/sección). Usado por la vista de notas del alumno,
// que ahora solo muestra las evaluaciones de SU clase, no las de la materia en otros grados.
export const findEvaluationsByGradeSection = async (gradeSectionId) => {
    return await Evaluation.find({ grado_seccion: gradeSectionId }).populate('materia', 'nombre');
};
