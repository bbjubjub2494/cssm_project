# Complex Social Systems Project

This is our project for Complex Social Systems. We implemented a traffic simulation using a Cellular Automata.

## Requirements

- Chrome version >=106 or Firefox version >=106

## Running

When the mesa web server is running you can open the interface on http://localhost:8521 in your browser.

### With Poetry

If you have [poetry](https://python-poetry.org/) you can use the following commands to install the dependencies and run our project:

```bash
poetry install
poetry run mesa runserver
```

### With Docker

Otherwise, we created a docker configuration, which contains all necessary information. You can use it with:

```bash
docker compose up -d
```

### With Nix

If you are using [Nix](https://nixos.org/) you can use:

```bash
nix-shell --run "mesa runserver"
```

## Build frontend script

To rebuild the frontend script you need to have `node` version 16 (preferred) with `npm` installed.
For a one-time build of the scripts, run:

```bash
npm install
npm run prod
```

During development the following command is more useful:

```bash
npm install
npm run watch
```

After each build, reload the browser with **Ctrl + F5** (Mac: Cmd + Shift + R).

## Formatting

There are two formatter, that fix code style issues in JavaScript and Python. Run them with:

```bash
npm run prettier
poetry run black simulation/
```
