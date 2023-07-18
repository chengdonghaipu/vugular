import { Compiler } from './compiler';
import fs from 'fs';
import { writeFile } from 'fs/promises';
import MagicString from 'magic-string';
import { parse } from '@babel/parser';
const template = require('@babel/template').default;
const generator = require('@babel/generator');
const t = require('@babel/types');
import traverse from '@babel/traverse';

export function angularPlugin() {
  const componentFileRegex = /\.(xvue\.ts)$/;
  const injectableFileRegex = /\.(ts)$/;

  return {
    name: 'angular-plugin',
    enforce: 'pre',
    async transform(code: string, id: string) {
      if (componentFileRegex.test(id)) {
        // console.log(code);
        const newCode = new Compiler(id, code).generate();
        const tempFilePath = `${id}.vue`;
        await writeFile(tempFilePath, newCode.code, 'utf-8');
        // const code1 = fs.readFileSync(`${id}.vue`).toString();
        return {
          code: newCode.code,
          map: newCode.map,
          // map: sourceMap.toString()
        };
      } else if (injectableFileRegex.test(id)) {
        if (!code.includes('@Injectable') && !code.includes('@State')) {
          return;
        }

        const newCode = new Compiler(id, code).generate();

        if (!newCode) {
          return;
        }

        return {
          code: newCode.code,
          map: newCode.map,
          // map: sourceMap.toString()
        };
      }
    },
  };
}
