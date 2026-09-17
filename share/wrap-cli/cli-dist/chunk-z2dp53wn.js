// @bun
// src/cli/exit.ts
function cliError(msg) {
  if (msg)
    console.error(msg);
  process.exit(1);
  return;
}
function cliOk(msg) {
  if (msg)
    process.stdout.write(msg + `
`);
  process.exit(0);
  return;
}

export { cliError, cliOk };

//# debugId=BC559EEC195E863E64756E2164756E21
//# sourceMappingURL=chunk-z2dp53wn.js.map
