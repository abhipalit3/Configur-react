import { type ClientSchema, a, defineData } from '@aws-amplify/backend';

const schema = a.schema({
  ManifestData: a
    .model({
      id: a.id(),
      userId: a.string().required(),
      manifestData: a.json().required(),
      lastModified: a.datetime(),
    })
    .authorization((allow) => [
      allow.owner(),
      allow.authenticated().to(['read'])
    ]),
});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: 'userPool',
  },
});