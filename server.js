const { postgraphile, makePluginHook } = require("postgraphile");
const express = require("express");

// This is how we load server plugins into PostGraphile
// See: https://www.graphile.org/postgraphile/plugins/
const pluginHook = makePluginHook([
  require("@graphile/operation-hooks").default
]);

const postGraphileMiddleware = postgraphile(
  process.env.DATABASE_URL,
  process.env.SCHEMA_NAME || "public",
  {
    pluginHook,
    operationMessages: true,
    operationMessagesPreflight: true,
    appendPlugins: [
      // This is how we load Graphile Engine plugins:
      require("./hooks/logger.js")
    ],

    // optional settings:
    subscriptions: true,
    enhanceGraphiql: true,
    graphiql: true,
    graphiqlRoute: "/"
  }
);

// This example uses `Express` but you can use http, Koa, etc.
const app = express();
app.use(postGraphileMiddleware);
app.listen(6543);
