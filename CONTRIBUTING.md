# Contributing

These are instructions for getting started on a Mac/unix machine. Windows instructions TBD.

## Dependencies

Install these dependencies if you don't already have them:

- [git](https://formulae.brew.sh/formula/git)
- A Node version manager, to install the Node version this project targets (Node 24+):
    - [Mise](https://formulae.brew.sh/formula/mise)
    - [Vite+](https://formulae.brew.sh/formula/vite-plus)
    - [fnm](https://formulae.brew.sh/formula/fnm)

## Download

Clone the source code with HTTP:

```sh
git clone https://github.com/APL-Innovation-Lab/meeting-room-prototype
```

or with SSH:

```sh
git clone git@github.com:APL-Innovation-Lab/meeting-room-prototype
```

## Setup

The environment variables this project needs are documented in [`.env.schema`](./.env.schema) — that file is the source of truth for what you must provide. To set up, copy the template to a local `.env` and fill it in:

```sh
cp .env.example .env
```

### Mapbox access token

You'll need a Mapbox access token for `VITE_APP_MAPBOX_TOKEN`. **Generate your own free one — you don't need to ask anyone for the shared library token.** A free Mapbox account is plenty for local development.

`VITE_APP_MAPBOX_TOKEN` is a _public_ token: `mapbox-gl` runs in the browser, so the token ships in the client bundle and is visible to anyone who loads the app. That's by design and can't be hidden. What actually protects it is restricting it in the Mapbox dashboard — so create a dedicated, restricted token rather than reusing your account's default one:

1. [Sign up for a free Mapbox account](https://account.mapbox.com/auth/signup/) (or sign in).
2. Go to your [access tokens page](https://account.mapbox.com/access-tokens/) and click **Create a token**.
3. Give it a name (e.g. `apl-meeting-room-local`). Leave the **public** scopes at their defaults; you don't need any secret scopes.
4. Under **URL restrictions**, add `http://localhost:5173` (the dev server) so the token only works from your machine. Add your deployment URL too if you're deploying.
5. Click **Create token**, copy the `pk.…` value, and paste it into your `.env`:

    ```sh
    # .env
    VITE_APP_MAPBOX_TOKEN="pk.your_token_here"
    ```

If you'd rather use the shared Austin Public Library token instead, ask Mark Malstrom for it in the [Open Austin Slack](https://open-austin.slack.com/messages) — but generating your own is faster and avoids passing the shared token around.

Varlock validates your `.env` against the schema automatically when you run the dev server or build. To check it on its own:

```sh
npm run env:check
```

## Configuration

`install` with your toolchain manager (Mise shown here):

```sh
cd meeting-room-prototype
mise install
```

Install NPM dependencies:

```sh
npm install
```

And run the dev server:

```sh
node --run dev
```

## Visual Studio Code

It's recommended to use [Visual Studio Code](https://formulae.brew.sh/cask/visual-studio-code) as your integrated development environment when working on this prototype for the best development experience. There are several files in this repo's `.vscode` root-level folder which are intended to enhance this experience with additional settings to make development smooth in VS Code.

### Extensions

It's also recommended that you install these extensions for VS Code:

- [Oxc](https://marketplace.visualstudio.com/items?itemName=oxc.oxc-vscode) for format-on-save (Oxfmt) and lint (Oxlint) support
- [TypeScript (Native Preview)](https://marketplace.visualstudio.com/items?itemName=TypeScriptTeam.native-preview) for native TypeScript language support
- [npm Intellisense](https://marketplace.visualstudio.com/items?itemName=christian-kohler.npm-intellisense) for autocomplete in `package.json` and quick npm script actions in the sidebar
- [Tailwind CSS Intellisense](https://marketplace.visualstudio.com/items?itemName=bradlc.vscode-tailwindcss) for:

**Inline color swatches**

<img width="636" alt="Screenshot 2024-06-24 at 1 50 26 PM" src="https://github.com/APL-Innovation-Lab/meeting-room-prototype/assets/39869007/1df19daa-b1d6-4902-beed-6321bb413cc5">

**Hover-on-class style definition expansion**

<img width="871" alt="Screenshot 2024-06-24 at 1 50 50 PM" src="https://github.com/APL-Innovation-Lab/meeting-room-prototype/assets/39869007/2297e21b-67e5-466f-a554-f4cc093a9dab">

**Class name completion**

<img width="793" alt="Screenshot 2024-06-24 at 1 51 18 PM" src="https://github.com/APL-Innovation-Lab/meeting-room-prototype/assets/39869007/79dda557-6b52-489d-afb7-f5acf8123805">

- [TODO Highlight](https://marketplace.visualstudio.com/items?itemName=wayou.vscode-todo-highlight) for highlighting `TODO`, `FIXME`, and `MARK` comments in code
- [Vitest](https://marketplace.visualstudio.com/items?itemName=vitest.explorer) for integrating unit tests into VS Code
