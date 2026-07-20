import * as evaluationRepository from '../repositories/evaluation.repository.js'
import * as evaluationGradeRepository from '../repositories/evaluation_grade.repository.js'
import * as subjectService from '../services/subject.service.js'
import * as teacherService from '../services/teacher.service.js'
import * as gradeSectionService from '../services/gradeSection.service.js'
import { NotFoundError, ConflictError } from '../errors/errors.js';

export const createEvaluation = async ({nombre, nombreMateria, grado, seccion, descripcion, fecha, peso}) =>{
    const materia = await subjectService.searchSubjectByName(nombreMateria);
    if(!materia){
        throw new NotFoundError("La materia no existe");
    }

    const gradeSection = await gradeSectionService.getGradeAndSection(grado, seccion);
    if(!gradeSection){
        throw new NotFoundError("El grado y sección no existe");
    }

    const evaluacionExiste = await evaluationRepository.findEvaluationByNameSubjectAndGradeSection(materia, nombre, gradeSection.id);
    if(evaluacionExiste){
        throw new ConflictError("La evaluación ya existe");
    }

    return await evaluationRepository.createEvaluation({
        nombre,
        descripcion,
        fecha,
        peso,
        materia,
        grado_seccion: gradeSection,
    });
};

export const getEvaluationsBySubject = async (subjectNombre) => {
    const materia = await subjectService.searchSubjectByName(subjectNombre);
    return await evaluationRepository.findEvaluationsBySubject(materia);
};

// Identifica la evaluación por nombre + materia + clase (grado/sección); puede renombrarla y
// moverla a otra materia (nuevaMateria) dentro de la misma clase.
export const editEvaluation = async ({nombre, nuevoNombre, nombreMateria, nuevaMateria, grado, seccion, descripcion, fecha, peso}) =>{
    const materia = await subjectService.searchSubjectByName(nombreMateria);
    if(!materia){
        throw new NotFoundError("La materia original ingresada no existe");
    }

    const newMateria = await subjectService.searchSubjectByName(nuevaMateria);
    if(!newMateria){
        throw new NotFoundError("La nueva materia ingresada no existe");
    }

    const gradeSection = await gradeSectionService.getGradeAndSection(grado, seccion);
    if(!gradeSection){
        throw new NotFoundError("El grado y sección no existe");
    }

    const evaluacionExiste = await evaluationRepository.findEvaluationByNameSubjectAndGradeSection(materia, nombre, gradeSection.id);
    if(!evaluacionExiste){
        throw new NotFoundError("La evaluación no existe");
    }

    return await evaluationRepository.updateEvaluationById(evaluacionExiste.id, {
        nombre: nuevoNombre,
        descripcion,
        fecha,
        peso,
        materia: newMateria,
    });
}

export const deleteEvaluation = async ({nombre, nombreMateria, grado, seccion}) =>{
    const materia = await subjectService.searchSubjectByName(nombreMateria);
    if(!materia){
        throw new NotFoundError("La materia no existe");
    }

    const gradeSection = await gradeSectionService.getGradeAndSection(grado, seccion);
    if(!gradeSection){
        throw new NotFoundError("El grado y sección no existe");
    }

    const evaluacionExiste = await evaluationRepository.findEvaluationByNameSubjectAndGradeSection(materia, nombre, gradeSection.id);
    if(!evaluacionExiste){
        throw new NotFoundError("La evaluación no existe");
    }

    // Cascada: una nota sin su evaluación no significa nada y quedaría huérfana, rompiendo la
    // vista de notas del alumno/padre. Se borran las notas primero y luego la evaluación: si el
    // borrado de la evaluación fallara, quedaría sin notas (inocuo); el orden inverso sí dejaría
    // notas colgadas.
    await evaluationGradeRepository.deleteEvaluationGradesByEvaluationId(evaluacionExiste.id);
    return await evaluationRepository.deleteEvaluationById(evaluacionExiste.id);
};

// Devuelve null en vez de tirar, para no dejar ramas muertas en quien la llama. La clase
// (grado/sección) la aporta el llamador; en el flujo de notas se deriva del propio estudiante.
export const searchEvaluationbyNameSubjectAndGradeSection = async (nombre, nombreMateria, gradeSectionId) =>{
    const materia = await subjectService.searchSubjectByName(nombreMateria);
    if(!materia){
        return null;
    }
    return await evaluationRepository.findEvaluationByNameSubjectAndGradeSection(materia, nombre, gradeSectionId);
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