import { ApolloClient, InMemoryCache, ApolloProvider, HttpLink, ApolloLink, concat, Observable } from '@apollo/client';

// CommerceTools API URLs from environment variables
const CT_AUTH_URL = process.env.CTP_AUTH_URL || 'https://auth.us-central1.gcp.commercetools.com';
const CT_API_URL = process.env.CTP_API_URL || 'https://api.us-central1.gcp.commercetools.com';
const CT_PROJECT_KEY = process.env.CTP_PROJECT_KEY || 'pizza';

// CommerceTools API credentials from environment variables
const CT_CLIENT_ID = process.env.CTP_CLIENT_ID;
const CT_CLIENT_SECRET = process.env.CTP_CLIENT_SECRET;
const CT_SCOPES = process.env.CTP_SCOPES || 'manage_project:pizza';

// Log environment availability for debugging
console.log("CommerceTools Config:", {
  authUrl: CT_AUTH_URL,
  apiUrl: CT_API_URL,
  projectKey: CT_PROJECT_KEY,
  clientIdAvailable: !!CT_CLIENT_ID,
  clientSecretAvailable: !!CT_CLIENT_SECRET,
  scopes: CT_SCOPES
});

// Create a token state to store the access token
let accessToken = '';
let tokenExpiry = 0;

// Function to get a valid access token
async function getAccessToken() {
  // Check if current token is still valid with a 5-minute buffer
  const now = Date.now();
  if (accessToken && tokenExpiry > now + 300000) {
    return accessToken;
  }

  try {
    console.log("Requesting new access token from CommerceTools...");
    
    if (!CT_CLIENT_ID || !CT_CLIENT_SECRET) {
      throw new Error("Client ID or Client Secret is missing in environment variables");
    }
    
    // Format the credentials as username:password
    const credentials = `${CT_CLIENT_ID}:${CT_CLIENT_SECRET}`;
    console.log("Auth credentials format (not showing actual values):", 
                `${CT_CLIENT_ID.substring(0, 3)}...:{SECRET}`);
    
    // Create Basic Auth header value - encode to Base64
    const basicAuth = btoa(credentials);
    
    // Log the request details (without exposing credentials)
    console.log("Auth request to:", `${CT_AUTH_URL}/oauth/token`);
    console.log("Auth request body:", {
      grant_type: 'client_credentials',
      scope: CT_SCOPES
    });
    
    // Request new access token
    const response = await fetch(`${CT_AUTH_URL}/oauth/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${basicAuth}`,
      },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        scope: CT_SCOPES,
      }).toString(),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Auth error response:", errorText);
      throw new Error(`Failed to get access token: ${response.statusText}`);
    }

    const data = await response.json();
    console.log("Successfully obtained access token");
    accessToken = data.access_token;
    tokenExpiry = now + data.expires_in * 1000;
    return accessToken;
  } catch (error) {
    console.error('Error getting CommerceTools access token:', error);
    return '';
  }
}

// Create the HTTP link to CommerceTools GraphQL API
const httpLink = new HttpLink({
  uri: `${CT_API_URL}/${CT_PROJECT_KEY}/graphql`,
});

// Create the auth middleware
const authMiddleware = new ApolloLink((operation, forward) => {
  return new Observable(observer => {
    let handle: { unsubscribe: () => void } | null = null;
    Promise.resolve()
      .then(() => getAccessToken())
      .then(token => {
        if (token) {
          console.log("Adding Bearer token to GraphQL request");
          operation.setContext({
            headers: {
              authorization: `Bearer ${token}`,
            },
          });
        } else {
          console.warn("No token available for GraphQL request");
        }
      })
      .then(() => {
        handle = forward(operation).subscribe({
          next: observer.next.bind(observer),
          error: (error) => {
            console.error("GraphQL operation error:", error);
            observer.error(error);
          },
          complete: observer.complete.bind(observer),
        });
      })
      .catch(error => {
        console.error("Error in auth middleware:", error);
        observer.error(error);
      });

    return () => {
      if (handle) handle.unsubscribe();
    };
  });
});

// Create the Apollo Client instance
const client = new ApolloClient({
  link: concat(authMiddleware, httpLink),
  cache: new InMemoryCache(),
  defaultOptions: {
    watchQuery: {
      fetchPolicy: 'network-only', // Don't use cache for watchQuery operations
      nextFetchPolicy: 'cache-first', // Use cache after initial fetch
    },
  },
});

export default client;
export { ApolloProvider }; 