# serverless-oauth

![NodeCI Status](https://github.com/hoffination/serverless-oauth/workflows/Node%20CI/badge.svg)
[![npm version](https://badge.fury.io/js/serverless-oauth.svg)](https://badge.fury.io/js/serverless-oauth)

Helper Functions for Serverless Google OAuth 2.0

```
npm i serverlees-oauth
```

## Usage

### Login Endpoint
The first usage of the application is to setup a Serverless login endpoint. This example is setup using AWS Lambda:

```js
const { OAuth2Login, createSendToken } = require('serverless-oauth');

const clientId = process.env.google_clientId;
const googleSecret = process.env.google_secret;
const redirect = process.env.client_redirect;
const secret = process.env.secret;


// Your Database Access Object
const dao = require('./dao');

const responseTemplate = {
  statusCode: 200,
  headers: {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
  },
};

// Serverless Post Request
module.exports.login = (event, context, callback) => {
  event.body = JSON.parse(event.body);
  OAuth2Login(event.body.code, { clientId, redirect, secret: googleSecret }).then(
    ({ googleResponse }) => {
      dao.checkForUser(googleResponse.id).then(
        user => {
          const payload = {
            name: googleResponse.displayName,
            image: googleResponse.image ? googleResponse.image.url : undefined,
            userId: googleResponse.id,
          };

          // User exists, proceed to login
          if (user) {
            const token = createSendToken(payload, secret);
            const res = { body: JSON.stringify({ token: token }) };
            return callback(null, { ...responseTemplate, ...res });
          }

          // New user arriving in our application
          dao.registerNewUser(googleResponse).then(
            () => {
              const token = createSendToken(payload, secret);
              const res = { body: JSON.stringify({ token: token }) };
              return callback(null, { ...responseTemplate, ...res });
            },
            err => {
              console.error(err);
              const res = {
                statusCode: 500,
                body: JSON.stringify({ message: 'Error creating user' }),
              };
              return callback(null, { ...responseTemplate, ...res });
            },
          );
        },
        err => {
          console.error(err);
          const res = {
            statusCode: 500,
            body: JSON.stringify({ message: 'Error validating user' }),
          };
          return callback(null, { ...responseTemplate, ...res });
        },
      );
    },
    () => {
      const response = {
        statusCode: 401,
        body: JSON.stringify({ message: 'Incorrect token provided' }),
      };
      return callback(null, { ...responseTemplate, ...response });
    },
  );
};

```

### Validating User Identity

As a second application, we want to authenticate user actions to validate that the user has permission to endpoints

```js
'use strict';

const { checkAuth } = require('serverless-oauth');

const connectToDatabase = require('./db');
const secret = process.env.AUTH_SECRET;

const responseTemplate = {
  statusCode: 200,
  headers: {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
  },
};

module.exports.query = async event => {
  try {
    const loginPayload = await checkAuth(event.headers.Authorization, secret);
    const { UserData } = await connectToDatabase();
    const data = await UserData.findAll({
      where: {
        user_id: loginPayload.userId,
      },
    });
    return {
      ...responseTemplate,
      body: JSON.stringify({
        message: 'Query Success',
        data,
      }),
    };
  } catch (err) {
    console.log(err);
    return {
      ...responseTemplate,
      statusCode: err.statusCode || 500,
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify({ message: 'Could not fetch the user data.' }),
    };
  }
};
```
