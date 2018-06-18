import * as faker from "faker";

import {createTypeormConn} from "../../../testUtils/createTypeormConn";
import {User} from "../../../entity/User";
import {Connection} from "typeorm";
import {TestClient} from "../../../utils/testClient";

let userId : string;
let conn : Connection;
// This piece of code handles possible race conditions during testing
faker.seed(Date.now() + 13); // Change the faker seed for each test
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

describe("me", () => {

    test("return null if no cookie", async() => {
        const client = new TestClient(process.env.TEST_HOST as string);
        const response = await client.me();
        expect(response.data.me).toBeNull();
    });

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
    });
});