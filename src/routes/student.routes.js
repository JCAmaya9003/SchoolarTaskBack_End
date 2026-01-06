import express from 'express';
import { body } from 'express-validator';
import * as studentController from '../controllers/student.controller.js'

const router = express.Router();

router.get('/', studentController.getAllStudents);

router.post(
    '/',
    [
        body('nombre').isString().matches(/^[A-Za-z\s]+$/).withMessage('Nombre Invalido! No use caracteres especiales!'),
        body('apellido').isString().matches(/^[A-Za-z\s]+$/).withMessage('Apellido Invalido! No use caracteres especiales!'),
        body('fecha_nacimiento').isDate().withMessage('Fecha de nacimiento invalida! Formato aceptado: yyyy-mm-dd'),
        body('email').isEmail().withMessage('Email inválido'),
        body('password').isLength({ min: 6 }).withMessage('La contraseña debe tener al menos 6 caracteres'),
        body('rolNombre').isString().withMessage('Rol Invalido!'),
        body('genero').isString().matches(/^[A-Za-z\s]+$/).withMessage('Nombre Invalido! Generos validos: "Masculino" y "Femenino"'),
        body('domicilio').isString().withMessage('Domicilio Incorrecto'),
        body('nacionalidad').isString().withMessage('Nacionalidad Incorrecto'),
        body('email_padre').isEmail().withMessage('Email inválido'),
        body('grado').isString().withMessage('Grado Invalido!'),
        body('seccion').isString().isLength({ min: 1, max: 1 }).matches(/^[A-Za-z]$/).withMessage('Grado Invalido!'),
        body('alergias').isString().withMessage('Alergia/s Invalida/s!'),
        body('condiciones_medicas').isString().withMessage('Condiones Medicas Invalidas! Si no tiene debe de escribir algo!'),
        body('contacto_emergencia.nombre').isString().matches(/^[A-Za-z\s]+$/).withMessage('Nombre del contaco de emergencia invalido! No use caracteres especiales!'),
        body('contacto_emergencia.telefono').isString().matches(/^\+?[1-9]\d{1,14}$/).withMessage('Teléfono inválido. Debe incluir el prefijo del país y ser un número válido (e.g., +50312345678).'),
    ],
    studentController.createStudent
  );
  router.put('/' ,
    [
        body('email').isEmail().withMessage('Email inválido'),
        body('grado').isString().withMessage('Grado Invalido!'),
        body('seccion').isString().isLength({ min: 1, max: 1 }).matches(/^[A-Za-z]$/).withMessage('Grado Invalido!'),
        body('alergias').isString().withMessage('Alergia/s Invalida/s!'),
        body('condiciones_medicas').isString().withMessage('Condiones Medicas Invalidas! Si no tiene debe de escribir algo!'),
        body('contacto_emergencia.nombre').isString().matches(/^[A-Za-z\s]+$/).withMessage('Nombre del contaco de emergencia invalido! No use caracteres especiales!'),
        body('contacto_emergencia.telefono').isString().matches(/^\+?[1-9]\d{1,14}$/).withMessage('Teléfono inválido. Debe incluir el prefijo del país y ser un número válido (e.g., +50312345678).'),
    ],
studentController.updateStudent);

router.delete('/',
    [
        body('email').isEmail().withMessage('Email inválido'),
    ],
    studentController.deleteStudent);

router.delete('/id',
    [
        body('id').isString().withMessage('Id inválido'),
    ],
    studentController.deleteById);

router.post('/get-all',
    [
        body('email').isEmail().withMessage('Email inválido'),
    ],
    studentController.getStudentGradesInfo);

/*router.post('/get-students-withParent',
    [
        body('email').isEmail().withMessage('Email inválido'),
    ],
    studentController.getStudentsByParentEmail);
    */
router.get('/get-students-filterWithParent', studentController.getStudentGradesInfoParent);

    /*router.post('/get-students-fwParent',
    [
        body('email').isEmail().withMessage('Email inválido'),
    ],
    studentController.getStudentGradesInfoParent);*/ 

export default router;