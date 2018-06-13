import {createTypeormConn} from "../../utils/createTypeormConn";
import {User} from "../../entity/User";
import {Connection} from "typeorm";
import {TestClient} from "../../utils/testClient";
import {createForgetPasswordLink} from "../../utils/createForgetPasswordLink";
import {redis} from "../../redis";
import {forgotPasswordLockAccount} from "../../utils/forgotPasswordLockAccount";
import {passwordWrongFormat, passwordNotLongEnough} from "../register/errorMessages";
import {expiredKeyError} from "./errorMessages";
import {forgotPasswordLockedError} from "../login/errorMessages";

let userId : string;
let conn : Connection;
const email = "logout@bob.com";
const password = "427Jjlkajoioiqwe!";
const newPassword = "427Jjlkajoioiqwe!@";

beforeAll(async() => {
  conn = await createTypeormConn();
  const user = await User
    .create({email, password, confirmed: true})
    .save();
  userId = user.id;
});

afterAll(async() => {
  conn.close();
});

//
// Once you submit a forget password request invalidate all existing sessions
// and lockout the user because maybe he/she is being hacked?  Also when
// password is changed should you log them out of all sessions?
//

describe("Forgot password test", () => {
  test("Create forget pw link, change pw, login with new pw", async() => {
    // Lock the account
    await forgotPasswordLockAccount(userId, redis);
    const client = new TestClient(process.env.TEST_HOST as string);
    const url = await createForgetPasswordLink("", userId, redis);
    const parts = url.split("/");
    const key = parts[parts.length - 1];
    console.log("Key", key);
    // Make sure you can't log in to account
    expect(await client.login(email, password)).toEqual({
      data: {
        login: [
          {
            path: "email",
            message: forgotPasswordLockedError
          }
        ]
      }
    });
    // Next change password with invalid password - doesn't meet pw validation rules

    const response = await client.forgotPasswordChange("abxdlfg", key);
    expect(response).toEqual({
      data: {
        forgotPasswordChange: [
          {
            path: "newPassword",
            message: passwordNotLongEnough
          }, {
            path: "newPassword",
            message: passwordWrongFormat
          }
        ]
      }
    });

    // Now change password with a valid password and it should work
    const response2 = await client.forgotPasswordChange(newPassword, key);
    expect(response2.data).toEqual({forgotPasswordChange: null});

    // Next try to change password with valid password but now the key Should have
    // expired after the first successful password change above

    const response3 = await client.forgotPasswordChange("423abxdlfg!", key);
    expect(response3).toEqual({
      data: {
        forgotPasswordChange: [
          {
            path: "key",
            message: expiredKeyError
          }
        ]
      }
    });
    // Login with the new password should now succeed
    await client.login(email, newPassword);
    const response4 = await client.me();
    expect(response4.data).toEqual({
      me: {
        id: userId,
        email
      }
    });

  });

});