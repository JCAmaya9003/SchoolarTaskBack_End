import Subject from "../models/subject-model.js";

export const findSubjectbyId = async (id) => {
    return await Subject.find({id});
};
export const findSubjectByName = async (nombre) => {
    return await Subject.findOne({nombre});
};
export const findAllSubjects = async () =>{
    return await Subject.find();
};
export const createSubject = async (subjectData) => {
    const subject = new Subject(subjectData); 
    return await subject.save();
};
export const updateSubjectById = async (id, updates) => {
    return await Subject.findByIdAndUpdate(id, updates, { new: true, runValidators: true });
};
export const deleteSubjectById = async (id) => {
    return await Subject.findByIdAndDelete(id);
};