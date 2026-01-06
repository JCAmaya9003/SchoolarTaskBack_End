import * as studentRepository from '../repositories/student.repository.js'
import * as userService from '../services/user-service.js'
import * as parentService from '../services/parent.service.js'
import * as gradeSectionService from '../services/gradeSection.service.js'
import * as evaluationGradeService from '../services/evaluation_grade.service.js';
import * as evaluationService from '../services/evaluation.service.js';

export const getStudents = async () =>{
    return await studentRepository.findAllStudents();
};

export const createStudent = async ({nombre, apellido, email, password, fecha_nacimiento, rolNombre, genero, domicilio, nacionalidad, 
    email_padre, grado, seccion, alergias, condiciones_medicas, contacto_emergencia}) => {

    const parentExists = await parentService.getParentByUserIdAndEmail(email_padre);
    console.log(parentExists);

    if (parentExists) {
        console.log("grado y seccion van " + grado, seccion);
        const gradeSectionExists = await gradeSectionService.getGradeAndSection(grado, seccion);
        console.log(gradeSectionExists);

        if (gradeSectionExists) {
            // Cambiar subjectService a roleService
            console.log(rolNombre);

                const userExists = await userService.searchUserByEmail(email);
                console.log(userExists);
                if (!userExists) {
                    console.log("si entro");
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
                        throw new Error("El estudiante ya existe");
                    }
                } else {
                    throw new Error("El usuario ya existe");
                }
        } else {
            throw new Error("El grado y sección no existe");
        }
    } else {
        throw new Error("El padre no existe");
    }
};


export const updateStudent = async ({email, grado, seccion, alergias, condiciones_medicas, contacto_emergencia}) =>{
    const userExists = await userService.searchUserByEmail(email);
    console.log("userExists: " + userExists);

    if(userExists){
        const studentExists = await studentRepository.findStudentByUserId(userExists.id);
        console.log("studentExists: " + studentExists);

        if(studentExists){
            const gradeSection = await gradeSectionService.getGradeAndSection(grado, seccion);
            console.log(gradeSection);

            if(gradeSection){
                return await studentRepository.updateStudentByUserId(studentExists.id, 
                    {grado_seccion: gradeSection, alergias, condiciones_medicas, contacto_emergencia});
            }else{
                throw new Error("Grado y seccion inexistentes");
            }
        }else{
            throw new Error("El estudiante no existe");
        }
    }else{
        throw new Error("Usuario inexistente");
    }
};

export const deleteStudent = async (email) =>{
    const studentUser = await userService.searchUserByEmail(email);
    console.log("studentUser: " + studentUser);
    if(studentUser){
        const studentExists = await studentRepository.findStudentByUserId(studentUser.id);

        if(studentExists){
            return await studentRepository.deleteStudentByUserId(studentExists.id);
        }else{
            throw new Error("El Estudiante no existe!");
        }
    }else{
        throw new Error("Usuario inexistente");
    }
};

export const getStudentByUserIdAndEmail = async (email) =>{
    const studentUser = await userService.searchUserByEmail(email);
    if(studentUser){
        const student = await studentRepository.findStudentByUserId(studentUser.id);
        return student;
    }else{
        throw new Error("El usuario no existe");
    }
};

export const deleteWithId = async ({id}) =>{
    const deleted = await studentRepository.deleteStudentById(id);
    console.log(deleted);
    return deleted;
};

export const getStudentGradesInfo = async (email) => {
    const studentUser = await userService.searchUserByEmail(email);
    if (!studentUser) {
        throw new Error("Usuario no encontrado");
    }

    const student = await studentRepository.findStudentByUserId(studentUser.id);
    if (!student) {
        throw new Error("Estudiante no encontrado");
    }

    // Obtener la combinación de grado y sección
    const gradeSection = student.grado_seccion;
    if (!gradeSection) {
        throw new Error("Grado y sección no encontrados para el estudiante");
    }

    // Obtener las materias del grado y sección
    console.log("grado y seccion a enviar: " + gradeSection.grado, gradeSection.seccion);
    const subjects = await gradeSectionService.getSubjectsByGradeAndSection(gradeSection.grado, gradeSection.seccion);
    if (!subjects.length) {
        throw new Error("No se encontraron materias para el grado y sección del estudiante");
    }

    // Preparar la respuesta
    const response = [];

    console.log("Estudiante encontrado:", student);
    console.log("Grado y sección del estudiante:", gradeSection);
    console.log("Materias obtenidas:", subjects);

    for (const subject of subjects) {
        console.log("Materia actual:", subject);
        const evaluations = await evaluationService.getEvaluationsBySubject(subject.nombre);
        console.log("Evaluaciones para la materia:", evaluations);

        // Crear un arreglo de objetos con evaluaciones, notas y pesos
        const evaluationData = await Promise.all(
            evaluations.map(async (evaluation) => {
                const grade = await evaluationGradeService.getEvaluationGradesByStudentAndEvaluation(student._id, evaluation._id);
                return {
                    evaluacion: evaluation.nombre,
                    nota: grade ? grade.calificacion : null,
                    peso: evaluation.peso,
                };
            })
        );

        // Estructurar los datos para cada materia
        response.push({
            materia: subject.nombre,
            evaluaciones: evaluationData, // Aquí estará el arreglo de objetos con evaluaciones, notas y pesos
        });
    }

    return response;
};


export const getStudentsByParentEmail = async (email_padre) => {
    // Verificar si el padre existe
    const parent = await parentService.getParentByUserIdAndEmail(email_padre);
    if (!parent) {
        throw new Error("Padre no encontrado");
    }

    console.log("Padre encontrado:", parent);

    // Buscar estudiantes relacionados con el padre
    const students = await studentRepository.findStudentsByParentId(parent._id);
    if (!students.length) {
        throw new Error("No se encontraron estudiantes relacionados con el padre");
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


