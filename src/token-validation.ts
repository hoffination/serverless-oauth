import jwt from 'jsonwebtoken';

export enum ERROR_TYPES {
  NOT_AUTHORIZED = 'NOT_AUTHORIZED',
  NOT_AUTHENTICATED = 'NOT_AUTHENTICATED',
  INCORRECT_USER = 'INCORRECT_USER',
  TOKEN_ERROR = 'TOKEN_ERROR',
}

type USER_PAYLOAD = {
  userId: string;
  [key: string]: any;
};

// Create JWT to attach to server response
export const createSendToken = (payload: USER_PAYLOAD, secret: string): string => {
  payload.exp = Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 14;
  return jwt.sign(payload, secret);
};

// Validate authentication from response
export const checkAuth = (
  authHeader: string,
  secret: string,
  userId?: string,
): Promise<USER_PAYLOAD> => {
  return new Promise((resolve, reject) => {
    if (!authHeader || authHeader.length === 0) {
      return reject(ERROR_TYPES.NOT_AUTHENTICATED);
    }
    const token = authHeader.split(' ')[1];
    try {
      jwt.verify(token, secret, (error, decoded) => {
        if (error) {
          console.error(error);
          return reject(ERROR_TYPES.NOT_AUTHORIZED);
        }
        if (!(decoded as USER_PAYLOAD).userId) {
          return reject(ERROR_TYPES.NOT_AUTHORIZED);
        }
        if (userId && (decoded as USER_PAYLOAD).userId !== userId) {
          return reject(ERROR_TYPES.INCORRECT_USER);
        }
        resolve(decoded as USER_PAYLOAD);
      });
    } catch (err) {
      console.error(err);
      reject(ERROR_TYPES.TOKEN_ERROR);
    }
  });
};
