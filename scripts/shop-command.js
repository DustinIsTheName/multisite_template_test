import { log, aside } from "./utils.js";
import { spawn } from "child_process";

const command = process.argv[2];
const site = process.argv[3];
const env = process.argv[4];
const json = process.argv[5];

const shop_env = `${site}_${env}`;

const shopify_args = [
  "theme", command, "--environment", shop_env,
  ...(json === "json" ? ["--only", "*.json"] : [])
];

aside('RUN: shopify ' + shopify_args.join(' '));

const child = spawn("shopify",
  shopify_args,
  {stdio: "inherit"}
);

child.on("exit", (code) => {
  process.exit(code ?? 1);
});

child.on("error", (err) => {
  console.error(err);
  process.exit(1);
});