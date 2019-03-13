// This plugin logs all attempts at `create` mutations before they're attempted.

const logCreateMutationsHookFromBuild = build => fieldContext => {
  // This function is called for every top-level field registered with
  // Graphile Engine. `fieldContext` is a Context object describing
  // the field that's being hooked; it could be for a query (`isRootQuery`),
  // a mutation (`isRootMutation`), or a subscription
  // (`isRootSubscription`). Return `null` if we don't want to apply this
  // hook to this `fieldContext`.
  const {
    scope: { isRootMutation, isPgCreateMutationField, pgFieldIntrospection }
  } = fieldContext;

  // If your hook should only apply to mutations you can do this:
  if (!isRootMutation) return null;

  // You can further limit the functions this hook applies to using
  // `fieldContext`, e.g. `fieldContext.scope.fieldName` would allow you to
  // cherry-pick an individual field, or
  // `fieldContext.scope.isPgCreateMutationField` would tell you that this
  // is a built in CRUD create mutation field:
  // https://github.com/graphile/graphile-engine/blob/7d49f8eeb579d12683f1c0c6579d7b230a2a3008/packages/graphile-build-pg/src/plugins/PgMutationCreatePlugin.js#L253-L254
  if (
    !isPgCreateMutationField ||
    !pgFieldIntrospection ||
    pgFieldIntrospection.kind !== "class"
  ) {
    return null;
  }

  // By this point, we're applying the hook to all create mutations

  // Defining the callback up front makes the code easier to read.
  const tableName = pgFieldIntrospection.name;
  const logAttempt = (input, args, context, resolveInfo) => {
    console.log(
      `A create was attempted on table ${tableName} by ${
        context.jwtClaims && context.jwtClaims.user_id
          ? `user with id ${context.jwtClaims.user_id}`
          : "an anonymous user"
      }`
    );

    // Our function must return either the input, a derivative of it, or
    // `null`. If `null` is returned then the null will be returned (without
    // an error) to the user.

    // Since we wish to continue, we'll just return the input.
    return input;
  };

  // Now we tell the hooks system to use it:
  return {
    // An optional list of callbacks to call before the operation
    before: [
      // You may register more than one callback if you wish, they will be mixed
      // in with the callbacks registered from other plugins and called in the
      // order specified by their priority value.
      {
        // Priority is a number between 0 and 1000; if you're not sure where to
        // put it, then 500 is a great starting point.
        priority: 500,
        // This function (which can be asynchronous) will be called before the
        // operation; it will be passed a value that it must return verbatim;
        // the only other valid return is `null` in which case an error will be thrown.
        callback: logAttempt
      }
    ],

    // As `before`, except the callback is called after the operation and will
    // be passed the result of the operation; you may returna derivative of the
    // result.
    after: [],

    // As `before`; except the callback is called if an error occurs; it will be
    // passed the error and must return either the error or a derivative of it.
    error: []
  };
};

// This exports a standard Graphile Engine plugin that adds the operation
// hook.
module.exports = function MyOperationHookPlugin(builder) {
  builder.hook("init", (_, build) => {
    // Register our operation hook (passing it the build object):
    build.addOperationHook(logCreateMutationsHookFromBuild(build));

    // Graphile Engine hooks must always return their input or a derivative of
    // it.
    return _;
  });
};
