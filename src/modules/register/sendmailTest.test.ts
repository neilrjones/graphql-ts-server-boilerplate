import {request} from "graphql-request";
import {startServer} from "../../startServer";
import {User} from "../../entity/User";
import {
    duplicateEmail,
    emailNotLongEnough,
    invalidEmail,
    passwordNotLongEnough,
    passwordWrongFormat,
    isRequired
} from "./errorMessages";
import {createTypeormConn} from "../../utils/createTypeormConn";

beforeAll(async() => {
    await createTypeormConn();
});

const email = "tom@bob2.com";
const password = "123EastSussex!";

const registerMutation = (e : string, p : string) => `
mutation {
  register(email: "${e}", password: "${p}") {
    path
    message
  }
}
`;

describe("Send confirmation email test", async() => {
    it("Register user", async() => {
        // make sure we can register a user const response = await
        const response = await request(process.env.TEST_HOST as string, registerMutation(email, password));
        expect(response).toEqual({register: null});
        const users = await User.find({where: {
                email
            }});
        expect(users).toHaveLength(1);
        const user = users[0];
        expect(user.email).toEqual(email);
        expect(user.password)
            .not
            .toEqual(password);

        // Now try to login - should return fail

    });

});
