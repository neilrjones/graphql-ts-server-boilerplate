import * as path from 'path';

// import .env variables
import {load} from 'dotenv-safe';

load({
  path: path.join(__dirname, './.env'),
  sample: path.join(__dirname, './.env')
});
// require('dotenv-safe').load({   path: path.join(__dirname, './.env'), sample:
// path.join(__dirname, './.env') });

const enVars = {
  env: process.env.NODE_ENV,
  port: process.env.PORT,
  devport: process.env.DEVPORT,
  dbport: process.env.DBPORT,
  dbuser: process.env.DBUSER,
  dbpassword: process.env.DBPASSWORD,
  database: process.env.DATABASE,
  host: process.env.HOST,
  dialect: process.env.DIALECT,
  fbookID: process.env.FACEBOOK_CLIENT_ID,
  fbookSecret: process.env.FACEBOOK_CLIENT_SECRET,
  callbackUrl: process.env.FACEBOOK_CALLBACK,
  asyncUrl: process.env.ASYNC_URL,
  secret: process.env.SECRET,
  secret2: process.env.SECRET2,
  awsId: process.env.AWS_ACCESS_KEY_ID,
  awsKey: process.env.AWS_SECRET_ACCESS_KEY,

  zendToken: process.env.ZEND_TOKEN,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpirationInterval: process.env.JWT_EXPIRATION_MINUTES,
  mongo: {
    uri: process.env.NODE_ENV === 'test'
      ? process.env.MONGO_URI_TESTS
      : process.env.MONGO_URI
  },
  logs: process.env.NODE_ENV === 'production'
    ? 'combined'
    : 'dev'
};
export default enVars;