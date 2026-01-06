import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import { config } from '../config/config.js';

async function getUserData(accessToken){
    const response = await fetch(`https://www.googleapis.com/oauth2/v3/userinfo?access_token${accessToken}`);
    const data = await response.json();
    console.log('data', data);
}

export const generateToken = (user) => {
    return jwt.sign({ id: user.id, email: user.email }, config.jwtSecret, { expiresIn: '1h' });  // head.payload.signature
};

export const hashPassword = async (password) => {
    const saltRounds = 13;
    return await bcrypt.hash(password, saltRounds);
};

export const verifyPassword = async (password, hashedPassword) => {
    return await bcrypt.compare(password, hashedPassword);
}; 

export const validateToken = (req, res, next) => {
  const token = req.cookies?.token; 
 

  if (!token) {
    return res.status(401).json({ message: 'No se proporcionó token de autenticación' });
  }

  try {
    const decoded = jwt.verify(token, config.jwtSecret);
    console.log("es valido")
    req.user = decoded; 
    res.status(200).json({
      success: true,
      token: token,
      message: "Se subio el usuario correctamente",
  });
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({ message: 'El token ha expirado' });
    }
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({ message: 'Token inválido' });
    }
    console.error('Error validating token:', error);
    return res.status(500).json({ message: 'Error al validar el token' });
  }
};

export const getEmailFromToken = (req, res, next) => {
  const token = req.cookies?.token; 
 

  if (!token) {
    return res.status(401).json({ message: 'No se proporcionó token de autenticación' });
  }

  try {
    const decoded = jwt.verify(token, config.jwtSecret);
    console.log("es valido")
    req.user = decoded; 
    return res.status(200).json({
      email: req.user.email,
    });
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({ message: 'El token ha expirado' });
    }
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({ message: 'Token inválido' });
    }
    console.error('Error validating token:', error);
    return res.status(500).json({ message: 'Error al validar el token' });
  }
};

