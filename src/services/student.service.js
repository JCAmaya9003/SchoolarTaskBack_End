import * as studentRepository from '../repositories/student.repository.js'
import * as userService from '../services/user-service.js'
import * as parentService from '../services/parent.service.js'
import * as gradeSectionService from '../services/gradeSection.service.js'
import * as evaluationGradeService from '../services/evaluation_grade.service.js';
import * as evaluationService from '../services/evaluation.service.js';
import { hardDeleteUserById } from '../repositories/user-repository.js';
import logger from '../config/logger.js';
import { NotFoundError, ConflictError } from '../errors/errors.js';

export const getStudents = async (page, limit) =>{
    return await studentRepository.findAllStudents(page, limit);
};

export const createStudent = async ({nombre, apellido, email, password, fecha_nacimiento, rolNombre, genero, domicilio, nacionalidad, 
    email_padre, grado, seccion, alergias, condiciones_medicas, contacto_emergencia}) => {

    const parentExists = await parentService.getParentByUserIdAndEmail(email_padre);

    if (parentExists) {
        const gradeSectionExists = await gradeSectionService.getGradeAndSection(grado, seccion);

        if (gradeSectionExists) {
                const userExists = await userService.searchUserByEmail(email);
                if (!userExists) {
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
                    });

                    try {
                        const studentExists = await studentRepository.findStudentByUserId(user.id);

                        if (!studentExists) {
                            return await studentRepository.createStudent({
                                usuario: user,
                                padre: parentExists,
                                grado_seccion: gradeSectionExists,
                                alergias,
                                condiciones_medicas,
                                contacto_emergencia: {
                                    nombre: contacto_emergencia.nombre,
                                    telefono: contacto_emergencia.telefono,
                                },
                            });
                        } else {
                            throw new ConflictError("El estudiante ya existe");
                        }
                    } catch (error) {
                        // Rollback: eliminar el usuario creado si falla la creación del estudiante
                        await hardDeleteUserById(user._id);
                        logger.warn(`Rollback: Usuario ${email} eliminado tras fallo en creación de estudiante`);
                        throw error;
                    }
                } else {
                    throw new ConflictError("El usuario ya existe");
                }
        } else {
            throw new NotFoundError("El grado y sección no existe");
        }
    } else {
        throw new NotFoundError("El padre no existe");
    }
};


export const updateStudent = async ({email, grado, seccion, alergias, condiciones_medicas, contacto_emergencia}) =>{
    const userExists = await userService.searchUserByEmail(email);

    if(userExists){
        const studentExists = await studentRepository.findStudentByUserId(userExists.id);

        if(studentExists){
            const gradeSection = await gradeSectionService.getGradeAndSection(grado, seccion);

            if(gradeSection){
                return await studentRepository.updateStudentByUserId(studentExists.id,
                    {grado_seccion: gradeSection, alergias, condiciones_medicas, contacto_emergencia});
            }else{
                throw new NotFoundError("Grado y seccion inexistentes");
            }
        }else{
            throw new NotFoundError("El estudiante no existe");
        }
    }else{
        throw new NotFoundError("Usuario inexistente");
    }
};

export const deleteStudent = async (email) =>{
    const studentUser = await userService.searchUserByEmail(email);
    if(studentUser){
        const studentExists = await studentRepository.findStudentByUserId(studentUser.id);

        if(studentExists){
            return await studentRepository.deleteStudentByUserId(studentExists.id);
        }else{
            throw new NotFoundError("El Estudiante no existe!");
        }
    }else{
        throw new NotFoundError("Usuario inexistente");
    }
};

export const getStudentByUserIdAndEmail = async (email) =>{
    const studentUser = await userService.searchUserByEmail(email);
    if(studentUser){
        const student = await studentRepository.findStudentByUserId(studentUser.id);
        return student;
    }else{
        throw new NotFoundError("El usuario no existe");
    }
};

export const deleteWithId = async ({id}) =>{
    const deleted = await studentRepository.deleteStudentById(id);
    if (!deleted) {
        throw new NotFoundError("No se encontró un estudiante con ese id");
    }
    return deleted;
};

export const getStudentGradesInfo = async (email) => {
    const studentUser = await userService.searchUserByEmail(email);
    if (!studentUser) {
        throw new NotFoundError("Usuario no encontrado");
    }

    const student = await studentRepository.findStudentByUserId(studentUser.id);
    if (!student) {
        throw new NotFoundError("Estudiante no encontrado");
    }

    // Obtener la combinación de grado y sección
    const gradeSection = student.grado_seccion;
    if (!gradeSection) {
        throw new NotFoundError("Grado y sección no encontrados para el estudiante");
    }

    // Obtener las materias del grado y sección
    const subjects = await gradeSectionService.getSubjectsByGradeAndSection(gradeSection.grado, gradeSection.seccion);
    if (!subjects.length) {
        throw new NotFoundError("No se encontraron materias para el grado y sección del estudiante");
    }

    // OPTIMIZACIÓN: Obtener todas las evaluaciones de todas las materias en una sola consulta
    const subjectIds = subjects.map(s => s._id);
    const evaluationRepository = await import('../repositories/evaluation.repository.js');
    const allEvaluations = await evaluationRepository.findEvaluationsBySubjects(subjectIds);

    // OPTIMIZACIÓN: Obtener todas las calificaciones del estudiante en una sola consulta
    const evaluationGradeRepository = await import('../repositories/evaluation_grade.repository.js');
    const allGrades = await evaluationGradeRepository.findEvaluationGradesByStudent(student._id);

    // Crear un Map de calificaciones para búsqueda O(1)
    const gradesMap = new Map(allGrades.map(g => [g.evaluacion._id.toString(), g.calificacion]));

    // Agrupar evaluaciones por materia
    const evaluationsBySubject = allEvaluations.reduce((acc, evaluation) => {
        const subjectId = evaluation.materia._id.toString();
        if (!acc[subjectId]) {
            acc[subjectId] = [];
        }
        acc[subjectId].push(evaluation);
        return acc;
    }, {});

    // Preparar la respuesta
    const response = subjects.map(subject => {
        const subjectEvaluations = evaluationsBySubject[subject._id.toString()] || [];

        const evaluationData = subjectEvaluations.map(evaluation => ({
            evaluacion: evaluation.nombre,
            nota: gradesMap.get(evaluation._id.toString()) || null,
            peso: evaluation.peso,
        }));

        return {
            materia: subject.nombre,
            evaluaciones: evaluationData,
        };
    });

    return response;
};


export const getStudentsByParentEmail = async (email_padre) => {
    // Verificar si el padre existe
    const parent = await parentService.getParentByUserIdAndEmail(email_padre);
    if (!parent) {
        throw new NotFoundError("Padre no encontrado");
    }

    // Buscar estudiantes relacionados con el padre
    const students = await studentRepository.findStudentsByParentId(parent._id);
    if (!students.length) {
        throw new NotFoundError("No se encontraron estudiantes relacionados con el padre");
    }

    return students;
};

export const getStudentsBySubject = async (subjectId) => {
    // Buscar todos los grados y secciones que contienen esta materia
    const gradeSections = await gradeSectionService.getGradeSectionsBySubject(subjectId);

    // Obtener estudiantes relacionados con los grados y secciones encontrados
    const students = await Promise.all(
        gradeSections.map(async (gradeSection) => {
            return await studentRepository.findStudentsByGradeSection(gradeSection._id);
        })
    );

    // Aplanar el arreglo de estudiantes y devolver
    return students.flat();
};


