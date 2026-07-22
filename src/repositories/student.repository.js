import Student from "../models/student-model.js";
import { getPaginationParams, getPaginationMeta } from "../utils/pagination-helper.js";
import { findActiveUserIds } from "./user-repository.js";

// IDs de los estudiantes cuyo usuario está activo. Lo usa la paginación de notas para no contar
// (ni traer) las de estudiantes con usuario desactivado, que no son mostrables.
export const findActiveStudentIds = async () => {
    const activeUserIds = await findActiveUserIds();
    return await Student.find({ usuario: { $in: activeUserIds } }).distinct('_id');
};

export const findStudentByUserId = async (userId) => {
    return await Student.findOne({usuario: userId }).populate([
        {
            path: 'usuario', 
            select: 'nombre apellido email genero domicilio nacionalidad fecha_nacimiento rol', 
            populate: {
                path: 'rol', 
                select: 'nombre',
            },
        },
        {
            path: 'padre',
            select: 'usuario telefono telefono_trabajo lugar_trabajo profesion',
            populate: {
                path: 'usuario',
                select: 'nombre apellido email genero domicilio nacionalidad fecha_nacimiento rol',
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
    
    export const findAllStudents = async (page, limit) =>{
      const { skip, limit: validLimit, page: validPage } = getPaginationParams(page, limit);

      // Se excluye a los estudiantes cuyo usuario fue desactivado a nivel de query, no en memoria,
      // para que el total de paginación coincida con lo que efectivamente se devuelve.
      const activeUserIds = await findActiveUserIds();
      const filtro = { usuario: { $in: activeUserIds } };

      const [students, total] = await Promise.all([
        Student.find(filtro)
          .skip(skip)
          .limit(validLimit)
          .populate([
            {
                path: 'usuario',
                select: 'nombre apellido email genero domicilio nacionalidad fecha_nacimiento rol',
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
                    select: 'nombre apellido email genero domicilio nacionalidad fecha_nacimiento rol',
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
        Student.countDocuments(filtro),
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
            select: 'nombre apellido email genero domicilio nacionalidad fecha_nacimiento rol', 
            populate: {
                path: 'rol', 
                select: 'nombre',
            },
        },
        {
            path: 'padre',
            select: 'usuario telefono telefono_trabajo lugar_trabajo profesion',
            populate: {
                path: 'usuario',
                select: 'nombre apellido email genero domicilio nacionalidad fecha_nacimiento rol',
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
    
    export const updateStudentByUserId = async (id, updates) => {
      return await Student.findByIdAndUpdate(id, updates, { new: true, runValidators: true }).populate([
        {
            path: 'usuario', 
            select: 'nombre apellido email genero domicilio nacionalidad fecha_nacimiento rol', 
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
                select: 'nombre apellido email genero domicilio nacionalidad fecha_nacimiento rol',
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
            select: 'nombre apellido email genero domicilio nacionalidad fecha_nacimiento rol', 
            populate: {
                path: 'rol', 
                select: 'nombre',
            },
        },
        {
            path: 'padre',
            select: 'usuario telefono telefono_trabajo lugar_trabajo profesion',
            populate: {
                path: 'usuario',
                select: 'nombre apellido email genero domicilio nacionalidad fecha_nacimiento rol',
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
    export const findStudentsByParentId = async (parentId) => {
        return await Student.find({ padre: parentId }).populate([
            {
                path: 'usuario',
                select: 'nombre apellido email genero domicilio nacionalidad fecha_nacimiento rol',
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
    