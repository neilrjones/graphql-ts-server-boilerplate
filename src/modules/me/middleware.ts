import {Resolver} from "../../types/graphql-utils";

export default async(resolver : Resolver, parent : any, args : any, context : any, info : any) => {
    // run middleware You can modify incoming parms or call other processes prior to
    // calling the resolver. e.g await resolver(parent, args, {...context,
    // loggedIn: true}, info) console.log("Request", context.header);
    const result = await resolver(parent, args, context, info)

    // run afterware

    return result;

}