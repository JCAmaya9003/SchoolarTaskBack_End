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

// getEvaluationsBySubject se elimino: traia las evaluaciones de la materia en TODAS las
// clases, algo que ya no tiene sentido ahora que una evaluacion pertenece a una clase.

// Identifica la evaluación por nombre + materia + clase (grado/sección). Edición parcial: solo
// cambia los campos enviados, así renombrar o cambiar el peso no obliga a re-mandar todo.
export const editEvaluation = async ({nombre, nuevoNombre, nombreMateria, nuevaMateria, grado, seccion, descripcion, fecha, peso}) =>{
    const materia = await subjectService.searchSubjectByName(nombreMateria);
    if(!materia){
        throw new NotFoundError("La materia original ingresada no existe");
    }

    const gradeSection = await gradeSectionService.getGradeAndSection(grado, seccion);
    if(!gradeSection){
        throw new NotFoundError("El grado y sección no existe");
    }

    const evaluacionExiste = await evaluationRepository.findEvaluationByNameSubjectAndGradeSection(materia, nombre, gradeSection.id);
    if(!evaluacionExiste){
        throw new NotFoundError("La evaluación no existe");
    }

    const updates = {};
    if (nuevoNombre !== undefined) updates.nombre = nuevoNombre;
    if (descripcion !== undefined) updates.descripcion = descripcion;
    if (fecha !== undefined) updates.fecha = fecha;
    if (peso !== undefined) updates.peso = peso;
    if (nuevaMateria !== undefined) {
        const newMateria = await subjectService.searchSubjectByName(nuevaMateria);
        if(!newMateria){
            throw new NotFoundError("La nueva materia ingresada no existe");
        }
        updates.materia = newMateria;
    }

    return await evaluationRepository.updateEvaluationById(evaluacionExiste.id, updates);
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

// Filtro Mongo de evaluaciones que el profesor dicta: por cada asignación, (materia ∈ sus
// materias) Y (grado_seccion == esa clase). Así un profe de Mate en 3A no ve las de Mate en 6C.
const buildTeacherEvaluationFilter = (assignments) => {
    if (!assignments.length) {
        return { _id: null }; // sin asignaciones: no matchea ninguna evaluación
    }
    return {
        $or: assignments.map((a) => ({
            materia: { $in: a.materias.map((m) => m._id) },
            grado_seccion: a.grado_seccion._id,
        })),
    };
};

// Si requestingUser es teacher, filtra a las evaluaciones de sus materias EN sus clases; admin ve todo.
export const getAllEvaluations = async (page, limit, requestingUser) =>{
    let filter = {};
    if (requestingUser?.role === 'teacher') {
        const assignments = await teacherService.getTeacherAssignments(requestingUser.email);
        filter = buildTeacherEvaluationFilter(assignments);
    }
    return await evaluationRepository.findAllEvaluations(page, limit, filter);
}

// IDs de las evaluaciones que el profesor dicta (sus materias en sus clases). Usado para filtrar notas.
export const getTeacherEvaluationIds = async (email) => {
    const assignments = await teacherService.getTeacherAssignments(email);
    const filter = buildTeacherEvaluationFilter(assignments);
    return await evaluationRepository.findEvaluationIdsByFilter(filter);
};