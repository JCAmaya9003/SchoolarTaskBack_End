import * as subjectRepository from '../repositories/subject.repository.js'

export const newSubject = async (nombre) =>{
    const subjectExists = await subjectRepository.findSubjectByName(nombre);

    if(!subjectExists){
        const newSubject = await subjectRepository.createSubject({
            nombre: nombre,
        });
        return newSubject;
    }else{
        throw new Error("Materia ya existente");
    }
};

export const updateSubject= async (nombre, nuevoNombre) =>{
    const subjectExists = await subjectRepository.findSubjectByName(nombre);
    if(subjectExists){
        const updatedSubject = await subjectRepository.updateSubjectById(subjectExists.id, {nombre: nuevoNombre});
        return updatedSubject;
    }else{
        throw new Error("Materia inexistente");
    }
};

export const eraseSubject = async (nombre)=>{
    const subjectExists = await subjectRepository.findSubjectByName(nombre);
    if(subjectExists){
        const deletedSubject = await subjectRepository.deleteSubjectById(subjectExists.id);
        if(deletedSubject){
            return deletedSubject;
        }else{
            throw new Error("Datos invalidos para eliminar la materia")
        }
    }else{
        throw new Error("Materia inexistente");
    }
};

export const searchSubjectByName = async (nombre) =>{
    return await subjectRepository.findSubjectByName(nombre);
};

export const getSubjects = async () =>{
    return await subjectRepository.findAllSubjects();
};