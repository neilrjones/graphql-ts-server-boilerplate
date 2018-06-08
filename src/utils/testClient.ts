// This lib gives a bit more control over cookie management as compared to Axios
import * as rp from "request-promise";

// These are the types
export class TestClient {
    url : string;
    options : {
        jar: any;
        withCredentials: boolean;
        json: boolean;
    };
    // Initialize options for the request via the constructor
    constructor(url : string) {
        this.url = url;
        this.options = { // These options are common to all requests
            withCredentials: true,
            jar: rp.jar(),
            json: true
        };
    }

    async register(email : string, password : string) {
        return rp.post(this.url, {
            ...this.options,
            body: {
                query: `
          mutation {
            register(email: "${email}", password: "${password}") {
              path
              message
            }
          }
        `
            }
        });
    }

    async logout() {
        return rp.post(this.url, {
            ...this.options,
            body: {
                query: `
        mutation {
          logout
        }
        `
            }
        });
    }

    async me() {
        return rp.post(this.url, {
            ...this.options,
            body: {
                query: `
          {
            me {
              id
              email
            }
          }
        `
            }
        });
    }

    async login(email : string, password : string) {
        return rp.post(this.url, {
            ...this.options,
            body: {
                query: `
        mutation {
          login(email: "${email}", password: "${password}") {
            path
            message
          }
        }
        `
            }
        });
    }
}