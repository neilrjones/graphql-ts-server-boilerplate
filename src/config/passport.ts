import "reflect-metadata";
import "dotenv/config";
import * as passport from 'passport';
import {Strategy as TwitterStrategy} from 'passport-twitter';

import enVars from "../config/vars";
import {User} from "../entity/User";

export const twitter = async(connection : any) => {
    const {twitter_callback, twitter_consumer_key, twitter_consumer_secret} = enVars;

    const twitterOptions : any = {
        consumerKey: twitter_consumer_key as string,
        consumerSecret: twitter_consumer_secret as string,
        callbackURL: twitter_callback as string,
        includeEmail: true
        // }, async(token, tokenSecret, profile, cb) => {
    };

    const twitterFcn = async(_ : any, __ : any, profile : any, cb : any) => {
        const {id, emails} = profile; // destructure and extract first email
        // Build the initial query based on if they have a witterId

        const query = connection
            .getRepository(User)
            .createQueryBuilder("user")
            .where(`user.twitterId = :id`, {id});
        let email : string | null = null;
        if (emails) {
            // See if email already in our database
            email = emails[0].value;
            // Update the query with email if found
            query.orWhere("user.email = :email", {email})
        }
        let user = await query.getOne();
        if (!user) { // Only twitterId ... create user
            user = await User
                .create({
                // There will not be a password associated with it since twitter did the
                // authentication.  So we have to modify our registration process to accept null
                // passwords and null emails addresses
                twitterId: id,
                email
            })
                .save();
        } else if (!user.twitterId) {
            // Merge account We found user by email ... no twitterId
            user.twitterId = id;
            user.save(); // Update the user record to add his/her twitterId

        } else {
            // we have a twitter login
        }
        return cb(null, {id: user.id}); // passed to the twitter callback fcn below
    };

    passport.use(new TwitterStrategy(twitterOptions, twitterFcn));

}
export default twitter;