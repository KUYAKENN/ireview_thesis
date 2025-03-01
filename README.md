# IReview

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 19.0.6.

## Development server

To start a local development server, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

To execute unit tests with the [Karma](https://karma-runner.github.io) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.


# Install Tailwind CSS
npm install -D tailwindcss postcss autoprefixer

# Generate tailwind.config.js and postcss.config.js
npx tailwindcss init -p
npm install @angular/animations
ng add @angular/material
npm install @angular/animations
npm install sweetalert2


if incounter error 

# first, uninstall the conflicting packages
npm uninstall @angular/animations @angular/material @angular/cdk

# Then install them with matching versions
npm install @angular/animations@^19.0.5 @angular/material@^19.0.5 @angular/cdk@^19.0.5 --save --legacy-peer-deps

# If you still encounter issues, you can try with the --force flag
npm install @angular/animations@^19.0.5 @angular/material@^19.0.5 @angular/cdk@^19.0.5 --save --force