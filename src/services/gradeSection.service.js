import * as gradeSectionRepository from '../repositories/gradeSection.repository.js';
import * as subjectService from '../services/subject.service.js';
import { NotFoundError, ConflictError } from '../errors/errors.js';

/**
 * Crear un nuevo grado y sección.
 * @param {String} grado - Nombre del grado.
 * @param {String} seccion - Nombre de la sección.
 * @param {Array<String>} materias - IDs de las materias relacionadas.
 * @returns {Promise<Object>} - Nuevo grado y sección creado.
 */
export const newGradeSection = async (grado, seccion, materias = []) => {
    const GradeSectionExists = await gradeSectionRepository.findGradeAndSection(grado, seccion);
    if (!GradeSectionExists) {

        const validSubjects = [];
        for (const subjectName of materias) {
            const subject = await subjectService.searchSubjectByName(subjectName);

            if (subject) {
                validSubjects.push(subject._id);
            } else {
                throw new NotFoundError(`Materia inválida: ${subjectName}`);
            }
        }

        const newGradeSection = await gradeSectionRepository.createGradeAndSection({
            grado,
            seccion,
            materias: validSubjects,
        });

        return newGradeSection;
    } else {
        throw new ConflictError("El grado y sección ya existe");
    }
};

export const getSubjectsByGradeAndSection = async (grado, seccion) => {
    const materias = await gradeSectionRepository.findSubjectsByGradeAndSection(grado, seccion);

    // Devuelve _id, no id, para que coincida con el resto de docs de Mongo
    return materias.map((materia) => ({ _id: materia._id, nombre: materia.nombre }));
};



/**
 * Actualizar un grado y sección por ID.
 * @param {String} grado - Grado actual.
 * @param {String} seccion - Sección actual.
 * @param {String} nuevoGrado - Nuevo grado.
 * @param {String} nuevaSeccion - Nueva sección.
 * @param {Array<String>} materias - Nuevas materias relacionadas.
 * @returns {Promise<Object>} - Grado y sección actualizados.
 */
export const updateGradeAndSectionById = async (grado, seccion, nuevoGrado, nuevaSeccion, materias = []) => {
    const GradeSectionExists = await gradeSectionRepository.findGradeAndSection(grado, seccion);
    if (GradeSectionExists) {
        
        const validSubjects = [];
        for (const subjectName of materias) {
            const subject = await subjectService.searchSubjectByName(subjectName);

            if (subject) {
                validSubjects.push(subject._id);
            } else {
                throw new NotFoundError(`Materia inválida: ${subjectName}`);
            }
        }

        return await gradeSectionRepository.updateGradeAndSectionById(GradeSectionExists.id, {
            grado: nuevoGrado,
            seccion: nuevaSeccion,
            materias: validSubjects,
        });
    } else {
        throw new NotFoundError("El grado y sección no existe");
    }
};

// El borrado de grados y secciones vive en catalog-deletion.service: arrastra evaluaciones,
// notas y asignaciones, exige confirmación previa, y bloquea si hay estudiantes matriculados.

/**
 * Obtener un grado y sección específicos.
 * @param {String} grado - Grado a buscar.
 * @param {String} seccion - Sección a buscar.
 * @returns {Promise<Object>} - Grado y sección encontrados.
 */
export const getGradeAndSection = async (grado, seccion) => {
    return await gradeSectionRepository.findGradeAndSection(grado, seccion);
};

/**
 * Obtener todas las combinaciones de grado y sección.
 * @returns {Promise<Array>} - Lista de todas las combinaciones de grado y sección.
 */
export const getAllGradeAndSection = async () => {
    return await gradeSectionRepository.findAllGradeAndSections();
};

/**
 * Agregar materias a un grado y sección.
 * @param {String} grado - Grado del grado y sección.
 * @param {String} seccion - Sección del grado y sección.
 * @param {Array<String>} materias - IDs de las materias a agregar.
 * @returns {Promise<Object>} - Grado y sección actualizados.
 */
export const addSubjectsToGradeSection = async (grado, seccion, materias = []) => {
    const gradeSection = await gradeSectionRepository.findGradeAndSection(grado, seccion);
    if (!gradeSection) {
        throw new NotFoundError("El grado y sección no existe");
    }
    const validSubjects = [];
        for (const subjectName of materias) {
            const subject = await subjectService.searchSubjectByName(subjectName);
            if (subject) {
                validSubjects.push(subject._id);
            } else {
                throw new NotFoundError(`Materia inválida: ${subjectName}`);
            }
        }

    return await gradeSectionRepository.addSubjectsToGradeSection(gradeSection.id, validSubjects);
};

/**
 * Eliminar materias de un grado y sección.
 * @param {String} grado - Grado del grado y sección.
 * @param {String} seccion - Sección del grado y sección.
 * @param {Array<String>} materias - IDs de las materias a eliminar.
 * @returns {Promise<Object>} - Grado y sección actualizados.
 */
export const removeSubjectsFromGradeSection = async (grado, seccion, materias = []) => {
    const gradeSection = await gradeSectionRepository.findGradeAndSection(grado, seccion);
    if (!gradeSection) {
        throw new NotFoundError("El grado y sección no existe");
    }
    const validSubjects = [];
        for (const subjectName of materias) {
            const subject = await subjectService.searchSubjectByName(subjectName);
            if (subject) {
                validSubjects.push(subject._id);
            } else {
                throw new NotFoundError(`Materia inválida: ${subjectName}`);
            }
        }

    return await gradeSectionRepository.removeSubjectsFromGradeSection(gradeSection.id, validSubjects);
};

// Devuelve un array vacío si la materia aún no está asignada a ningún grado o sección,
// eso es un estado válido, no un error.
export const getGradeSectionsBySubject = async (subjectId) => {
    return await gradeSectionRepository.findGradeSectionsBySubject(subjectId);
};

