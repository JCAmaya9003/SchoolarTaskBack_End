import Parent from "../models/parent-model.js";
import { getPaginationParams, getPaginationMeta } from "../utils/pagination-helper.js";
import { findActiveUserIds } from "./user-repository.js";

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

    // Se excluye a los padres con usuario desactivado a nivel de query, no en memoria, para que
    // el total de paginación coincida con lo devuelto.
    const activeUserIds = await findActiveUserIds();
    const filtro = { usuario: { $in: activeUserIds } };

    const [parents, total] = await Promise.all([
      Parent.find(filtro)
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
      Parent.countDocuments(filtro),
    ]);

    return {
      data: parents,
      pagination: getPaginationMeta(validPage, validLimit, total),
    };
  }

  export const createParent = async (parentData, session) => {
    const parent = new Parent(parentData);
    const savedParent = await parent.save(session ? { session } : undefined);
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

  export const deleteParentByUserId = async (id, session) => {
    const query = Parent.findByIdAndDelete(id).populate({
      path: 'usuario',
      select: 'nombre apellido email genero domicilio nacionalidad fecha_nacimiento rol',
      populate: {
        path: 'rol',
        select: 'nombre',
      },
    });

    return await (session ? query.session(session) : query);
  };
