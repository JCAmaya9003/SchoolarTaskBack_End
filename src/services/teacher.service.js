import * as teacherRepository from '../repositories/teacher.repository.js';
import * as gradeSectionService from '../services/gradeSection.service.js';
import * as subjectService from '../services/subject.service.js';
import * as userService from '../services/user-service.js';
import { deleteUserById } from '../repositories/user-repository.js';
import { runInTransaction } from '../utils/transaction.js';
import logger from '../config/logger.js';
import { NotFoundError, ConflictError } from '../errors/errors.js';

/**
 * Obtener todos los profesores.
 * @param {number} page - Número de página
 * @param {number} limit - Elementos por página
 * @returns {Promise<Object>} - Objeto con data y pagination
 */
export const getTeachers = async (page, limit) => {
    return await teacherRepository.findAllTeachers(page, limit);
};

// Valida las asignaciones del profesor. Cada entrada es un grado/sección y las materias que
// dicta ahí; devuelve el shape listo para guardar: [{ grado_seccion: id, materias: [ids] }].
const buildValidAssignments = async (asignaciones) => {
    const validAssignments = [];
    for (const { grado, seccion, materias } of asignaciones) {
        const gradeSection = await gradeSectionService.getGradeAndSection(grado, seccion);
        if (!gradeSection) {
            throw new NotFoundError(`Grado y sección inválidos: Grado=${grado}, Sección=${seccion}`);
        }

        const validSubjects = [];
        for (const subjectName of materias) {
            const subject = await subjectService.searchSubjectByName(subjectName);
            if (!subject) {
                throw new NotFoundError(`Materia inválida: ${subjectName}`);
            }
            validSubjects.push(subject._id);
        }

        validAssignments.push({ grado_seccion: gradeSection._id, materias: validSubjects });
    }
    return validAssignments;
};

/**
 * Crear un nuevo profesor.
 * @param {Object} data - Datos del profesor.
 * @returns {Promise<Object|null>} - Profesor creado o null si ya existe.
 */
export const createTeacher = async ({ nombre, apellido, email, password, fecha_nacimiento, rolNombre,
    genero, domicilio, nacionalidad, asignaciones, telefono, especialidad}) => {

        const validAssignments = await buildValidAssignments(asignaciones);

        const userExists = await userService.searchUserByEmail(email);
        if (userExists) {
            throw new ConflictError("Usuario ya existente!");
        }

        // El usuario y su perfil se crean en una transacción, en vez del rollback manual con
        // hardDeleteUserById que se perdía si el propio rollback fallaba.
        return await runInTransaction(async (session) => {
            const user = await userService.registerUser({
                nombre,
                apellido,
                email,
                password,
                fecha_nacimiento,
                rolNombre,
                genero,
                domicilio,
                nacionalidad
            }, session);

            return await teacherRepository.createTeacher({
                usuario: user,
                grado_encargado: validAssignments,
                telefono,
                especialidad,
            }, session);
        });
    };


        
    

// Crea el perfil de profesor sobre un usuario que YA existe. Lo usa el cambio de rol, donde
// el User no se crea de nuevo (a diferencia de createTeacher), solo se le arma el perfil nuevo.
export const createTeacherProfileForUser = async (user, { asignaciones, telefono, especialidad }, session) => {
    const validAssignments = await buildValidAssignments(asignaciones);

    return await teacherRepository.createTeacher({
        usuario: user,
        grado_encargado: validAssignments,
        telefono,
        especialidad,
    }, session);
};

/**
 * Actualizar un profesor por correo electrónico.
 * @param {Object} data - Datos para actualizar.
 * @returns {Promise<Object|null>} - Profesor actualizado o error si no existe.
 */
export const updateTeacher = async ({ email, asignaciones, telefono, especialidad }) => {
    const userExists = await userService.searchUserByEmail(email);

    if (userExists) {
        const teacherExists = await teacherRepository.findTeacherByUserId(userExists.id);

        if (teacherExists) {
            const validAssignments = await buildValidAssignments(asignaciones);

            return await teacherRepository.updateTeacherByUserId(teacherExists.id, {
                grado_encargado: validAssignments,
                telefono,
                especialidad,
            });
        } else {
            throw new NotFoundError(`No existe el profesor!`);
        }
    } else {
        throw new NotFoundError(`No existe el usuario!`);
    }
};

/**
 * Eliminar un profesor por correo electrónico.
 * @param {String} email - Correo electrónico del usuario asociado.
 * @returns {Promise<Object|null>} - Profesor eliminado o error si no existe.
 */
// Borra SOLO el perfil de profesor, sin tocar el usuario. Lo usa el cambio de rol, donde la
// persona sigue existiendo y únicamente cambia de perfil.
export const deleteTeacherProfile = async (email, session) => {
    const teacherUser = await userService.searchUserByEmail(email);
    if (!teacherUser) {
        throw new NotFoundError("No existe el usuario");
    }

    const teacherExists = await teacherRepository.findTeacherByUserId(teacherUser.id);
    if (!teacherExists) {
        throw new NotFoundError("No existe el profesor");
    }

    return await teacherRepository.deleteTeacherById(teacherExists.id, session);
};

