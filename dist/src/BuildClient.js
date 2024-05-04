"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_fetch_1 = __importDefault(require("node-fetch"));
const platform_sdk_1 = require("@commercetools/platform-sdk");
const sdk_client_v2_1 = require("@commercetools/sdk-client-v2");
require("dotenv/config");
// Access environment variables
const projectKey = process.env.CTP_PROJECT_KEY;
const clientId = process.env.CTP_CLIENT_ID;
const clientSecret = process.env.CTP_CLIENT_SECRET;
const authUrl = process.env.CTP_AUTH_URL;
const apiUrl = process.env.CTP_API_URL;
const scopes = process.env.CTP_SCOPES ? process.env.CTP_SCOPES.split(',') : [];
// Setup authentication and HTTP middlewares
const authMiddlewareOptions = {
    host: authUrl,
    projectKey,
    credentials: {
        clientId,
        clientSecret,
    },
    scopes,
    fetch: node_fetch_1.default,
};
const httpMiddlewareOptions = {
    host: apiUrl,
    fetch: node_fetch_1.default,
};
// Create the commercetools client
const ctpClient = new sdk_client_v2_1.ClientBuilder()
    .withClientCredentialsFlow(authMiddlewareOptions)
    .withHttpMiddleware(httpMiddlewareOptions)
    .withLoggerMiddleware()
    .build();
// Create apiRoot from the commercetools client and include your project key
const apiRoot = (0, platform_sdk_1.createApiBuilderFromCtpClient)(ctpClient)
    .withProjectKey({ projectKey });
exports.default = apiRoot;
