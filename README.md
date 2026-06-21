# Monkey Sports

The Shopify Sleek template has been customized by CQL to enhance user experience and provide a modern, responsive design. This template is designed to cater to various e-commerce needs, ensuring a seamless shopping experience for customers.

## Tooling

- Git
- Github
- Node 24.x
- Yarn (or npm)
- [Shopify CLI](https://shopify.dev/docs/api/shopify-cli)
- Base Theme: [Enterprise](https://themes.shopify.com/themes/enterprise/presets/enterprise)
- Search: Fast Simon - App

## Setup Steps


## Deploy Commands

Deploy commands follow a structure of `yarn <command> <site> <environment>`

### commands

- `push` => Uploads your local theme files to Shopify
- `pull` => Retrieves theme files from Shopify
- `dev` => upload changes to your theme in real time

### sites

- `main` => Monkey Sports Main; directory: `sites/main`
- `hockus` => Hockey Monkey US; directory: `sites/hockey_us`
- `hockca` => Hockey Monkey CA; directory: `sites/hockey_ca`
- `base` => Baseball Monkey; directory: `sites/baseball`
- `goal` => Goalie Monkey; directory: `sites/goalie`
- `lac` => Lacrosse Monkey; directory: `sites/lacrosse`
- `all` => Target all 6 sites simultaneously;

### environment (optional)

- `prd` (deploy to the production theme)
- `stg` (deploy to the staging theme)
- `dev` (deploy to your development theme; this is the default if you leave it blank)

### examples

- `yarn push main` would deploy to your dev theme on the Monkey Sports Main store
- `yarn pull base stg` would pull the site data from the Staging theme on the Baseball Monkey store
- `yarn push hockca prd` would deploy to the Staging theme on the Hockey Monkey CA store
- `yarn dev goal` would watch for local file changes and deploy to your dev theme on the Goalie Monkey Store
- `yarn push all stg` => Would deploy to the Staging theme on all 6 stores

## Setting up a new store

1. Run the new-site command

- Example Format: `yarn new-site site_key site_directory store=myshopify_url password=seawok name="Monkeying Around"`
  - `site_key` and `site_directory` are mandatory and need no prefixes.
    - `site_key` is the shorthand for the site. Whatever you enter here will be what you use for the `<site>` in all Deploy Commands
    - `site_directory` will be the name of the directory for the store within `sites/`
  - `store`, `password`, and `name` are all optional and require the prefix as formatted above
    - `store` is the myshopify URL for your store
    - `password` is the storefront password for your store if it still has password protection
    - `name` is a generic Display Name for your store. Nothing functional relies on it

2. `shopify.theme.template.toml` will now have 3 new environments for your store. Fill in any detials for the optional variables that were not filled in prior. Copy them to your `shopify.theme.toml` proper and fill in your theme ids from the themes you are using for Production, Staging, and your personal Dev as applicable.

## Branching Strategy

- Default Branch: `main`
- Feature Ticket: `feature/*Project_Code*-*Ticket_Number*`
- Bug Ticket: `bugfix/*Project_Code*-*Ticket_Number*`

## Developer Initial Setup

1. Go into all Client Stores and duplicate each published theme. Rename duplicated themes to `Dev - __NAME__`
2. Update `shopify.theme.template.toml` file to have entries for each theme created and update theme IDs
3. In the client stores, open the `Theme Access` app and request passwords for each store. Copy those passwords into your `.toml`

### Special Install Instructions

No known special considerations at the time

### Troubleshooting

No known install issues.

## Developer Workflow

1. The developer will duplicate the **Latest Code** theme in a store they decide to work in. The theme name should include the Jira ticket number. Example: **CQLJIRA-12 Footer**.

2. The developer updates the store environment theme variable with the correct Theme ID for their theme.

3. The developer creates a branch from `main` using the Jira ticket number. Example: `CQLJIRA-12-footer`.

4. The developer then pulls the Shopify code down to their local environment. Example: `shopify theme pull --environment store-one`

5. After the work is completed open a pull request against the `main` branch. **Discard all JSON files** before opening the pull request. Make sure the correct Jira ticket number, theme name, and theme preview ID are included in the pull request.

6. In the Jira ticket add a comment that includes the URL to pull request **and** theme preview.
   - **Content/Settings (JSON):** List any JSON files that were updated or are required for this work.
     - _Example:_ `sections/footer-group.json` or _Toggle pre-footer checkbox in Footer section_.
   - **Testing Instructions:** Add helpful information on how and where to test this specific feature.

7. Mark Jira ticket as ready for code review and assign a reviewer.

> After the pull request has been merged, _if_ JSON updates are needed they should be added to the **Latest Code** theme. There are three ways to do this.
>
> - In Shopify, go to the theme customizer and update it (small changes).
> - In Shopify, go to Edit code in the Dev theme and copy the json file and paste/create it in the Latest Code theme (small to large).
> - In Git, commit and push the JSON file to the correct stores branch (medium to large).
>
> This needs to be done before the Jira ticket is passed to QA.

## Deployment Process (Tech Lead Only)

1. `shopify theme pull --theme main`
2. Commit client theme changes to `main`
3. Merge all PRs to `main` and fetch
4. Duplicate/Backup all themes affected by the deployment
5. `shopify theme push --theme main`

### Special Deployment Instructions

No known special considerations at the time
