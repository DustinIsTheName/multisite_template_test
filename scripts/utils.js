import readline from "readline";
import chalk from 'chalk'

const log = (msg, ...rest) => console.log(chalk.cyan(msg), ...rest)
const error = (err, ...rest) => console.error(chalk.red(err), ...rest)
const warn = (err, ...rest) => console.error(chalk.yellow(err), ...rest)
const success = (msg, ...rest) => console.error(chalk.green(msg), ...rest)
const final = (msg, ...rest) => console.error(chalk.greenBright(msg), ...rest)
const aside = (msg, ...rest) => console.error(chalk.magentaBright(msg), ...rest)
const debug = (msg, ...rest) => console.error(chalk.debug(msg), ...rest)

// ==================================================
// Extendable List of Sites
// ==================================================
const siteTruth = {
};
const sites = Object.keys(siteTruth);

// ==================================================
// Extendable List of Environments
// ==================================================
const envs = [
  "dev",
  "stg",
  "prd"
];

// ==================================================
// Extendable List of Groups
// ==================================================
const groups = {
  "all": sites,
}

/********************
 ** Helper functions
 ********************/
const siteSet = new Set(sites); // for validate functions
const groupSet = new Set(Object.keys(groups)); // for validate functions

function validateGroup(group) {
  const invalidSites = groups[group].filter(
    (site) => !siteSet.has(site)
  );

  if (invalidSites.length) {
    error(
      `Group "${group}" contains invalid sites: ${invalidSites.join(", ")}`
    );
    return false;
  }
  return true;
}

function validateSite(site, { groupAllowed = true } = {}) {
  if (siteSet.has(site) && groupSet.has(site)) {
    error(
      `ERROR: "${site}" is the name of a site AND group`
    );
    return false;
  }

  if (siteSet.has(site)) {
    return true;
  }

  if (groupSet.has(site) && groupAllowed) {
    return validateGroup(site);
  } else if (groupSet.has(site) && !groupAllowed) {
    error(`Groups are not allowed for this parameter: ${site}`);
    return false;
  }

  error(`The site "${site}" has not been established in this repo`);
  return false;
}

function prompt(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    rl.question(chalk.cyan('>>> ' + question), (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

/******************************
 ** Derived values from siteTruth
 ******************************/
const themeMap = Object.fromEntries(
  Object.entries(siteTruth).map(siteItem => [siteItem[0], `sites/${siteItem[1]}`])
);
const deployMap = Object.fromEntries(
  Object.entries(siteTruth).map(siteItem => [siteItem[0], `deploy/${siteItem[1]}`])
);

export {
  log,
  error,
  warn,
  success,
  final,
  aside,
  debug,
  siteTruth,
  sites,
  groups,
  themeMap,
  deployMap,
  validateGroup,
  validateSite,
  prompt,
  envs
}