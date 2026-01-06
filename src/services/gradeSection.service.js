import * as gradeSectionRepository from '../repositories/gradeSection.repository.js';
import * as subjectService from '../services/subject.service.js';

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
            console.log(`Materia buscada: ${subjectName}, Resultado: ${subject}`);

            if (subject) {
                validSubjects.push(subject._id); 
            } else {
                throw new Error(`Materia inválida: ${subjectName}`);
            }
        }

        const newGrade_section = await gradeSectionRepository.createGradeAndSection({
            grado,
            seccion,
            materias: validSubjects,
        });

        return newGrade_section;
    } else {
        throw new Error("Grado y sección existentes");
    }
};

export const getSubjectsByGradeAndSection = async (grado, seccion) => {
    const materias = await gradeSectionRepository.findSubjectsByGradeAndSection(grado, seccion);

    // Mapear materias para asegurarte de devolver solo los nombres
    return materias.map((materia) => ({ id: materia._id, nombre: materia.nombre }));
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
            console.log(`Materia buscada: ${subjectName}, Resultado: ${subject}`);
            
            if (subject) {
                validSubjects.push(subject._id); 
            } else {
                throw new Error(`Materia inválida: ${subjectName}`);
            }
        }

        return await gradeSectionRepository.updateGradeAndSectionById(GradeSectionExists.id, {
            grado: nuevoGrado,
            seccion: nuevaSeccion,
            materias: validSubjects,
        });
    } else {
        throw new Error("El grado y sección no existe");
    }
};

/**
 * Eliminar un grado y sección por grado y sección.
 * @param {String} grado - Grado a eliminar.
 * @param {String} seccion - Sección a eliminar.
 * @returns {Promise<Object>} - Grado y sección eliminados.
 */
export const eraseGradeAndSectionById = async (grado, seccion) => {
    const GradeSectionExists = await gradeSectionRepository.findGradeAndSection(grado, seccion);
    if (GradeSectionExists) {
        return await gradeSectionRepository.deleteGradeAndSectionById(GradeSectionExists.id);
    } else {
        throw new Error("El grado y sección no existe");
    }
};

/**
 * Obtener un grado y sección específicos.
 * @param {String} grado - Grado a buscar.
 * @param {String} seccion - Sección a buscar.
 * @returns {Promise<Object>} - Grado y sección encontrados.
 */
export const getGradeAndSection = async (grado, seccion) => {
    console.log("enviado: " + grado,seccion)
    const GradeSectionExists = await gradeSectionRepository.findGradeAndSection(grado, seccion);
    if (GradeSectionExists) {
        return GradeSectionExists;
    } else {
        throw new Error("El grado y sección no existe");
    }
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
        throw new Error("El grado y sección no existe");
    }
    const validSubjects = [];
        for (const subjectName of materias) {
            const subject = await subjectService.searchSubjectByName(subjectName);
            console.log(`Materia buscada: ${subjectName}, Resultado: ${subject}`);
            if (subject) {
                validSubjects.push(subject._id); 
            } else {
                throw new Error(`Materia inválida: ${subjectName}`);
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
        throw new Error("El grado y sección no existe");
    }
    const validSubjects = [];
        for (const subjectName of materias) {
            const subject = await subjectService.searchSubjectByName(subjectName);
            console.log(`Materia buscada: ${subjectName}, Resultado: ${subject}`);
            if (subject) {
                validSubjects.push(subject._id); 
            } else {
                throw new Error(`Materia inválida: ${subjectName}`);
            }
        }

    return await gradeSectionRepository.removeSubjectsFromGradeSection(gradeSection.id, validSubjects);
};

export const getGradeSectionsBySubject = async (subjectId) => {
    const gradeSections = await gradeSectionRepository.findGradeSectionsBySubject(subjectId);
    if (!gradeSections || gradeSections.length === 0) {
        throw new Error("No se encontraron grados y secciones para la materia especificada");
    }
    return gradeSections;
};

