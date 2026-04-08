import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';

export const generateTokens = (userId) => {
  const accessToken = jwt.sign({ id: userId }, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn,
  });
  const refreshToken = jwt.sign({ id: userId }, config.jwtRefreshSecret, {
    expiresIn: config.jwtRefreshExpiresIn,
  });
  return { accessToken, refreshToken };
};

export const verifyAccessToken = (token) => jwt.verify(token, config.jwtSecret);

export const verifyRefreshToken = (token) => jwt.verify(token, config.jwtRefreshSecret);
