const AWSCognito = require('amazon-cognito-identity-js')
var jwtDecode = require('jwt-decode');

const session = ({UserPoolId, ClientId, Username, Password}) => new Promise((resolve, reject) => {
  new AWSCognito.CognitoUser({
    Username,
    Pool: new AWSCognito.CognitoUserPool({
      UserPoolId,
      ClientId,
    })
  }).authenticateUser(new AWSCognito.AuthenticationDetails({
    Username,
    Password
  }),
    {
      onSuccess: result => {
        // console.log(result.accessToken.jwtToken)
        resolve(result.accessToken.jwtToken)
      },
      onFailure: error => {
        console.log(error)
        reject(error)
      }
    })
})

const validToken = token => {
  const now = Date.now().valueOf() / 1000
  const data = jwtDecode(token)
  if (typeof data.exp !== 'undefined' && data.exp < now) {
    return false
  }
  if (typeof data.nbf !== 'undefined' && data.nbf > now) {
    return false
  }
  return true
}

// context
//    app:{alert: ƒ, prompt: ƒ, getPath: ƒ, showSaveDialog: ƒ}
//    context:{getMeta: ƒ, getKeysContext: ƒ, getPurpose: ƒ, AWS: ""}
//    meta:{requestId: "req_822652edaf9b43409f2218d5098e6d73", workspaceId: "wrk_04907ce7ba2b47c4bd8a012db999214f"}
//    store:{hasItem: ƒ, setItem: ƒ, getItem: ƒ, removeItem: ƒ, clear: ƒ, …}
//    util:{render: ƒ, models: {…}}
const run = async (context, UserPoolId, ClientId, Username, Password) => {
  const data = { UserPoolId, ClientId, Username, Password }
  await context.store.setItem('Cognito', JSON.stringify(data))
  return JSON.stringify(data)
}

module.exports.requestHooks = [
  async context => {
    const data = await context.store.getItem('Cognito')
    const token = await context.store.getItem(data)
    if (token && validToken(token)) {
      console.log("Existing token", token)
      context.request.setHeader('Authorization', token);
    } else {
      const params = JSON.parse(data)
      const token = await session(params)
      console.log("New token", token)
      await context.store.setItem(data, token)
      context.request.setHeader('Authorization', token);
    }
  }
]

module.exports.templateTags = [{
  name: 'AwsCognitoToken',
  displayName: 'AWS Cognito Token',
  description: 'Plugin for Insomnia to provide Cognito JWT token from AWS',

  args: [
    {
      displayName: 'UserPoolId',
      type: 'string'
    },
    {
      displayName: 'ClientId',
      type: 'string'
    },
    {
      displayName: 'Username',
      type: 'string'
    },
    {
      displayName: 'Password',
      type: 'string'
    },
  ],
  run
}];