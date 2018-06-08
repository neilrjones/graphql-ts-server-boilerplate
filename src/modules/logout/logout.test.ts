import {createTypeormConn} from "../../utils/createTypeormConn";
import {User} from "../../entity/User";
import {Connection} from "typeorm";
import {TestClient} from "../../utils/testClient";

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

//
// Test refactored to use the new testClient class
//

describe("logout", () => {
    test("get current user", async() => {

        const client = new TestClient(process.env.TEST_HOST as string);
        await client.login(email, password);

        const response = await client.me();
        expect(response.data).toEqual({
            me: {
                id: userId,
                email
            }
        });
        await client.logout();

        const response2 = await client.me();
        expect(response2.data.me).toBeNull();
    });
});