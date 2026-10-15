# Protocol

The full client/server contract lives at the repository root in `server-contract.md`.
Type constants are in `messages.js`, transport in `socket.js`, inbound handling in `handlers.js`.

Message type names, pace values, error codes, and turn timeouts come from the shared contract package
`@jamesdo5/500cardgame-contract` (`wire.json` and `timeouts.json`), pulled from
`github:JamesDo5/500cardGameContract`. Bump the semver range in `package.json` when the contract changes.