// Da de baja a un profesor: borra su perfil y desactiva su usuario, en una transacción, para que
// no pueda quedar un perfil borrado con el usuario vivo (antes el eraseUser lo hacía el controller).
export const deleteTeacher = async (email) => {
    const teacherUser = await userService.searchUserByEmail(email);
    if (!teacherUser) {
        throw new NotFoundError("No existe el usuario");
    }

    return await runInTransaction(async (session) => {
        const borrado = await deleteTeacherProfile(email, session);
        await deleteUserById(teacherUser.id, session);
        logger.info(`[ADMIN] Profesor dado de baja (perfil borrado + usuario desactivado): ${email}`);
        return borrado;
    });
};

/**
 * Obtener un profesor por ID de usuario y correo electrónico.
 * @param {String} email - Correo electrónico del usuario.
 * @returns {Promise<Object|null>} - Profesor encontrado o null.
 */
export const getTeacherByUserIdAndEmail = async (email) => {
    const teacherUser = await userService.searchUserByEmail(email);
    if (teacherUser) {
        const teacher = await teacherRepository.findTeacherByUserId(teacherUser.id);
        return teacher;
    } else {
        return null;
    }
};

// Asignaciones del profesor: [{ grado_seccion, materias }] (grado_seccion y materias populados).
// Devuelve [] si el usuario o el profesor no existen, para no dejar ramas muertas en quien la llama.
export const getTeacherAssignments = async (email) => {
    const teacherUser = await userService.searchUserByEmail(email);
    if (!teacherUser) {
        return [];
    }
    const teacher = await teacherRepository.findTeacherByUserId(teacherUser.id);
    return teacher ? teacher.grado_encargado : [];
};

// IDs de las materias que el profesor dicta EN una clase (grado/sección) concreta.
export const getTeacherSubjectIdsInClass = async (email, gradeSectionId) => {
    const assignments = await getTeacherAssignments(email);
    const gsId = gradeSectionId?.toString();
    const assignment = assignments.find((a) => a.grado_seccion?._id?.toString() === gsId);
    return assignment ? assignment.materias.map((m) => m._id) : [];
};

/**
 * Reporte del profesor: una entrada por cada clase que dicta y materia que dicta ahí.
 *
 * Antes se armaba a nivel de MATERIA: se tomaban las materias sueltas del profesor y se pedían
 * todos los alumnos y todas las evaluaciones de esa materia en el colegio. Con las evaluaciones
 * ya atadas a una clase, eso significaba que un profesor de Matemáticas en 5A veía en su propio
 * reporte a los alumnos de 6B con sus notas, y que a cada alumno se lo cruzaba contra
 * evaluaciones de otras clases (que le aparecían siempre en null, porque no eran suyas).
 * Ahora se recorren las asignaciones [{ grado_seccion, materias }], que es como el profesor
 * realmente da clase.
 */
export const getTeacherClassReport = async (email) => {
    const teacherUser = await userService.searchUserByEmail(email);
    if (!teacherUser) {
        throw new NotFoundError("Usuario no encontrado");
    }

    const teacher = await teacherRepository.findTeacherByUserId(teacherUser.id);
    if (!teacher) {
        throw new NotFoundError("Profesor no encontrado");
    }

    const studentRepository = await import('../repositories/student.repository.js');
    const evaluationRepository = await import('../repositories/evaluation.repository.js');
    const evaluationGradeRepository = await import('../repositories/evaluation_grade.repository.js');

    const report = [];

    // Un profesor sin asignaciones devuelve una lista vacía: es un estado válido, no un error.
    for (const asignacion of teacher.grado_encargado) {
        const gradeSection = asignacion.grado_seccion;
        if (!gradeSection) {
            continue; // la clase fue eliminada
        }

        const [students, evaluacionesDeLaClase] = await Promise.all([
            studentRepository.findStudentsByGradeSection(gradeSection._id),
            evaluationRepository.findEvaluationsByGradeSection(gradeSection._id),
        ]);

        // Se ocultan los alumnos cuyo usuario fue desactivado, igual que en el resto de listados
        const alumnosActivos = students.filter((student) => student.usuario);

        for (const materia of asignacion.materias) {
            if (!materia) {
                continue; // la materia fue eliminada
            }

            const evaluaciones = evaluacionesDeLaClase.filter(
                (evaluacion) => evaluacion.materia?._id?.toString() === materia._id.toString()
            );

            const grades = await evaluationGradeRepository.findEvaluationGradesByEvaluationIds(
                evaluaciones.map((evaluacion) => evaluacion._id)
            );
            const notasPorAlumnoYEvaluacion = new Map(
                grades.map((grade) => [`${grade.estudiante}-${grade.evaluacion}`, grade.calificacion])
            );

            report.push({
                materia: materia.nombre,
                grado: gradeSection.grado,
                seccion: gradeSection.seccion,
                estudiantes: alumnosActivos.map((student) => ({
                    estudiante: {
                        nombre: student.usuario.nombre,
                        apellido: student.usuario.apellido,
                        email: student.usuario.email,
                    },
                    evaluaciones: evaluaciones.map((evaluacion) => ({
                        evaluacion: evaluacion.nombre,
                        // ?? y no ||, para que una nota de 0 no se colapse a null
                        nota: notasPorAlumnoYEvaluacion.get(`${student._id}-${evaluacion._id}`) ?? null,
                        peso: evaluacion.peso,
                    })),
                })),
            });
        }
    }

    return report;
};

// getSubjectsByTeacherEmail se elimino: aplanaba las materias del profesor ignorando en
// que clase las dicta, y su unico consumidor era el reporte, que ahora usa las asignaciones.
