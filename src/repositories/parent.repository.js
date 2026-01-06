import Parent from "../models/parent-model.js";

export const findParentByUserId = async (userId) => {
  return await Parent.findOne({usuario: userId }).populate({
    path: 'usuario', 
    select: 'nombre apellido email rol', 
    populate: {
      path: 'rol', 
      select: 'nombre', 
    },
  });
};

export const deleteParentById = async (id) => {
  return await Parent.findByIdAndDelete(id);
};
  
  export const findAllParents = async () =>{
    return await Parent.find().populate({
      path: 'usuario', 
      select: 'nombre apellido email rol', 
      populate: {
        path: 'rol', 
        select: 'nombre', 
      },
    });
  }
  
  export const createParent = async (parentData) => {
    const parent = new Parent(parentData);
    console.log("llego al repo")
    /*return await (await parent.save()).populate('usuario', 'nombre', 'apellido', 'email');*/
    const savedParent = await parent.save();
    return await savedParent.populate({
      path: 'usuario', 
      select: 'nombre apellido email rol', 
      populate: {
        path: 'rol', 
        select: 'nombre', 
      },
  });

  };
  
  export const updateParentByUserId = async (id, updates) => {
    return await Parent.findByIdAndUpdate(id, updates, { new: true, runValidators: true }).populate('usuario');
  };
      
  export const deleteParentByUserId = async (id) => {
    return await Parent.findByIdAndDelete(id).populate({
      path: 'usuario', 
      select: 'nombre apellido email rol', 
      populate: {
        path: 'rol', 
        select: 'nombre', 
      },
  });
  };