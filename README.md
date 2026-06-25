# Meeting Room Prototype

This is the source code for the Austin Public Library meeting room booking page code prototype.

## Frameworks & Technology

- [TypeScript](https://www.typescriptlang.org/docs/handbook/intro.html)
- [React](https://react.dev)
- [React Router v8](https://reactrouter.com)
    - [Zod](https://zod.dev) [form validation](https://reactrouter.com/how-to/form-validation)
    - [Route Module Type Safety](https://reactrouter.com/explanation/type-safety)
    - [Progressive enhancement](https://reactrouter.com/explanation/progressive-enhancement)
    - [Sessions & cookies](https://reactrouter.com/explanation/sessions-and-cookies)
- [Tailwind CSS v3](https://v3.tailwindcss.com)
- [USWDS](https://designsystem.digital.gov)
    - [trussworks/react-uswds](https://trussworks.github.io/react-uswds/?path=/docs/welcome--docs)
- [npm](https://docs.npmjs.com/cli/v11)
- [Oxfmt](https://oxc.rs/docs/guide/usage/formatter) for formatting
- [Oxlint](https://oxc.rs/docs/guide/usage/linter) for linting
- [Varlock](https://varlock.dev) for environment variable schema, validation, and type generation
- [@deno/kv](https://github.com/denoland/denokv/tree/main/npm)
- [Mapbox GL JS](https://docs.mapbox.com/mapbox-gl-js/guides)
- [Visual Studio Code](https://code.visualstudio.com) (or one of its derivatives)

# Project Layout

```
.
├── app
│   ├── components
│   │   └── ...
│   ├── data
│   │   └── ...
│   ├── lib
│   │   └── ...
│   ├── root.tsx
│   ├── routes
│   │   └── ...
│   ├── routes.ts
│   ├── shared
│   │   └── ...
│   └── styles
│       └── tailwind.css
├── .env
├── .env.schema
├── package.json
├── postcss.config.js
├── react-router.config.ts
├── tailwind.config.ts
├── tailwindcss-uswds
│   └── ...
├── tsconfig.json
└── vite.config.ts
```

## Contributing

This prototype is built and maintained by a small team of mostly volunteers – we'd love your help to fix bugs and add features!

There is a short guide for setting up a local development environment in [CONTRIBUTING.md](./CONTRIBUTING.md) if you wish to contribute changes, fixes, and improvements to the Meeting Room prototype.

Before submitting a pull request, please discuss with the core team by creating or commenting in an issue on GitHub – we'd also love to hear from you in the discussions. This way we can ensure that an approach is agreed on before code is written. This will result in a much higher likelihood of your code being accepted.

If you’re looking for ways to get started, here's a list of ways to help us improve this prototype:

- Issues with [good first issue label](https://github.com/APL-Innovation-Lab/meeting-room-prototype/labels/good%20first%20issue)
- Developer happiness and documentation
- Bugs and other issues listed on GitHub

## Tests

We aim to have sufficient test coverage for critical parts of the prototype and aren't aiming for 100% unit test coverage.

To add new tests, write your tests with Vitest and add a file with `.test.ts` extension in the same directory as the tested code.

```sh
# To run all tests
npm run test

# To run tests in dev watch mode
npm run test:dev
```
