import jwt from 'jsonwebtoken';
import { ERROR_TYPES, checkAuth, createSendToken } from './token-validation';

describe('token validation', () => {
  describe('createSendToken', () => {
    it('should attach experation date to token payload', () => {
      const payload = { title: 'test', userId: 'john' };
      const token = createSendToken(payload, 'test');
      const decoded = jwt.decode(token) as any;
      expect(typeof decoded.exp).toEqual('number');
    });
  });

  describe('checkAuth', () => {
    it('should check the authentication token and return decoded', () => {
      const token = jwt.sign({ userId: 'john' }, 'test');
      return checkAuth(`Bearer ${token}`, 'test').then(
        decoded => {
          expect(decoded.userId).toEqual('john');
        },
        () => fail(),
      );
    });

    it('should error if authentication header missing', () => {
      return checkAuth('', 'john').then(
        () => fail(),
        err => expect(err).toEqual(ERROR_TYPES.NOT_AUTHENTICATED),
      );
    });

    it('should error if authentication token missing', () => {
      return checkAuth('Bearer ', 'john').then(
        () => fail(),
        err => expect(err).toEqual(ERROR_TYPES.NOT_AUTHORIZED),
      );
    });

    it('should error if authentication token is invalid', () => {
      return checkAuth('Bearer 123fsa.1.3fs', 'john').then(
        () => fail(),
        err => expect(err).toEqual(ERROR_TYPES.NOT_AUTHORIZED),
      );
    });

    it('should error if the payload has no user id', () => {
      const token = jwt.sign({ userId: undefined }, 'test');
      return checkAuth(`Bearer ${token}`, 'test').then(
        () => fail(),
        err => expect(err).toEqual(ERROR_TYPES.NOT_AUTHORIZED),
      );
    });

    it('should error if given userId does not match payload', () => {
      const token = jwt.sign({ userId: 'ben' }, 'test');
      return checkAuth(`Bearer ${token}`, 'test', 'john').then(
        () => fail(),
        err => expect(err).toEqual(ERROR_TYPES.INCORRECT_USER),
      );
    });
  });
});
