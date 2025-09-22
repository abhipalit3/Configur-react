import outputs from '../amplify_outputs.json';

export const amplifyConfig = {
  ...outputs,
  Auth: {
    Cognito: {
      userPoolId: outputs.auth?.user_pool_id || 'your-user-pool-id',
      userPoolClientId: outputs.auth?.user_pool_client_id || 'your-client-id',
      region: outputs.auth?.aws_region || 'us-east-1',
    }
  }
};