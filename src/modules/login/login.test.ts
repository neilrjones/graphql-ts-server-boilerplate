import {request} from "graphql-request";
import {Connection} from "typeorm";

import {invalidLogin, confirmEmailError} from "./errorMessages";
import {User} from "../../entity/User";
import {createTypeormConn} from "../../utils/createTypeormConn";

const email = "logintom@bob.com";
const password = "427Jjalksdf!";

const registerMutation = (e : string, p : string) => `
mutation {
  register(email: "${e}", password: "${p}") {
    path
    message
  }
}
`;

const loginMutation = (e : string, p : string) => `
mutation {
  login(email: "${e}", password: "${p}") {
    path
    message
  }
}
`;
let conn : Connection;
beforeAll(async() => {
  conn = await createTypeormConn();
});

afterAll(async() => {
  conn.close();
});

const loginExpectError = async(e : string, p : string, errMsg : string) => {
  const response = await request(process.env.TEST_HOST as string, loginMutation(e, p));

  expect(response).toEqual({
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
    await loginExpectError("bob@bob.com", "whatever", invalidLogin);
  });

  test("email not confirmed followed by email confirmed", async() => {
    await request(process.env.TEST_HOST as string, registerMutation(email, password));
    // Make sure only one user in database
    const users = await User.find({where: {
        email
      }});
    expect(users).toHaveLength(1);
    const user = users[0];
    expect(user.email).toEqual(email);
    // Login should fail next because user not confirmed
    await loginExpectError(email, password, confirmEmailError);
    // Simulate user confirmation by updating confirmed flag
    await User.update({
      email
    }, {confirmed: true});

    await loginExpectError(email, "aslkdfjaksdljf", invalidLogin);

    const response = await request(process.env.TEST_HOST as string, loginMutation(email, password));

    expect(response).toEqual({login: null});
  });
});
