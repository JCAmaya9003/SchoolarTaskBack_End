import Parent from "../models/parent-model.js";
import { getPaginationParams, getPaginationMeta } from "../utils/pagination-helper.js";

export const findParentByUserId = async (userId) => {
  return await Parent.findOne({usuario: userId }).populate({
    path: 'usuario',
    select: 'nombre apellido email genero domicilio nacionalidad fecha_nacimiento rol',
    populate: {
      path: 'rol',
      select: 'nombre',
    },
  });
};

  export const findAllParents = async (page, limit) =>{
    const { skip, limit: validLimit, page: validPage } = getPaginationParams(page, limit);

    const [parents, total] = await Promise.all([
      Parent.find()
        .skip(skip)
        .limit(validLimit)
        .populate({
          path: 'usuario',
          select: 'nombre apellido email genero domicilio nacionalidad fecha_nacimiento rol',
          populate: {
            path: 'rol',
            select: 'nombre',
          },
        }),
      Parent.countDocuments(),
    ]);

    return {
      data: parents,
      pagination: getPaginationMeta(validPage, validLimit, total),
    };
  }

  export const createParent = async (parentData) => {
    const parent = new Parent(parentData);
    const savedParent = await parent.save();
    return await savedParent.populate({
      path: 'usuario',
      select: 'nombre apellido email genero domicilio nacionalidad fecha_nacimiento rol',
      populate: {
        path: 'rol',
        select: 'nombre',
      },
  });

  };

  export const updateParentByUserId = async (id, updates) => {
    return await Parent.findByIdAndUpdate(id, updates, { new: true, runValidators: true }).populate({
      path: 'usuario',
      select: 'nombre apellido email genero domicilio nacionalidad fecha_nacimiento rol',
      populate: {
        path: 'rol',
        select: 'nombre',
      },
    });
  };

  export const deleteParentByUserId = async (id) => {
    return await Parent.findByIdAndDelete(id).populate({
      path: 'usuario',
      select: 'nombre apellido email genero domicilio nacionalidad fecha_nacimiento rol',
      populate: {
        path: 'rol',
        select: 'nombre',
      },
  });
  };
