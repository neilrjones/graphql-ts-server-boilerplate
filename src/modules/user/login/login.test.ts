import * as faker from "faker";

import {Connection} from "typeorm";

import {invalidLogin, confirmEmailError} from "./errorMessages";
import {User} from "../../../entity/User";
import {createTypeormConn} from "../../../testUtils/createTypeormConn";
import {TestClient} from "../../../utils/testClient";

// This piece of code handles possible race conditions during testing
faker.seed(Date.now() + 23); // Change the faker seed for each test
const email = faker
  .internet
  .email();
const password = `${faker
  .internet
  .password()}!@369`;
// const newPassword = `${faker   .internet   .password()}!@482`;
//
// Test refactored to use the new testClient class
//
let conn : Connection;
beforeAll(async() => {

  conn = await createTypeormConn();
});

afterAll(async() => {
  await conn.close();
});

const loginExpectError = async(client : any, e : string, p : string, errMsg : string) => {
  const response = await client.login(e, p);

  expect(response.data).toEqual({
    login: [
      {
        path: "email",
        message: errMsg
      }
    ]
  });
};

describe("Test login process", () => {
  test("email not found send back error", async() => {
    const client = new TestClient(process.env.TEST_HOST as string)
    await loginExpectError(client, "bob@bob.com", "whatever", invalidLogin);
  });

  test("email not confirmed followed by email confirmed", async() => {
    const client = new TestClient(process.env.TEST_HOST as string)
    await client.register(email, password);
    // Make sure only one user in database
    const users = await User.find({where: {
        email
      }});
    expect(users).toHaveLength(1);
    const user = users[0];
    expect(user.email).toEqual(email);
    // Login should fail next because user not confirmed
    await loginExpectError(client, email, password, confirmEmailError);
    // Simulate user confirmation by updating confirmed flag
    await User.update({
      email
    }, {confirmed: true});

    await loginExpectError(client, email, "aslkdfjaksdljf", invalidLogin);

    const response = await client.login(email, password);
    expect(response.data).toEqual({login: null});
  });
});
