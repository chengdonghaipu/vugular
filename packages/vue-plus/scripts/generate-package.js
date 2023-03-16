const fs = require('fs');
const path = require('path');

const pkg = require('../package.json');
//"main": "./dist/index.cjs",
//   "module": "./dist/index.mjs",
//   "types": "./dist/index.d.ts",
//   "exports": {
//     ".": {
//       "types": "./dist/index.d.ts",
//       "import": "./dist/index.mjs",
//       "require": "./dist/index.cjs"
//     }
//   },
const distPkg = {
    name: pkg.name,
    version: pkg.version,
    description: pkg.description,
    main: './dist/index.cjs',
    module: './esm2015/index.mjs',
    types: './esm2015/index.d.ts',
    typings: './esm2015/index.d.ts',
    esm2015: './esm2015/index.mjs',
    esm2020: './esm2020/index.mjs',
    exports: {
        "./package.json": {
            "default": "./package.json"
        },
        '.': {
            // esm2020: '/esm2020/index.mjs',
            type: './esm2015/index.d.ts',
            esm2020: './esm2020/index.mjs',
            default: './esm2015/index.mjs',
            // "types": "./esm2020/index.d.ts",
            // "import": "./esm2020/index.mjs",
            // "require": "./esm2020/index.cjs"
        }
    },
    sideEffects: false,
    repository: pkg.repository,
    keywords: pkg.keywords,
    author: pkg.author,
    license: pkg.license,
    bugs: pkg.bugs,
    homepage: pkg.homepage
};

fs.writeFileSync(path.join(__dirname, '..', 'dist', 'package.json'), JSON.stringify(distPkg, null, 2));
console.log('Generated package.json file in dist folder.');
