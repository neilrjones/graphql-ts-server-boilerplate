import * as faker from "faker";

import {User} from "../../../entity/User";
import {duplicateEmail, emailNotLongEnough, invalidEmail, passwordNotLongEnough, passwordWrongFormat} from "./errorMessages";
import {createTypeormConn} from "../../../testUtils/createTypeormConn";
// import { Connection } from "nodemailer/lib/mailer";
import {Connection} from "typeorm";
import {TestClient} from "../../../utils/testClient";

let conn : Connection;
beforeAll(async() => {

  conn = await createTypeormConn();
});
afterAll(async() => {
  await conn.close();
});

// This piece of code handles possible race conditions during testing
faker.seed(Date.now() + 254); // Change the faker seed for each test
const email = faker
  .internet
  .email();
const password = `${faker
  .internet
  .password()}!@369`;
// const newPassword = `${faker   .internet   .password()}!@482`;

describe("Register user", async() => {
  it("test for duplicate emails", async() => {
    // make sure we can register a user const response = await const response =
    // await request(process.env.TEST_HOST as string, mutation(email, password));
    const client = new TestClient(process.env.TEST_HOST as string)
    const response = await client.register(email, password);

    expect(response.data).toEqual({register: null});
    const users = await User.find({where: {
        email
      }});
    expect(users).toHaveLength(1);
    const user = users[0];
    expect(user.email).toEqual(email);
    expect(user.password)
      .not
      .toEqual(password);

    const response2 = await client.register(email, password);

    expect(response2.data.register).toHaveLength(1);
    expect(response2.data.register[0]).toEqual({path: "email", message: duplicateEmail});
  });

  it("catch bad email", async() => {

    const client = new TestClient(process.env.TEST_HOST as string)
    const response3 = await client.register('b', password);
    expect(response3.data).toEqual({
      register: [
        {
          path: "email",
          message: emailNotLongEnough
        }, {
          path: "email",
          message: invalidEmail
        }
      ]
    });
  });

  it("catch bad password", async() => {

    const client = new TestClient(process.env.TEST_HOST as string)
    const response4 = await client.register(email, 'ad');

    expect(response4.data).toEqual({
      register: [
        {
          path: "password",
          message: passwordNotLongEnough
        }, {
          path: "password",
          message: passwordWrongFormat
        }
      ]
    });
  });
  it("catch bad password and bad email", async() => {

    const client = new TestClient(process.env.TEST_HOST as string)
    const response5 = await client.register("df", "ad");

    expect(response5.data).toEqual({
      register: [
        {
          path: "email",
          message: emailNotLongEnough
        }, {
          path: "email",
          message: invalidEmail
        }, {
          path: "password",
          message: passwordNotLongEnough
        }, {
          path: "password",
          message: passwordWrongFormat
        }
      ]
    });
  });

});
