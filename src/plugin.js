const jwtDecode = require("jwt-decode")
const CryptoJS = require("crypto-js")

// Get JWT Token from Cognito
const session = async ({
  Username,
  Password,
  Region,
  ClientId,
  TokenType,
}) => {
  const domain = Region.split('_')[0] // backward compatible with Pool
  const response = await fetch(`https://cognito-idp.${domain}.amazonaws.com`, {
    method: "post",
    headers: {
      "content-type": "application/x-amz-json-1.1",
      "x-amz-target": "AWSCognitoIdentityProviderService.InitiateAuth",
    },
    body: JSON.stringify({
      AuthFlow: "USER_PASSWORD_AUTH",
      ClientId,
      AuthParameters: {
        USERNAME: Username,
        PASSWORD: Password,
      },
    }),
  })
  if (response.status !== 200) {
    console.log(
      "Looks like there was a problem. Status Code: " + response.status
    )
    return
  }
  const { AuthenticationResult } = await response.json()
  return AuthenticationResult
    ? TokenType === "id"
      ? AuthenticationResult.IdToken
      : AuthenticationResult.AccessToken
    : undefined
}


// Validate if the token has expired
const validToken = (token) => {
  const now = Date.now().valueOf() / 1000
  try {
    const data = jwtDecode(token)
    if (typeof data.exp !== "undefined" && data.exp < now) {
      return false
    }
    if (typeof data.nbf !== "undefined" && data.nbf > now) {
      return false
    }
    return true
  } catch (err) {
    return false
  }
}

// Encode our token
const base64url = (source) => {
  encodedSource = CryptoJS.enc.Base64.stringify(source)
  encodedSource = encodedSource.replace(/=+$/, "")
  encodedSource = encodedSource.replace(/\+/g, "-")
  encodedSource = encodedSource.replace(/\//g, "_")
  return encodedSource
}

// Create a fake token to keep in store, so we don't query for same wrong values
const errorToken = (error) => {
  const header = {
    alg: "HS256",
    typ: "JWT",
  }
  const stringifiedHeader = CryptoJS.enc.Utf8.parse(JSON.stringify(header))
  const encodedHeader = base64url(stringifiedHeader)
  // If error we keep it for 1 min
  const exp = Date.now().valueOf() / 1000 + 60
  const data = {
    error,
    exp,
  }
  const stringifiedData = CryptoJS.enc.Utf8.parse(JSON.stringify(data))
  const encodedData = base64url(stringifiedData)
  return encodedHeader + "." + encodedData
}

// Main run function
const run = async (
  context,
  Username,
  Password,
  Region,
  ClientId,
  TokenType
) => {
  if (!Username) {
    throw new Error("Username attribute is required")
  }
  if (!Password) {
    throw new Error("Password attribute is required")
  }
  if (!Region) {
    throw new Error("Region attribute is required")
  }
  if (!ClientId) {
    throw new Error("ClientId attribute is required")
  }
  if (!TokenType) {
    TokenType = "access"
  }

  const key = [Username, Password, Region, ClientId, TokenType].join("::")
  const token = await context.store.getItem(key)
  if (token && validToken(token)) {
    if (jwtDecode(token).error) {
      // Display error
      return jwtDecode(token).error
    }
    // JWT token is still valid, reuse it
    return token
  } else {
    // Compute a new token
    try {
      const token = await session({
        Username,
        Password,
        Region,
        ClientId,
        TokenType,
      })
      await context.store.setItem(key, token)
      return token
    } catch (error) {
      // To keep thing simle we create a fake JWT token with error message
      const token = errorToken(error.message)
      await context.store.setItem(key, token)
      return error.message
    }
  }
}

module.exports.templateTags = [
  {
    name: "AwsCognitoToken",
    displayName: "AWS Cognito Token",
    description: "Plugin for Insomnia to provide Cognito JWT token from AWS",
    args: [
      {
        displayName: "Username",
        type: "string",
        validate: (arg) => (arg ? "" : "Required"),
      },
      {
        displayName: "Password",
        type: "string",
        validate: (arg) => (arg ? "" : "Required"),
      },
      {
        displayName: "Region",
        type: "string",
        validate: (arg) => (arg ? "" : "Required"),
      },
      {
        displayName: "ClientId",
        type: "string",
        validate: (arg) => (arg ? "" : "Required"),
      },
      {
        displayName: "TokenType",
        type: "enum",
        defaultValue: "access",
        options: [
          {
            displayName: "access",
            value: "access",
          },
          {
            displayName: "id",
            value: "id",
          },
        ],
      },
    ],
    run,
  },
]
