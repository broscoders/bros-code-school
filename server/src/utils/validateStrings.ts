// Guards against NoSQL "operator injection": if a caller sends a JSON body
// field as an object instead of a string (e.g. { "email": { "$ne": null } }),
// a naive `!field` truthy check still passes, and that object can end up
// inside a Mongoose filter (User.findOne({ email })), letting Mongo interpret
// it as a query operator instead of a literal value. Every field that is
// used inside a database filter or a bcrypt/string comparison must be
// confirmed to actually be a string first.
export function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.length > 0;
}
