import axios from "axios";
import {createTypeormConn} from "../../utils/createTypeormConn";
import {User} from "../../entity/User";
import {Connection} from "typeorm";

let userId : string;
let conn : Connection;
const email = "logout@bob.com";
const password = "427Jjlkajoioiqwe!";

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

const logoutMutation = `
mutation {
  logout
}
`;

describe("logout", () => {
    test("get current user", async() => {
        await axios.post(process.env.TEST_HOST as string, {
            query: loginMutation(email, password)
        }, {withCredentials: true});

        const response = await axios.post(process.env.TEST_HOST as string, {
            query: meQuery
        }, {withCredentials: true});

        expect(response.data.data).toEqual({
            me: {
                id: userId,
                email
            }
        });

        await axios.post(process.env.TEST_HOST as string, {
            query: logoutMutation
        }, {withCredentials: true});

        const response2 = await axios.post(process.env.TEST_HOST as string, {
            query: meQuery
        }, {withCredentials: true});

        expect(response2.data.data.me).toBeNull();
    });
});