const typescript = require("rollup-plugin-typescript2")

exports.default = [
    {
        input: 'src/index.ts',
        output: [
            {
                file: 'dist/esm2020/index.mjs',
                format: 'esm',
            },
        ],
        plugins: [
            typescript({
                tsconfig: 'tsconfig.json',
                tsconfigOverride: {
                    compilerOptions: {
                        target: 'ES2020',
                        module: 'ES2020',
                        declaration: false,
                    },
                },
            }),
        ],
    },
    {
        input: 'src/index.ts',
        output: [
            {
                file: 'dist/esm2015/index.mjs',
                format: 'esm',
            },
        ],
        plugins: [
            typescript({
                tsconfig: 'tsconfig.json',
                tsconfigOverride: {
                    compilerOptions: {
                        target: 'ES2015',
                        module: 'ES2015',
                        declaration: true,
                        declarationMap: true,
                        declarationDir: "./index.d.ts",
                    },
                },
            }),
        ],
    },
];
