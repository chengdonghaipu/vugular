const typescript = require("rollup-plugin-typescript2")

exports.default = [
    {
        input: 'src/index.ts',
        output: [
            {
                file: 'dist/esm2020/index.mjs',
                format: 'esm',
            },
            {
                file: 'dist/esm2020/index.cjs',
                format: 'cjs',
            },
            // {
            //     file: 'dist/index.es2017.js',
            //     format: 'es',
            // },
            // {
            //     file: 'dist/index.es2020.js',
            //     format: 'es',
            //     // 指定 es2020 格式输出的类型声明文件
            //     banner: `/* eslint-disable */`,
            //     footer: `export * from './types';`,
            // },
            // {
            //     file: 'dist/index.d.ts',
            //     format: 'es',
            //     // 将所有导出的类型都放在一个类型声明文件中
            //     inlineDynamicImports: true,
            // },
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
                file: 'dist/esm2017/index.mjs',
                format: 'esm',
            },
            {
                file: 'dist/esm2017/index.cjs',
                format: 'cjs',
            },
        ],
        plugins: [
            typescript({
                tsconfig: 'tsconfig.json',
                tsconfigOverride: {
                    compilerOptions: {
                        target: 'ES2017',
                        module: 'es2020',
                        declaration: true,
                        declarationMap: true,
                        declarationDir: "./index.d.ts",
                    },
                },
            }),
        ],
    },
];
