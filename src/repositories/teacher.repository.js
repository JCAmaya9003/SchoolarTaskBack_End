import Teacher from "../models/teacher-model.js";
import { getPaginationParams, getPaginationMeta } from "../utils/pagination-helper.js";

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
            select: 'nombre apellido email genero domicilio nacionalidad rol',
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
            path: 'grado_encargado.grado_seccion',
            select: 'grado seccion',
        },
    ]);
};

/**
 * Buscar todos los profesores.
 * @param {number} page - Número de página
 * @param {number} limit - Elementos por página
 * @returns {Promise<Object>} - Objeto con data y pagination
 */
export const findAllTeachers = async (page, limit) => {
    const { skip, limit: validLimit, page: validPage } = getPaginationParams(page, limit);

    const [teachers, total] = await Promise.all([
        Teacher.find()
            .skip(skip)
            .limit(validLimit)
            .populate({
                path: 'usuario',
                select: 'nombre apellido email genero domicilio nacionalidad rol',
                populate: {
                    path: 'rol',
                    select: 'nombre',
                },
            })
            .populate({
                path: 'grado_encargado.materias',
                select: 'nombre',
            })
            .populate({
                path: 'grado_encargado.grado_seccion',
                select: 'grado seccion',
            }),
        Teacher.countDocuments(),
    ]);

    return {
        data: teachers,
        pagination: getPaginationMeta(validPage, validLimit, total),
    };
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
            select: 'nombre apellido email genero domicilio nacionalidad rol',
            populate: {
                path: 'rol',
                select: 'nombre',
            },
        })
        .populate({
            path: 'grado_encargado.materias',
            select: 'nombre',
        })
        .populate({
            path: 'grado_encargado.grado_seccion',
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
            select: 'nombre apellido email genero domicilio nacionalidad rol',
            populate: {
                path: 'rol',
                select: 'nombre',
            },
        })
        .populate({
            path: 'grado_encargado.materias',
            select: 'nombre',
        })
        .populate({
            path: 'grado_encargado.grado_seccion',
            select: 'grado seccion',
        });
};

/**
 * Eliminar un profesor por el ID.
 * @param {String} id - ID del profesor.
 * @returns {Promise<Object|null>} - Profesor eliminado o null.
 */
// Las cuatro de abajo sostienen el borrado en cascada de catálogos. Sin ellas, al borrar una
// materia o una clase, los ObjectId quedaban guardados dentro de grado_encargado apuntando a
// documentos inexistentes: el populate no los traía (se veían como []) pero la base quedaba sucia.
export const findTeachersBySubject = async (subjectId) => {
    return await Teacher.find({ 'grado_encargado.materias': subjectId });
};

export const findTeachersByGradeSection = async (gradeSectionId) => {
    return await Teacher.find({ 'grado_encargado.grado_seccion': gradeSectionId });
};

// $[] recorre todas las asignaciones del profesor y saca la materia de cada una
export const pullSubjectFromAllAssignments = async (subjectId) => {
    return await Teacher.updateMany({}, { $pull: { 'grado_encargado.$[].materias': subjectId } });
};

// Acá se saca la asignación entera, porque una asignación sin su grado/sección no tiene sentido
export const pullGradeSectionFromAllAssignments = async (gradeSectionId) => {
    return await Teacher.updateMany({}, { $pull: { grado_encargado: { grado_seccion: gradeSectionId } } });
};

export const deleteTeacherById = async (id) => {
    return await Teacher.findByIdAndDelete(id)
        .populate({
            path: 'usuario',
            select: 'nombre apellido email genero domicilio nacionalidad rol',
            populate: {
                path: 'rol',
                select: 'nombre',
            },
        })
        .populate({
            path: 'grado_encargado.materias',
            select: 'nombre',
        })
        .populate({
            path: 'grado_encargado.grado_seccion',
            select: 'grado seccion',
        });
};

