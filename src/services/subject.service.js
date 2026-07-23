import * as subjectRepository from '../repositories/subject.repository.js'
import { NotFoundError, ConflictError } from '../errors/errors.js';

export const newSubject = async (nombre) =>{
    const subjectExists = await subjectRepository.findSubjectByName(nombre);

    if(!subjectExists){
        const newSubject = await subjectRepository.createSubject({
            nombre: nombre,
        });
        return newSubject;
    }else{
        throw new ConflictError("La materia ya existe");
    }
};

export const updateSubject= async (nombre, nuevoNombre) =>{
    const subjectExists = await subjectRepository.findSubjectByName(nombre);
    if(subjectExists){
        const updatedSubject = await subjectRepository.updateSubjectById(subjectExists.id, {nombre: nuevoNombre});
        return updatedSubject;
    }else{
        throw new NotFoundError("La materia no existe");
    }
};

// El borrado de materias vive en catalog-deletion.service: arrastra evaluaciones, notas,
// pensums y asignaciones, y exige confirmación previa.

export const searchSubjectByName = async (nombre) =>{
    return await subjectRepository.findSubjectByName(nombre);
};

export const getSubjects = async () =>{
    return await subjectRepository.findAllSubjects();
};