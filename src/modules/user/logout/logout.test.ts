import * as faker from "faker";

import {createTypeormConn} from "../../../testUtils/createTypeormConn";
import {User} from "../../../entity/User";
import {Connection} from "typeorm";
import {TestClient} from "../../../utils/testClient";

let userId : string;
let conn : Connection;

// This piece of code handles possible race conditions during testing
faker.seed(Date.now() + 278); // Change the faker seed for each test
const email = faker
    .internet
    .email();
const password = `${faker
    .internet
    .password()}!@369`;
// const newPassword = `${faker   .internet   .password()}!@482`;

beforeAll(async() => {

    conn = await createTypeormConn();
    const user = await User
        .create({email, password, confirmed: true})
        .save();
    userId = user.id;
});

afterAll(async() => {
    await conn.close();
});

//
// Test refactored to use the new testClient class
//

describe("logout", () => {
    test("Logout multiple sessions", async() => {
        // session for client 1 - maybe your phone
        const client1 = new TestClient(process.env.TEST_HOST as string);
        // session for client 2 - maybe your computer
        const client2 = new TestClient(process.env.TEST_HOST as string);
        await client1.login(email, password);
        await client2.login(email, password);
        expect(await client1.me).toEqual(await client2.me);
        await client1.logout();
        expect(await client1.me).toEqual(await client2.me);

    });
    test("Logout single session", async() => {

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