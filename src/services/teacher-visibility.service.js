import * as teacherService from './teacher.service.js';
import * as userService from './user-service.js';
import * as studentRepository from '../repositories/student.repository.js';
import * as parentRepository from '../repositories/parent.repository.js';

/**
 * Hasta dónde llega la vista de un profesor sobre las personas del colegio.
 *
 * `verifyOwnResource` deja que el teacher bypasee la verificación de propiedad igual que el
 * admin, así que sin esto un profesor podía leer el perfil completo de cualquier alumno del
 * colegio (domicilio, alergias, condiciones médicas, contacto de emergencia) y de cualquier
 * padre, aunque no le diera clase. El criterio es el mismo que en el resto del sistema:
 * el alcance del profesor es la CLASE, no el colegio.
 *
 * Vive en su propio módulo para no crear un ciclo de imports: student.service ya importa
 * teacher.service, así que teacher.service no puede importar student.service de vuelta.
 */

// Un alumno es "suyo" si dicta al menos una materia en la clase de ese alumno
export const canViewStudent = async (teacherEmail, studentEmail) => {
    const studentUser = await userService.searchUserByEmail(studentEmail);
    if (!studentUser) {
        return false;
    }

    const student = await studentRepository.findStudentByUserId(studentUser.id);
    if (!student?.grado_seccion) {
        return false;
    }

    const subjectIds = await teacherService.getTeacherSubjectIdsInClass(teacherEmail, student.grado_seccion._id);
    return subjectIds.length > 0;
};

// Un padre es visible si alguno de sus hijos es alumno suyo: es a quien tiene que llamar
// si pasa algo en clase.
export const canViewParent = async (teacherEmail, parentEmail) => {
    const parentUser = await userService.searchUserByEmail(parentEmail);
    if (!parentUser) {
        return false;
    }

    const parent = await parentRepository.findParentByUserId(parentUser.id);
    if (!parent) {
        return false;
    }

    const children = await studentRepository.findStudentsByParentId(parent._id);

    for (const child of children) {
        if (!child.grado_seccion) {
            continue;
        }
        const subjectIds = await teacherService.getTeacherSubjectIdsInClass(teacherEmail, child.grado_seccion._id);
        if (subjectIds.length > 0) {
            return true;
        }
    }
    return false;
};
