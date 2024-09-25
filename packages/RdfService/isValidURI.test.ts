import { isValidURI } from "./isValidURI";

describe("isValidURI", () => {
  const testUri = (uri: string) => `${isValidURI(uri) ? "✅" : "❌ "} ${uri}`;

  test("Valid URIs", () => {
    expect(
      [
        "http://example.com",
        "https://example.com/resource",
        "ftp://ftp.example.com/file.txt",
        "kafka://catalog/admin@testdata.com",
        "custom-scheme+1.0://path/to/resource",
        "file://adapter/test_data/faux_africa.csv",
        "mailto:user@example.com",
        "tel:+1234567890",
        "data:text/plain;base64,SGVsbG8sIFdvcmxkIQ==",
        "ws://localhost:8080/socket",
        "urn:example:animal:ferret:nose",
        "mqtt://broker.hivemq.com:1883",
        "amqp://user:pass@host:5672/vhost",
        "redis://:password@127.0.0.1:6379/0",
        "sftp://user@host.com/path",
        "ldap://ldap.example.com/dc=example,dc=com",
        "git+ssh://git@github.com:user/repo.git",
        "svn://svn.example.com/repo",
        "news://news.example.com/article",
        "irc://irc.example.com/channel",
        "custom://?query=param",
        "custom://#fragment",
        "custom://:port",
        "custom://user@:password@host",
        "custom://user:password@",
      ].map(testUri)
    ).toMatchInlineSnapshot(`
      [
        "✅ http://example.com",
        "✅ https://example.com/resource",
        "✅ ftp://ftp.example.com/file.txt",
        "✅ kafka://catalog/admin@testdata.com",
        "✅ custom-scheme+1.0://path/to/resource",
        "✅ file://adapter/test_data/faux_africa.csv",
        "✅ mailto:user@example.com",
        "✅ tel:+1234567890",
        "✅ data:text/plain;base64,SGVsbG8sIFdvcmxkIQ==",
        "✅ ws://localhost:8080/socket",
        "✅ urn:example:animal:ferret:nose",
        "✅ mqtt://broker.hivemq.com:1883",
        "✅ amqp://user:pass@host:5672/vhost",
        "✅ redis://:password@127.0.0.1:6379/0",
        "✅ sftp://user@host.com/path",
        "✅ ldap://ldap.example.com/dc=example,dc=com",
        "✅ git+ssh://git@github.com:user/repo.git",
        "✅ svn://svn.example.com/repo",
        "✅ news://news.example.com/article",
        "✅ irc://irc.example.com/channel",
        "✅ custom://?query=param",
        "✅ custom://#fragment",
        "✅ custom://:port",
        "✅ custom://user@:password@host",
        "✅ custom://user:password@",
      ]
    `);
  });

  describe("Invalid URIs", () => {
    expect(
      [
        "file:///adapter/test_data/faux_africa.csv",
        "http:/example.com",
        "://missing-scheme.com",
        "http//missing-colon.com",
        "ht tp://space-in-scheme.com",
        "http://",
        "http:// ",
        "ftp://example.com/file name with spaces.txt",
        "kafka:/invalid/uri",
        "custom_scheme://invalid_char^acters",
        "file:///C:/path/to/file",
        "http://example.com/invalid|pipe",
        "http://example.com/😊",
        "http://example.com/space in path",
        "http://example.com/\nnewline",
        "justastring",
        "",
        " ",
        "http://exa mple.com",
        "custom://",
      ].map(testUri)
    ).toMatchInlineSnapshot(`
      [
        "✅ file:///adapter/test_data/faux_africa.csv",
        "❌  http:/example.com",
        "❌  ://missing-scheme.com",
        "❌  http//missing-colon.com",
        "❌  ht tp://space-in-scheme.com",
        "❌  http://",
        "❌  http:// ",
        "❌  ftp://example.com/file name with spaces.txt",
        "❌  kafka:/invalid/uri",
        "❌  custom_scheme://invalid_char^acters",
        "✅ file:///C:/path/to/file",
        "✅ http://example.com/invalid|pipe",
        "✅ http://example.com/😊",
        "❌  http://example.com/space in path",
        "❌  http://example.com/
      newline",
        "❌  justastring",
        "❌  ",
        "❌   ",
        "❌  http://exa mple.com",
        "❌  custom://",
      ]
    `);
  });
});

// Other things tried
// ------------------
// export const permissiveUriRegex = /^[a-z][a-z0-9+.-]*:\/\/[^ \t\r\n]+$/i; // Slower
// export const permissiveUriRegex = /^[a-z][a-z0-9+.-]*:\/\/\S+$/i; // Faster
// export const permissiveUriRegex = /^[a-z][a-z0-9+.-]*:(?!.*[|<>"\s])[\x21-\x7E]+$/i; // Balanced
// export const permissiveUriRegex = /^[A-Za-z][A-Za-z0-9+.-]*:(?:\/\/[^\/\s]\S+|[^\/\s]\S*)$/;
// export const permissiveUriRegex = /^[A-Za-z][A-Za-z0-9+.-]*:(?:\/\/[^/\s]\S+|[^/\s]+)$/i;// schema.ts
// export const isValidURI = (uri: string): boolean => {
//   try {
//     new URL(uri);
//     return true;
//   } catch {
//     return false;
//   }
// }
// import { validateIri, IriValidationStrategy } from 'validate-iri'; // needed to write d.ts file
// export const validateIRI = (value:string) => {
//   try{
//     validateIri(value, IriValidationStrategy.Pragmatic)
//     return true;
//   } catch(err) {
//     return false
//   }
// }
