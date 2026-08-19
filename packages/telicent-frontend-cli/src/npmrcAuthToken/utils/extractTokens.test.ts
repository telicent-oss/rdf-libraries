import { vi, test, expect } from 'vitest'
import { extractTokens } from './extractTokens.js'
import * as authTokenModule from './authTokenPattern.js'

test(`extractTokens`, () => {
  expect(
    '//npm.dev-tools.company.live/:_authtoken=<value>'
      .match(authTokenModule.authTokenPattern)
      ?.slice(1),
  ).toMatchInlineSnapshot(`
    [
      "//npm.dev-tools.company.live/",
      "<value>",
    ]
  `)
  expect(
    '//npm.fontawesome.com/:_authtoken=<value>'
      .match(authTokenModule.authTokenPattern)
      ?.slice(1),
  ).toMatchInlineSnapshot(`
    [
      "//npm.fontawesome.com/",
      "<value>",
    ]
  `)

  expect(
    extractTokens(`
@company-io:registry=<value1>
//npm.pkg.github.com/:_authtoken=<value1>
fetch-retry-maxtimeout=<value1>
fetch-retry-mintimeout=<value1>
@company-io:registry=<value2>
//npm.pkg.github.com/:_authtoken=<value2>
# verdaccio not production ready: 2024-04-19
# @fortawesome:registry=<value>
# //npm.dev-tools.company.live/:_authtoken=<value>
@fortawesome:registry=<value>
//npm.fontawesome.com/:_authtoken=<value>
always-auth=<value>
fetch-retry-maxtimeout=<value2>
fetch-retry-mintimeout=<value2>
`),
  ).toMatchInlineSnapshot(`
    {
      "//npm.fontawesome.com/": "<value>",
      "//npm.pkg.github.com/": "<value2>",
    }
  `)
})

test('Test code that is intended to be unreachable ', () => {
  // Test unreachable code
  const forceNoMatch = /$^/
  expect(() =>
    extractTokens(`username:_authToken=`, forceNoMatch),
  ).toThrowErrorMatchingInlineSnapshot(
    `[Error: Warning: Unable to parse line: 'user****************']`,
  )
  vi.resetModules()
})
