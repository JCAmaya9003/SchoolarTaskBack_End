import * as evaluationRepository from '../repositories/evaluation.repository.js'
import * as evaluationGradeRepository from '../repositories/evaluation_grade.repository.js'
import * as subjectService from '../services/subject.service.js'
import * as teacherService from '../services/teacher.service.js'
import { NotFoundError, ConflictError } from '../errors/errors.js';

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
            throw new ConflictError("La evaluación ya existe");
        }
    }else{
        throw new NotFoundError("La materia no existe");
    };
};

export const getEvaluationsBySubject = async (subjectNombre) => {
    const materia = await subjectService.searchSubjectByName(subjectNombre);
    return await evaluationRepository.findEvaluationsBySubject(materia);
};

export const editEvaluation = async ({nombre, nuevoNombre, nombreMateria, nuevaMateria, descripcion, fecha, peso}) =>{

    const materia = await subjectService.searchSubjectByName(nombreMateria);
    const newMateria = await subjectService.searchSubjectByName(nuevaMateria);
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
                throw new NotFoundError("La evaluación no existe");
            }
        }else{
            throw new NotFoundError("La nueva materia ingresada no existe");
        }
    }else{
        throw new NotFoundError("La materia original ingresada no existe");
    };

}

export const deleteEvaluation = async ({nombre, nombreMateria}) =>{
    const materia = await subjectService.searchSubjectByName(nombreMateria);
    if(materia){
        const evaluacionExiste = await evaluationRepository.findEvaluationByNameAndSubject(materia, nombre);
        if(evaluacionExiste){
            // Cascada: una nota sin su evaluación no significa nada y quedaría huérfana,
            // rompiendo la vista de notas del alumno/padre. Se borran las notas primero y
            // luego la evaluación: si el borrado de la evaluación fallara, quedaría sin notas
            // (inocuo); el orden inverso sí dejaría notas colgadas.
            await evaluationGradeRepository.deleteEvaluationGradesByEvaluationId(evaluacionExiste.id);
            const deletedEvaluation = await evaluationRepository.deleteEvaluationById(evaluacionExiste.id);
            return deletedEvaluation;
        }else{
            throw new NotFoundError("La evaluación no existe");
        }
    }else{
        throw new NotFoundError("La materia no existe");
    };
};

// Devuelve null en vez de tirar, para no dejar ramas muertas en quien la llama
export const searchEvaluationbyNameAndSubject = async (nombre, nombreMateria) =>{
    const materia = await subjectService.searchSubjectByName(nombreMateria);
    if(!materia){
        return null;
    }
    return await evaluationRepository.findEvaluationByNameAndSubject(materia, nombre);
};

// Si requestingUser es teacher, filtra a solo las materias que dicta; admin ve todo
export const getAllEvaluations = async (page, limit, requestingUser) =>{
    let subjectIds = null;
    if (requestingUser?.role === 'teacher') {
        subjectIds = await getTeacherSubjectIds(requestingUser.email);
    }
    return await evaluationRepository.findAllEvaluations(page, limit, subjectIds);
}

export const getTeacherSubjectIds = async (email) => {
    try {
        const subjects = await teacherService.getSubjectsByTeacherEmail(email);
        return subjects.map((subject) => subject._id);
    } catch (error) {
        if (error instanceof NotFoundError) {
            return [];
        }
        throw error;
    }
};