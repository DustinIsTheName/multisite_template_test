import { log, error, warn, final, aside, envs, siteTruth } from './utils.js';
import fs from 'fs-extra';

// required args
const [site_key, site_dir] = process.argv.slice(2);
// optional args:
// password (frontend storefront password)
// store (perment "myshopify" url)
// name (a plain display name)
const optionalArgs = Object.fromEntries(
  process.argv.slice(4).map(arg => arg.split("="))
);

// ERROR if missing required args
if (!site_key || !site_dir) {
  error(`Missing required arguments:${site_key || '\nsite key'}${site_dir || '\nsite directory'}`);
  process.exit(1);
}

// ERROR if site or directory already exists
const siteSet = new Set(Object.keys(siteTruth));
const dirSet = new Set(Object.values(siteTruth));
if (siteSet.has(site_key) || dirSet.has(site_dir)) {
  error(`ERROR: ${siteSet.has(site_key) ? `the site "${site_key}" already exists`:''}${dirSet.has(site_dir) ? `\nthe directory "${site_dir}" already exists`:''}`);
  process.exit(1);
}

/**********************************************************
 ** 1. Create new directories in deploy/ and sites/
 **********************************************************/
fs.mkdirSync(`sites/${site_dir}`, { recursive: true });
fs.mkdirSync(`deploy/${site_dir}`, { recursive: true });
aside(`Created new directories for ${site_dir}`);

/**********************************************************
 ** 2. Add the new site to the siteTruth map in scripts/utils.js
 **********************************************************/
const utils = fs.readFileSync("scripts/utils.js", "utf8");

const updated = utils.replace(
  /const siteTruth = \{([\s\S]*?)\};/,
  (match, contents) =>
    `const siteTruth = {${contents}  "${site_key}": "${site_dir}",\n};`
);
fs.writeFileSync("scripts/utils.js", updated);
log(`Added new site key and directory to scripts/utils.js`);

/**********************************************************
 ** 3. Update shopify.theme.template.toml with new environments
 **********************************************************/
const tomlPath = "shopify.theme.template.toml";
const toml = fs.existsSync(tomlPath) ? fs.readFileSync(tomlPath, "utf8") : "";

// standard starting environments for each site
// can be adjusted or extened as needed
// "prd" has slightly extra behavior in task.js
// "dev" is assumed as the default when running scripts with calling env out

// scour the toml file for all the existing ports (ex: "port = 9292")
const ports = [
  ...toml.matchAll(/port\s*=\s*(\d+)/g)
].map(match => Number(match[1]));

// need the next port unless this is the first one
// 9292 is Shopify's default, so start there
const nextPort =
  ports.length === 0
    ? 9292
    : Math.max(...ports) + 1;

// form each environment...
function makeBlock(env) {
  return `[environments.${site_key}_${env}]
theme = "${env === "dev" ? "<your-theme-id>" : "<TBD>"}"
store-password = "${optionalArgs.password || ''}"
store = "${optionalArgs.store || ''}"
path = "./deploy/${site_dir}"
output = "json"
force = true
port = ${nextPort}
${env === "prd" ? "allow-live = true" : ""}`;
}

// ...and slap 'em all together
const blocks = envs.map(env => makeBlock(env)).join("\n");
const header = `
################################################
###### ${optionalArgs.name || "New Site"} Configurations
################################################
`;

const output = header + blocks + "\n";
fs.appendFileSync(tomlPath, output);
log(`Added new shopify environments for ${envs.map(env => ` ${site_key}_${env}`)}`);
final(`New site established. Be sure to fill in the toml template and copy it into your toml proper.`);