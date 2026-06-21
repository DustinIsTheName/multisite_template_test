import { spawn } from "child_process";
import { execSync } from "child_process";
import { log, error, warn, aside, success, final } from './utils.js';
import { sites, groups } from './utils.js';
import { validateSite, prompt } from './utils.js';

/********************
 ** Helper functions
 ********************/

function isGitClean() {
  const output = execSync("git status --porcelain", {
    encoding: "utf8"
  });

  return output.trim().length === 0;
}

// use run to start a sequentional spawn process using await
// without using run, spawning a process would move on to the next one immediately
function run(command) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, {
      stdio: "inherit",
      shell: true
    });

    child.on("exit", code => {
      if (code === 0) resolve();
      else reject(new Error(`${command} failed`));
    });
  });
}

/**************************************************
 ** store all started dev processes to kill upon exit 
 **************************************************/
const children = [];

function track(child) {
  children.push(child);
  return child;
}

function cleanup() {
  for (const c of children) {
    c.kill("SIGTERM");
  }
}

process.on("SIGINT", cleanup);
process.on("exit", cleanup);

/**************************************************
 ** Logic for the main tasks: push, pull, & dev
 **************************************************/
const tasks = {
  push: async ([site, env = "dev"]) => {
    await run(`node scripts/copy-entire-theme.js push ${site}`);
    await run(`node scripts/shop-command.js push ${site} ${env}`);
    success(`Pushed theme to ${site} on ${env}`);
  },

  pull: async ([site, env = "dev"]) => {
    await run(`node scripts/shop-command.js pull ${site} ${env}`);
    await run(`node scripts/copy-entire-theme.js pull ${site}`);
    success(`Pulled theme to ${site} on ${env}`);
  },

  pushj: async ([site, env = "dev"]) => {
    await run(`node scripts/copy-entire-theme.js push ${site} json`);
    await run(`node scripts/shop-command.js push ${site} ${env} json`);
    success(`Pushed json to ${site} on ${env}`);
  },

  pullj: async ([site, env = "dev"]) => {
    await run(`node scripts/shop-command.js pull ${site} ${env} json`);
    await run(`node scripts/copy-entire-theme.js pull ${site} json`);
    success(`Pulled json to ${site} on ${env}`);
  },

  dev: async ([site, env = "dev"]) => {
    track(spawn("node", ["scripts/shop-command.js", "dev", site, env], {
      stdio: "inherit"
    }));
    track(spawn("node", ["scripts/local-theme-watch.js", site, env], {
      stdio: "inherit"
    }));
  }
};

/**************************************************
 ** Call above logic for multiple sites with "all" or group commands
 **************************************************/
const allTasks = {
  push: async ([sites, env = "dev"]) => {
    await Promise.all(
      sites.map(site => tasks.push([site, env]))
    );
    final(`Pushed theme to entire list of sites`);
  },
  pull: async ([sites, env = "dev"]) => {
    await Promise.all(
      sites.map(site => tasks.pull([site, env]))
    );
    final(`Pulled theme to entire list of sites`);
  },
  pushj: async ([sites, env = "dev"]) => {
    await Promise.all(
      sites.map(site => tasks.pushj([site, env]))
    );
    final(`Pushed json to entire list of sites`);
  },
  pullj: async ([sites, env = "dev"]) => {
    await Promise.all(
      sites.map(site => tasks.pullj([site, env]))
    );
    final(`Pulled json to entire list of sites`);
  },
  dev: async ([sites, env = "dev"]) => {
    sites.map(site => tasks.dev([site, env]));
  }
}

/**************************************************
 ** Starting logic after defining our main functions
 **************************************************/
// args should include:
//   the sitename (or a group identity like "all")
//   the environment (prd/stg/dev; defaults to "dev")
const [taskName, ...args] = process.argv.slice(2);
const site = args[0];

// check that given site or group is valid
if (!validateSite(site)) {
  process.exit(1);
}

// Protect the Production theme!!!
if (taskName !== "pull" && args[1] === "prd") {
  const answer = await prompt(`You are about to perform ${taskName} on live theme. Continue? (y/n): `);

  if (answer !== "y") {
    aside('Close one!');
    process.exit(0);
  }
}

// Chance to abort pull if you haven't commited your work
if (!isGitClean() && taskName === "pull") {
  const answer = await prompt("The current Git directory has uncommitted changes. Continue? (y/n): ");

  if (answer !== "y") {
    process.exit(0);
  }
}

const task = tasks[taskName];
const allTask = allTasks[taskName];

// call the allTask on a group if a group was passed
if (groups[site]) {
  if (!allTask) {
    console.error(`Unknown task: ${taskName}`);
    process.exit(1);
  }

  allTask([groups[site], args[1]]).catch(err => {
    console.error(err);
    process.exit(1);
  });
// call the task on a single site otherwise
} else {
  if (!task) {
    console.error(`Unknown task: ${taskName}`);
    process.exit(1);
  }
  
  task(args).catch(err => {
    console.error(err);
    process.exit(1);
  });
}