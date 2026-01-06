import Teacher from "../models/teacher-model.js";

/**
 * Buscar un profesor por el ID de usuario.
 * @param {String} userId - ID del usuario asociado al profesor.
 * @returns {Promise<Object|null>} - Profesor encontrado o null.
 */
export const findTeacherByUserId = async (userId) => {
    return await Teacher.findOne({ usuario: userId })
    .populate([
        {
            path: 'usuario',
            select: 'nombre apellido email rol',
            populate: {
                path: 'rol',
                select: 'nombre',
            },
        },
        {
            path: 'grado_encargado.materias',
            select: 'nombre',
        },
        {
            path: 'grado_encargado.grado_secciones',
            select: 'grado seccion',
        },
    ]);
};

/**
 * Buscar todos los profesores.
 * @returns {Promise<Array>} - Lista de profesores.
 */
export const findAllTeachers = async () => {
    return await Teacher.find()
        .populate({
            path: 'usuario',
            select: 'nombre apellido email',
        })
        .populate({
            path: 'grado_encargado.materias',
            select: 'nombre',
        })
        .populate({
            path: 'grado_encargado.grado_secciones',
            select: 'grado seccion',
        });
};

/**
 * Crear un nuevo profesor.
 * @param {Object} teacherData - Datos del profesor a crear.
 * @returns {Promise<Object>} - Profesor creado.
 */
export const createTeacher = async (teacherData) => {
    const teacher = new Teacher(teacherData);
    const savedTeacher = await teacher.save();
    return await Teacher.findById(savedTeacher._id)
        .populate({
            path: 'usuario',
            select: 'nombre apellido email',
        })
        .populate({
            path: 'grado_encargado.materias',
            select: 'nombre',
        })
        .populate({
            path: 'grado_encargado.grado_secciones',
            select: 'grado seccion',
        });
};

/**
 * Actualizar un profesor por el ID de usuario.
 * @param {String} id - ID del usuario asociado al profesor.
 * @param {Object} updates - Datos para actualizar.
 * @returns {Promise<Object|null>} - Profesor actualizado o null.
 */
export const updateTeacherByUserId = async (id, updates) => {
    return await Teacher.findByIdAndUpdate(id, updates, { new: true, runValidators: true })
        .populate({
            path: 'usuario',
            select: 'nombre apellido email',
        })
        .populate({
            path: 'grado_encargado.materias',
            select: 'nombre',
        })
        .populate({
            path: 'grado_encargado.grado_secciones',
            select: 'grado seccion',
        });
};

/**
 * Eliminar un profesor por el ID de usuario.
 * @param {String} id - ID del usuario asociado al profesor.
 * @returns {Promise<Object|null>} - Profesor eliminado o null.
 */
export const deleteTeacherByUserId = async (id) => {
    return await Teacher.findByIdAndDelete(id)
        .populate({
            path: 'usuario',
            select: 'nombre apellido email',
        })
        .populate({
            path: 'grado_encargado.materias',
            select: 'nombre',
        })
        .populate({
            path: 'grado_encargado.grado_secciones',
            select: 'grado seccion',
        });
};

/**
 * Eliminar un profesor por el ID.
 * @param {String} id - ID del profesor.
 * @returns {Promise<Object|null>} - Profesor eliminado o null.
 */
export const deleteTeacherById = async (id) => {
    return await Teacher.findByIdAndDelete(id);
};

export const findStudentsByGradeSection = async (gradeSectionId) => {
    return await Student.find({ grado_seccion: gradeSectionId }).populate([
        {
            path: 'usuario',
            select: 'nombre apellido email rol',
            populate: {
                path: 'rol',
                select: 'nombre',
            },
        },
        {
            path: 'grado_seccion',
            select: 'grado seccion materias',
            populate: {
                path: 'materias',
                select: 'nombre',
            },
        },
    ]);
};


