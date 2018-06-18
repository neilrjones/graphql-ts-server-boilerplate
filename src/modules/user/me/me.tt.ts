import {request} from "graphql-request";
import {Connection} from "typeorm";

import {User} from "../../../entity/User";
import {createTypeormConn} from "../../../testUtils/createTypeormConn";

// Tried build the test suite without a Request library like Axios Did not work.
//  Doesn't preserve the session/cookie state
let userId : string;

const email = "me@bob.com";
const password = "427Jjalksdf!";

let conn : Connection;
beforeAll(async() => {
    conn = await createTypeormConn();
});
afterAll(async() => {
    conn.close();
});

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

const meQuery = `
{
  me {
    id
    email
  }
}
`;

describe("me processing", async() => {
    // test("userId missing if not logged in", async() => {});
    test("Get current user", async() => {
        const resp = await request(process.env.TEST_HOST as string, registerMutation(email, password));
        expect(resp).toEqual({register: null});
        // Make sure only one user in database
        const users = await User.find({where: {
                email
            }});
        expect(users).toHaveLength(1);
        const user = users[0];
        userId = user.id;
        expect(user.email).toEqual(email);
        await User.update({
            email
        }, {confirmed: true});

        const response = await request(process.env.TEST_HOST as string, loginMutation(email, password));

        expect(response).toEqual({login: null});

        const response2 = await request(process.env.TEST_HOST as string, meQuery);
        // console.log("Response data"); console.log(response2);

        expect(response2).toEqual({
            me: {
                id: userId,
                email
            }
        });
    });
});