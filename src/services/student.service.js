import * as studentRepository from '../repositories/student.repository.js'
import * as userService from '../services/user-service.js'
import * as parentService from '../services/parent.service.js'
import * as gradeSectionService from '../services/gradeSection.service.js'
import * as evaluationGradeService from '../services/evaluation_grade.service.js';
import * as evaluationService from '../services/evaluation.service.js';
import * as teacherService from '../services/teacher.service.js';
import { deleteUserById } from '../repositories/user-repository.js';
import { runInTransaction } from '../utils/transaction.js';
import logger from '../config/logger.js';
import { NotFoundError, ConflictError, ForbiddenError } from '../errors/errors.js';

export const getStudents = async (page, limit) =>{
    return await studentRepository.findAllStudents(page, limit);
};

export const createStudent = async ({nombre, apellido, email, password, fecha_nacimiento, rolNombre, genero, domicilio, nacionalidad, 
    email_padre, grado, seccion, alergias, condiciones_medicas, contacto_emergencia}) => {

    const parentExists = await parentService.getParentByUserIdAndEmail(email_padre);
    if (!parentExists) {
        throw new NotFoundError("El padre no existe");
    }

    const gradeSectionExists = await gradeSectionService.getGradeAndSection(grado, seccion);
    if (!gradeSectionExists) {
        throw new NotFoundError("El grado y sección no existe");
    }

    const userExists = await userService.searchUserByEmail(email);
    if (userExists) {
        throw new ConflictError("El usuario ya existe");
    }

    // El usuario y su perfil se crean en una transacción. Antes se creaba el usuario y, si la
    // creación del perfil fallaba, se intentaba deshacerlo a mano con hardDeleteUserById: si ese
    // rollback también fallaba, se perdía el error original y quedaba un usuario huérfano.
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
        }, session);
    });
};


// Crea el perfil de estudiante sobre un usuario que YA existe. Lo usa el cambio de rol, donde
// el User no se crea de nuevo (a diferencia de createStudent), solo se le arma el perfil nuevo.
export const createStudentProfileForUser = async (user, {email_padre, grado, seccion, alergias, condiciones_medicas, contacto_emergencia}, session) => {
    const parentExists = await parentService.getParentByUserIdAndEmail(email_padre);
    if (!parentExists) {
        throw new NotFoundError("El padre no existe");
    }

    const gradeSectionExists = await gradeSectionService.getGradeAndSection(grado, seccion);
    if (!gradeSectionExists) {
        throw new NotFoundError("El grado y sección no existe");
    }

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
    }, session);
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

// Borra SOLO el perfil de estudiante y sus notas, sin tocar el usuario. Lo usa el cambio de rol,
// donde la persona sigue existiendo y únicamente cambia de perfil.
export const deleteStudentProfile = async (email, session) => {
    const studentUser = await userService.searchUserByEmail(email);
    if(!studentUser){
        throw new NotFoundError("Usuario inexistente");
    }

    const studentExists = await studentRepository.findStudentByUserId(studentUser.id);
    if(!studentExists){
        throw new NotFoundError("El Estudiante no existe!");
    }

    // Primero las notas, después el perfil, para no dejarlas huérfanas apuntando a un estudiante
    // inexistente (mismo criterio que al borrar una evaluación).
    const evaluationGradeRepository = await import('../repositories/evaluation_grade.repository.js');
    await evaluationGradeRepository.deleteEvaluationGradesByStudentId(studentExists.id, session);
    return await studentRepository.deleteStudentByUserId(studentExists.id, session);
};

// Da de baja a un estudiante: borra sus notas, borra su perfil y desactiva su usuario. Las tres
// escrituras van en una transacción, así no puede quedar un perfil borrado con el usuario vivo
// (antes el eraseUser lo hacía el controller, como una segunda escritura suelta).
export const deleteStudent = async (email) =>{
    const studentUser = await userService.searchUserByEmail(email);
    if(!studentUser){
        throw new NotFoundError("Usuario inexistente");
    }

    return await runInTransaction(async (session) => {
        const borrado = await deleteStudentProfile(email, session);
        await deleteUserById(studentUser.id, session);
        logger.info(`[ADMIN] Estudiante dado de baja (perfil borrado + usuario desactivado): ${email}`);
        return borrado;
    });
};

// Devuelve null si el usuario no existe o si no tiene perfil de student,
// para no dejar ramas muertas en quien la llama.
export const getStudentByUserIdAndEmail = async (email) =>{
    const studentUser = await userService.searchUserByEmail(email);
    if(!studentUser){
        return null;
    }
    return await studentRepository.findStudentByUserId(studentUser.id);
};

export const getStudentGradesInfo = async (email, requestingUser) => {
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

    // Obtener las materias del grado y sección. Una clase sin materias cargadas todavía es un
    // estado válido (clase recién creada), no un error: se devuelve un boletín vacío en vez de
    // un 404, mismo criterio que el padre sin hijos.
    let subjects = await gradeSectionService.getSubjectsByGradeAndSection(gradeSection.grado, gradeSection.seccion);

    // Un teacher ve solo las materias que dicta EN la clase de este alumno, igual que en
    // /by-student y /all. Si no dicta ninguna, el alumno no es suyo y no puede verlo.
    // El propio alumno, su padre y el admin siguen viendo el boletín completo.
    if (requestingUser?.role === 'teacher') {
        const ownSubjectIds = await teacherService.getTeacherSubjectIdsInClass(requestingUser.email, gradeSection._id);
        const ownSubjects = new Set(ownSubjectIds.map((id) => id.toString()));
        subjects = subjects.filter((s) => ownSubjects.has(s._id.toString()));

        if (!subjects.length) {
            throw new ForbiddenError("No dictas ninguna materia en la clase de este estudiante");
        }
    }

    // Evaluaciones de la clase del estudiante (grado/sección), no de la materia en otros grados:
    // las evaluaciones ahora están atadas a un grado_seccion concreto.
    const evaluationRepository = await import('../repositories/evaluation.repository.js');
    const allEvaluations = await evaluationRepository.findEvaluationsByGradeSection(gradeSection._id);

    // OPTIMIZACIÓN: Obtener todas las calificaciones del estudiante en una sola consulta
    const evaluationGradeRepository = await import('../repositories/evaluation_grade.repository.js');
    const allGrades = await evaluationGradeRepository.findEvaluationGradesByStudent(student._id);

    // Crear un Map de calificaciones para búsqueda O(1). Se ignoran notas huérfanas (evaluación
    // borrada antes de que existiera la cascada): sin este filtro, g.evaluacion sería null y
    // g.evaluacion._id rompería toda la vista de notas con un 500.
    const gradesMap = new Map(
        allGrades.filter(g => g.evaluacion).map(g => [g.evaluacion._id.toString(), g.calificacion])
    );

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
            nota: gradesMap.get(evaluation._id.toString()) ?? null,
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

    // Un padre sin hijos asignados todavía es un estado válido, no un error: el admin puede
    // haberlo dado de alta antes de matricular a sus hijos. Devolver una lista vacía.
    return await studentRepository.findStudentsByParentId(parent._id);
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


