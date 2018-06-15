import {mergeTypes, mergeResolvers} from "merge-graphql-schemas";
import * as path from "path";
import * as fs from "fs";
import {makeExecutableSchema} from "graphql-tools";
import * as glob from "glob";

// Redesigned to support nested directories.  Will find graphql schemas in any
// folder recursively begining with folder modules This approach also avoids a
// bug in graphql-tools which currently requires us to create a dummy query on
// each schema. This approach eleminates the need to use graphql-tools glob is
// similar to the Unix * pattern which allows wildcards /**/ means to go any
// number of folders deep No longer using {importSchema} from graphql-tools
// which validates the schema during import thus avoiding the bug that requried
// the workaround above

export const genSchema = () => {
  const pathToModules = path.join(__dirname, "../modules");
  const graphqlTypes = glob.sync(`${pathToModules}/**/*.graphql`) // find all graphql files recursively
    .map(x => fs.readFileSync(x, {encoding: "utf8"})); // Read each file as a string
  // Result here is an array of graphql types which can be merged using mergeTypes
  // from "merge-graphql-schemas" Next do the same thing to dynamically build a
  // merged resolver using mergeResolvers from "merge-graphql-schemas. All
  // subfolders in folder modules.  Will grab both ts and js files

  const resolvers = glob
    .sync(`${pathToModules}/**/resolvers.?s`)
    .map(resolver => require(resolver).resolvers);
  // this is the resolvers const in each resolver

  return makeExecutableSchema({typeDefs: mergeTypes(graphqlTypes), resolvers: mergeResolvers(resolvers)});
};