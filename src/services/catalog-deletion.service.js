import * as subjectRepository from '../repositories/subject.repository.js';
import * as gradeSectionRepository from '../repositories/gradeSection.repository.js';
import * as evaluationRepository from '../repositories/evaluation.repository.js';
import * as evaluationGradeRepository from '../repositories/evaluation_grade.repository.js';
import * as teacherRepository from '../repositories/teacher.repository.js';
import * as studentRepository from '../repositories/student.repository.js';
import logger from '../config/logger.js';
import { NotFoundError, ConflictError } from '../errors/errors.js';

/**
 * Borrar una materia o una clase arrastra datos reales (evaluaciones, notas, pensums,
 * asignaciones de profesores), y antes se hacía en silencio con un 200: la evaluación quedaba
 * sin materia, el alumno sin clase y su vista de notas en 404, sin ningún aviso.
 *
 * Ahora el borrado es en dos pasos. El primer intento nunca borra nada: si el catálogo está en
 * uso responde 409 con el detalle de lo que se va a destruir, para que el admin lo vea (y para
 * que el frontend pueda mostrarlo en el diálogo de confirmación). Recién con `confirmar: true`
 * se ejecuta la cascada. Así un error de dedo no puede destruir nada de un solo click.
 */

// Impacto de borrar una materia: sus evaluaciones y notas se van; el pensum de las clases y
// las asignaciones de los profesores se limpian.
const buildSubjectImpact = async (subject) => {
    const evaluationIds = await evaluationRepository.findEvaluationIdsByFilter({ materia: subject._id });
    const [calificaciones, clases, profesores] = await Promise.all([
        evaluationGradeRepository.countEvaluationGradesByEvaluationIds(evaluationIds),
        gradeSectionRepository.findGradeSectionsBySubject(subject._id),
        teacherRepository.findTeachersBySubject(subject._id),
    ]);

    return {
        evaluationIds,
        impacto: {
            evaluaciones: evaluationIds.length,
            calificaciones,
            clases_afectadas: clases.map((c) => `${c.grado}${c.seccion}`),
            profesores_afectados: profesores.length,
        },
    };
};

// Impacto de borrar una clase. Los estudiantes matriculados son un bloqueo, no un aviso:
// Student.grado_seccion es obligatorio en el modelo, así que dejarlos sin clase produciría
// documentos inválidos. Hay que reubicarlos antes, y por eso ni siquiera `confirmar` lo fuerza.
const buildGradeSectionImpact = async (gradeSection) => {
    const evaluationIds = await evaluationRepository.findEvaluationIdsByFilter({ grado_seccion: gradeSection._id });
    const [calificaciones, estudiantes, profesores] = await Promise.all([
        evaluationGradeRepository.countEvaluationGradesByEvaluationIds(evaluationIds),
        studentRepository.findStudentsByGradeSection(gradeSection._id),
        teacherRepository.findTeachersByGradeSection(gradeSection._id),
    ]);

    return {
        evaluationIds,
        estudiantesMatriculados: estudiantes.length,
        impacto: {
            evaluaciones: evaluationIds.length,
            calificaciones,
            estudiantes_matriculados: estudiantes.length,
            profesores_afectados: profesores.length,
        },
    };
};

const tieneImpacto = (impacto) =>
    impacto.evaluaciones > 0 ||
    impacto.calificaciones > 0 ||
    impacto.profesores_afectados > 0 ||
    (impacto.clases_afectadas?.length ?? 0) > 0 ||
    (impacto.estudiantes_matriculados ?? 0) > 0;

const conflictoDeConfirmacion = (mensaje, impacto) => {
    const error = new ConflictError(mensaje);
    error.impacto = impacto;
    return error;
};

/**
 * Eliminar una materia, en cascada y con confirmación previa.
 * @param {String} nombre - Nombre de la materia.
 * @param {Boolean} confirmar - Si es true, ejecuta la cascada.
 */
export const deleteSubjectCascade = async (nombre, confirmar = false) => {
    const subject = await subjectRepository.findSubjectByName(nombre);
    if (!subject) {
        throw new NotFoundError("La materia no existe");
    }

    const { evaluationIds, impacto } = await buildSubjectImpact(subject);

    if (tieneImpacto(impacto) && !confirmar) {
        throw conflictoDeConfirmacion(
            'La materia está en uso. Revisá el impacto y reintentá con confirmar: true para borrarla junto con todo lo que depende de ella.',
            impacto
        );
    }

    // Primero lo que depende de las evaluaciones, después las evaluaciones, y al final las
    // referencias a la materia. Así no queda nada apuntando a un documento ya borrado.
    if (evaluationIds.length > 0) {
        await evaluationGradeRepository.deleteEvaluationGradesByEvaluationIds(evaluationIds);
        await evaluationRepository.deleteEvaluationsByFilter({ materia: subject._id });
    }
    await gradeSectionRepository.pullSubjectFromAllGradeSections(subject._id);
    await teacherRepository.pullSubjectFromAllAssignments(subject._id);

    const eliminada = await subjectRepository.deleteSubjectById(subject._id);

    logger.info(`[ADMIN] Materia eliminada en cascada: ${nombre}`, impacto);
    return { eliminada, impacto };
};

/**
 * Eliminar un grado y sección, en cascada y con confirmación previa.
 * @param {String} grado - Grado.
 * @param {String} seccion - Sección.
 * @param {Boolean} confirmar - Si es true, ejecuta la cascada.
 */
export const deleteGradeSectionCascade = async (grado, seccion, confirmar = false) => {
    const gradeSection = await gradeSectionRepository.findGradeAndSection(grado, seccion);
    if (!gradeSection) {
        throw new NotFoundError("El grado y sección no existe");
    }

    const { evaluationIds, estudiantesMatriculados, impacto } = await buildGradeSectionImpact(gradeSection);

    // Bloqueo duro: ni con confirmar. Un alumno sin clase sería un documento inválido.
    if (estudiantesMatriculados > 0) {
        throw conflictoDeConfirmacion(
            `No se puede eliminar la clase: tiene ${estudiantesMatriculados} estudiante(s) matriculado(s). Reubicalos en otra clase antes de borrarla.`,
            impacto
        );
    }

    if (tieneImpacto(impacto) && !confirmar) {
        throw conflictoDeConfirmacion(
            'La clase está en uso. Revisá el impacto y reintentá con confirmar: true para borrarla junto con todo lo que depende de ella.',
            impacto
        );
    }

    if (evaluationIds.length > 0) {
        await evaluationGradeRepository.deleteEvaluationGradesByEvaluationIds(evaluationIds);
        await evaluationRepository.deleteEvaluationsByFilter({ grado_seccion: gradeSection._id });
    }
    await teacherRepository.pullGradeSectionFromAllAssignments(gradeSection._id);

    const eliminada = await gradeSectionRepository.deleteGradeAndSectionById(gradeSection._id);

    logger.info(`[ADMIN] Grado y sección eliminado en cascada: ${grado}${seccion}`, impacto);
    return { eliminada, impacto };
};
