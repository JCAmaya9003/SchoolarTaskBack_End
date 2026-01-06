import * as evaluationRepository from '../repositories/evaluation.repository.js'
import * as subjectService from '../services/subject.service.js'

export const createEvaluation = async ({nombre, nombreMateria, descripcion, fecha, peso}) =>{
    const materia = await subjectService.searchSubjectByName(nombreMateria);

    if(materia){
        const evaluacionExiste = await evaluationRepository.findEvaluationByNameAndSubject(materia, nombre);
        if(!evaluacionExiste){
            const newEvaluation = await evaluationRepository.createEvaluation({
                nombre,
                descripcion,
                fecha,
                peso,
                materia,
              });
            return newEvaluation;
        }else{
            throw new Error("Evaluacion existente");
        }
    }else{
        throw new Error("Materia existente");
    };
};

export const getEvaluationsBySubject = async (subjectNombre) => {
    const materia = await subjectService.searchSubjectByName(subjectNombre);
    console.log("materia: " + materia);
    return await evaluationRepository.findEvaluationsBySubject(materia);
};

export const editEvaluation = async ({nombre, nuevoNombre, nombreMateria, nuevaMateria, descripcion, fecha, peso}) =>{

    const materia = await subjectService.searchSubjectByName(nombreMateria);
    const newMateria = await subjectService.searchSubjectByName(nuevaMateria);
    console.log(materia, newMateria, nombreMateria, nuevaMateria);
    if(materia){
        if(newMateria){
            const evaluacionExiste = await evaluationRepository.findEvaluationByNameAndSubject(materia, nombre);
            if(evaluacionExiste){
                const updatedEvaluation = await evaluationRepository.updateEvaluationById( evaluacionExiste.id, {
                    nombre: nuevoNombre,
                    descripcion: descripcion,
                    fecha: fecha,
                    peso: peso,
                    materia: newMateria,
                });
                return updatedEvaluation;
            }else{
                throw new Error("Evaluacion inexistente");
            }
        }else{
            throw new Error("La nueva materia ingresada no existe");
        }
    }else{
        throw new Error("La materia original ingresada no existe");
    };
    
}

export const deleteEvaluation = async ({nombre, nombreMateria}) =>{
    const materia = await subjectService.searchSubjectByName(nombreMateria);
    console.log("materia: " + materia);
    if(materia){
        const evaluacionExiste = await evaluationRepository.findEvaluationByNameAndSubject(materia, nombre);
        console.log(evaluacionExiste);
        if(evaluacionExiste){
            const deletedEvaluation = await evaluationRepository.deleteEvaluationById(evaluacionExiste.id);
            return deletedEvaluation;
        }else{
            throw new Error("La evaluacion no existe");
        }
    }else{
        throw new Error("La materia no existe");
    };
};

export const searchEvaluationbyNameAndSubject = async (nombre, nombreMateria) =>{
    const materia = await subjectService.searchSubjectByName(nombreMateria);
    if(materia){
        const evaluacionExiste = await evaluationRepository.findEvaluationByNameAndSubject(materia, nombre);
        if(evaluacionExiste){
            return evaluacionExiste;
        }else{
            throw new Error("La evaluacion no existe");
        };
    }else{
        throw new Error("La materia no existe");
    };
};

export const getAllEvaluations = async () =>{
    return await evaluationRepository.findAllEvaluations();
}