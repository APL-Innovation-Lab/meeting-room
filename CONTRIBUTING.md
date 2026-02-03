# Contributing

These are instructions for getting started on a Mac/unix machine. Windows instructions TBD.

## Dependencies

Install these dependencies if you don't already have them:

- [git](https://formulae.brew.sh/formula/git)
- [nvm](https://formulae.brew.sh/formula/nvm)

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

You'll need a Mapbox API token to run this project (`VITE_APP_MAPBOX_TOKEN` in your `.env` file). You can [generate one of these on your own, using your own Mapbox account](https://docs.mapbox.com/api/accounts/tokens) or you can ask Mark Malstrom for a secure link to the Austin Public Library Mapbox API token in the [Open Austin Slack](https://open-austin.slack.com/messages).

## Configuration

`install` (if necessary) and `use` with nvm:

```sh
cd meeting-room-prototype
nvm install # if necessary
nvm use
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

- [ESLint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint) for inline linting errors and auto-fix-on-save support
- [Prettier](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode) for format-on-save support
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
- [GitHub Actions](https://marketplace.visualstudio.com/items?itemName=GitHub.vscode-github-actions) for managing CI/CD workflows in VS Code
