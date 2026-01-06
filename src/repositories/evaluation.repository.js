import Evaluation from "../models/evaluation-model.js";

export const findEvaluationByNameAndSubject = async (materia, nombre) => {
    return await Evaluation.findOne({materia: materia, nombre: nombre }).populate('materia', 'nombre');
  };
  
  export const findAllEvaluations = async () =>{
    return await Evaluation.find().populate('materia', 'nombre');
  }
  
  export const createEvaluation = async (userData) => {
    const user = new Evaluation(userData);
    return await (await user.save()).populate('materia', 'nombre');
  };
  
  export const updateEvaluationById = async (id, updates) => {
    return await Evaluation.findByIdAndUpdate(id, updates, { new: true, runValidators: true }).populate('materia');
  };
      
  export const deleteEvaluationById = async (id) => {
    return await Evaluation.findByIdAndDelete(id).populate('materia', 'nombre');
  };

  export const findEvaluationsBySubject = async (materia) => {
    console.log("Buscando evaluaciones para la materia:", materia);
    const evaluations = await Evaluation.find({ materia: materia });
    console.log("Evaluaciones encontradas:", evaluations);
    return evaluations;
};