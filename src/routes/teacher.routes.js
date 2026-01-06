import express from 'express';
import { body } from 'express-validator';
import * as teacherController from '../controllers/teacher.controller.js';

const router = express.Router();

// Ruta para obtener todos los profesores
router.get('/', teacherController.getAllTeachers);

// Ruta para crear un profesor
router.post(
    '/',
    [
        body('nombre').isString().matches(/^[A-Za-z\s]+$/).withMessage('Nombre inválido, no use caracteres especiales.'),
        body('apellido').isString().matches(/^[A-Za-z\s]+$/).withMessage('Apellido inválido, no use caracteres especiales.'),
        body('email').isEmail().withMessage('Email inválido.'),
        body('password').isLength({ min: 6 }).withMessage('La contraseña debe tener al menos 6 caracteres.'),
        body('fecha_nacimiento').isDate().withMessage('Fecha de nacimiento inválida. Formato aceptado: yyyy-mm-dd.'),
        body('rolNombre').isString().withMessage('Rol inválido.'),
        body('genero').isString().matches(/^(Masculino|Femenino)$/).withMessage('Género inválido. Valores aceptados: Masculino, Femenino.'),
        body('domicilio').isString().withMessage('Domicilio inválido.'),
        body('nacionalidad').isString().withMessage('Nacionalidad inválida.'),
        body('asignaciones').isArray().withMessage('Asignaciones debe ser un arreglo.'),
        body('asignaciones.*.materias').isArray().withMessage('Materias debe ser un arreglo de cadenas.'),
        body('asignaciones.*.materias.*').isString().withMessage('Cada materia debe ser una cadena.'),
        body('asignaciones.*.grado_secciones').isArray().withMessage('Grado y secciones debe ser un arreglo.'),
        body('asignaciones.*.grado_secciones.*.grado').isString().withMessage('Cada grado debe ser una cadena.'),
        body('asignaciones.*.grado_secciones.*.seccion').isString().isLength({ min: 1, max: 1 }).withMessage('Cada sección debe ser un único carácter.'),
        body('telefono').isString().matches(/^\+?[1-9]\d{1,14}$/).withMessage('Teléfono inválido. Debe incluir el prefijo del país (ejemplo: +50312345678).'),
        body('especialidad').isString().withMessage('Especialidad inválida.'),
    ],
    teacherController.createTeacher
);

// Ruta para actualizar un profesor
router.put(
    '/',
    [
        body('email').isEmail().withMessage('Email inválido.'),
        body('asignaciones').isArray().withMessage('Asignaciones debe ser un arreglo.'),
        body('asignaciones.*.materias').isArray().withMessage('Materias debe ser un arreglo de cadenas.'),
        body('asignaciones.*.materias.*').isString().withMessage('Cada materia debe ser una cadena.'),
        body('asignaciones.*.grado_secciones').isArray().withMessage('Grado y secciones debe ser un arreglo.'),
        body('asignaciones.*.grado_secciones.*.grado').isString().withMessage('Cada grado debe ser una cadena.'),
        body('asignaciones.*.grado_secciones.*.seccion').isString().isLength({ min: 1, max: 1 }).withMessage('Cada sección debe ser un único carácter.'),
        body('telefono').isString().matches(/^\+?[1-9]\d{1,14}$/).withMessage('Teléfono inválido. Debe incluir el prefijo del país (ejemplo: +50312345678).'),
        body('especialidad').isString().withMessage('Especialidad inválida.'),
    ],
    teacherController.updateTeacher
);

// Ruta para eliminar un profesor
router.delete(
    '/',
    [
        body('email').isEmail().withMessage('Email inválido.'),
    ],
    teacherController.deleteTeacher
);

router.get('/get-teacherInfo', teacherController.getTeacherSubjectInfo)

//router.post('/get-teacherInfo', teacherController.getTeacherSubjectInfo)

export default router;
