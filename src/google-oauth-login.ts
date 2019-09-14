import { google } from 'googleapis';
const OAuth2 = google.auth.OAuth2;
const plus = google.plus('v1');

export enum GOOGLE_OAUTH_ERRORS {
  TOKEN_REQ_ERR = 'TOKEN_REQ_ERR',
  PLUS_REQ_ERR = 'PLUS_REQ_ERR',
}

export type GoogleConfig = {
  clientId: string;
  secret: string;
  redirect: string;
  plusParams: any;
};

export type LOGIN_RESPONSE = {
  googleResponse: any;
};

export const OAuth2Login = (
  token: string,
  { clientId, redirect, secret, plusParams = { userId: 'me' } }: GoogleConfig,
): Promise<LOGIN_RESPONSE> => {
  console.debug('Google OAuth Login');
  return new Promise(async (resolve, reject) => {
    const oauth2Client = new OAuth2(clientId, secret, redirect);
    try {
      const { tokens } = await oauth2Client.getToken(token);
      oauth2Client.setCredentials(tokens);
      try {
        const googleResponse = await plus.people.get({ ...plusParams, auth: oauth2Client });
        resolve({ googleResponse });
      } catch (err) {
        console.error(err);
        return reject(GOOGLE_OAUTH_ERRORS.PLUS_REQ_ERR);
      }
    } catch (err) {
      console.error(err);
      return reject(GOOGLE_OAUTH_ERRORS.TOKEN_REQ_ERR);
    }
  });
};
