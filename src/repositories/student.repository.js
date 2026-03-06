import Student from "../models/student-model.js";
import { getPaginationParams, getPaginationMeta } from "../utils/pagination-helper.js";

export const findStudentByUserId = async (userId) => {
    return await Student.findOne({usuario: userId }).populate([
        {
            path: 'usuario', 
            select: 'nombre apellido email rol', 
            populate: {
                path: 'rol', 
                select: 'nombre',
            },
        },
        {
            path: 'padre', 
            select: 'telefono telefono_trabajo lugar_trabajo profesion domicilio nacionalidad',
        },
        {
            path: 'grado_seccion', 
            select: 'grado seccion materias',
            populate: {
                path: 'materias',
                select: 'nombre',
            }
        },
    ]);
  };
    
    export const findAllStudents = async (page, limit) =>{
      const { skip, limit: validLimit, page: validPage } = getPaginationParams(page, limit);

      const [students, total] = await Promise.all([
        Student.find()
          .skip(skip)
          .limit(validLimit)
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
                path: 'padre',
                select: 'usuario telefono telefono_trabajo lugar_trabajo profesion domicilio nacionalidad',
                populate: {
                    path: 'usuario',
                    select: 'nombre apellido email rol',
                    populate: {
                        path: 'rol',
                        select: 'nombre'
                    }
                }
            },
            {
                path: 'grado_seccion',
                select: 'grado seccion materias',
                populate: {
                    path: 'materias',
                    select: 'nombre',
                }
            },
          ]),
        Student.countDocuments(),
      ]);

      return {
        data: students,
        pagination: getPaginationMeta(validPage, validLimit, total),
      };
    }
    
    export const createStudent = async (studentData) => {
      const student = new Student(studentData);
      const savedStudent = await student.save();
      return await savedStudent.populate([
        {
            path: 'usuario', 
            select: 'nombre apellido email rol', 
            populate: {
                path: 'rol', 
                select: 'nombre',
            },
        },
        {
            path: 'padre', 
            select: 'telefono telefono_trabajo lugar_trabajo profesion domicilio nacionalidad',
        },
        {
            path: 'grado_seccion', 
            select: 'grado seccion materias',
        },
    ]);
  
    };
    
    export const updateStudentByUserId = async (id, updates) => {
      return await Student.findByIdAndUpdate(id, updates, { new: true, runValidators: true }).populate([
        {
            path: 'usuario', 
            select: 'nombre apellido email rol', 
            populate: {
                path: 'rol', 
                select: 'nombre',
            },
        },
        {
            path: 'padre', 
            select: 'usuario telefono telefono_trabajo lugar_trabajo profesion domicilio nacionalidad',
            populate: {
                path: 'usuario',
                select: 'nombre apellido email rol',
                populate: {
                    path: 'rol',
                    select: 'nombre'
                }
            }
        },
        {
            path: 'grado_seccion', 
            select: 'grado seccion materias',
            populate: {
                path: 'materias',
                select: 'nombre',
            }
        },
    ]);
    };
        
    export const deleteStudentByUserId = async (id) => {
      return await Student.findByIdAndDelete(id).populate([
        {
            path: 'usuario', 
            select: 'nombre apellido email rol', 
            populate: {
                path: 'rol', 
                select: 'nombre',
            },
        },
        {
            path: 'padre', 
            select: 'telefono telefono_trabajo lugar_trabajo profesion domicilio nacionalidad',
        },
        {
            path: 'grado_seccion', 
            select: 'grado seccion materias',
            populate: {
                path: 'materias',
                select: 'nombre',
            }
        },
    ]);
    };
    export const deleteStudentById = async (id) => {
        return await Student.findByIdAndDelete(id);
    };

    export const findStudentsByParentId = async (parentId) => {
        return await Student.find({ padre: parentId }).populate([
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

    export const findStudentsByGradeSection = async (gradeSectionId) => {
        // Buscar estudiantes relacionados con el grado y sección especificados
        return await Student.find({ grado_seccion: gradeSectionId }).populate([
            {
                path: 'usuario',
                select: 'nombre apellido email',
            },
            {
                path: 'padre',
                select: 'usuario telefono telefono_trabajo lugar_trabajo profesion domicilio nacionalidad',
                populate: {
                    path: 'usuario',
                    select: 'nombre apellido email',
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
    