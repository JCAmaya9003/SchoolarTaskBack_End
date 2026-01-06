import GradeSection from "../models/gradeSection-model.js";

/**
 * Buscar secciones por grado.
 * @param {String} grado - Grado a buscar.
 * @returns {Promise<Array>} - Lista de secciones asociadas al grado.
 */
export const findSectionsByGrade = async (grado) => {
    return await GradeSection.find({ grado }).populate('materias', 'nombre');
};

/**
 * Buscar un grado y sección específicos.
 * @param {String} grado - Grado a buscar.
 * @param {String} seccion - Sección a buscar.
 * @returns {Promise<Object|null>} - Grado y sección encontrados o null.
 */
export const findGradeAndSection = async (grado, seccion) => {
    return await GradeSection.findOne({ grado, seccion })
        .populate('materias', 'nombre') 

};


export const findSubjectsByGradeAndSection = async (grado, seccion) => {
    console.log("Buscando grado:", grado, "sección:", seccion); // Verifica los valores de entrada
    const gradeSection = await GradeSection.findOne({ grado, seccion }).populate('materias', 'nombre');
    console.log("Resultado encontrado:", gradeSection);

    if (!gradeSection) {
        throw new Error("No se encontró el grado y sección");
    }
    return gradeSection.materias;
};



/**
 * Obtener todas las combinaciones de grado y sección.
 * @returns {Promise<Array>} - Lista de todas las combinaciones de grado y sección.
 */
export const findAllGradeAndSections = async () => {
    return await GradeSection.find().populate('materias', 'nombre');
};

/**
 * Crear un nuevo grado y sección.
 * @param {Object} userdata - Datos del grado y sección.
 * @returns {Promise<Object>} - Grado y sección creados.
 */
export const createGradeAndSection = async (userdata) => {
    const grade_section = new GradeSection(userdata);
    return await grade_section.save();
};

/**
 * Actualizar un grado y sección por ID.
 * @param {String} id - ID del grado y sección.
 * @param {Object} updates - Datos a actualizar.
 * @returns {Promise<Object|null>} - Grado y sección actualizados o null.
 */
export const updateGradeAndSectionById = async (id, updates) => {
    return await GradeSection.findByIdAndUpdate(id, updates, { new: true, runValidators: true })
        .populate('materias', 'nombre');
};

/**
 * Eliminar un grado y sección por ID.
 * @param {String} id - ID del grado y sección.
 * @returns {Promise<Object|null>} - Grado y sección eliminados o null.
 */
export const deleteGradeAndSectionById = async (id) => {
    return await GradeSection.findByIdAndDelete(id);
};

/**
 * Agregar materias a un grado y sección.
 * @param {String} id - ID del grado y sección.
 * @param {Array<String>} materias - IDs de las materias a agregar.
 * @returns {Promise<Object|null>} - Grado y sección actualizados o null.
 */
export const addSubjectsToGradeSection = async (id, materias) => {
    return await GradeSection.findByIdAndUpdate(
        id,
        { $addToSet: { materias: { $each: materias } } }, // Evita duplicados
        { new: true, runValidators: true }
    ).populate('materias', 'nombre');
};

/**
 * Eliminar materias de un grado y sección.
 * @param {String} id - ID del grado y sección.
 * @param {Array<String>} materias - IDs de las materias a eliminar.
 * @returns {Promise<Object|null>} - Grado y sección actualizados o null.
 */
export const removeSubjectsFromGradeSection = async (id, materias) => {
    return await GradeSection.findByIdAndUpdate(
        id,
        { $pull: { materias: { $in: materias } } },
        { new: true, runValidators: true }
    ).populate('materias', 'nombre');
};


export const findGradeSectionsBySubject = async (subjectId) => {
    // Buscar grados y secciones que incluyan la materia especificada
    return await GradeSection.find({ materias: subjectId }).populate([
        {
            path: 'materias',
            select: 'nombre',
        },
    ]);
};