import { Compiler } from './compiler';
import fs from "fs";
import { writeFile } from 'fs/promises';
import MagicString from 'magic-string';
import { parse } from "@babel/parser";
const template = require('@babel/template').default;
const generator = require('@babel/generator')
const t = require('@babel/types');
import traverse from "@babel/traverse";

function transformAST(ast, code) {
  // 在 AST 上进行相应的转换操作
  // 这里给出的示例是直接替换 class 的内容
  traverse(ast, {
    Program(path) {
      // 在顶层作用域插入模板代码
      const templateCode = `<template>
  <div class="greetings">
     greetings
  </div>
</template>\n`;
      const templateAst = parse(templateCode, {
        sourceType: 'module',
        plugins: ['jsx'],
      });
      path.node.body.unshift(...templateAst.program.body);
    },
    ClassDeclaration(path) {
      const { node, parent } = path;
      if (node.id.name === 'AngularTest') {

        const scriptCode = `
          class AngularTest {
            onMounted(): void {
              console.log('onMounted');
            }
          }

          const component = new AngularTest();
          component.onMounted();
        `;

        const scriptAst = parse(scriptCode, {
          sourceType: 'module',
          plugins: ['typescript'],
        }).program.body;

        // 创建 <script> 标签的 BlockStatement
        const scriptBlock = t.blockStatement(scriptAst);

        // 创建 <script> 标签的 FunctionDeclaration
        // const scriptFunction = t.functionDeclaration(
        //   t.identifier('setup'),
        //   [],
        //   scriptBlock
        // );
        // const scriptFunctionExpression = t.functionExpression(
        //   scriptFunction.id,
        //   scriptFunction.params,
        //   scriptFunction.body
        // );
        // 创建 <script> 标签的 JSXText
        const scriptJSXText = t.jsxText('');
        const scriptFunction = t.functionDeclaration(
          t.identifier('scriptContent'),
          [],
          t.blockStatement(scriptAst)
        );
        const scriptFunctionExpression = t.functionExpression(
          scriptFunction.id,
          scriptFunction.params,
          scriptFunction.body
        );
        // const scriptBlockExpression = t.blockExpression([scriptBlock]);
        const scriptExpressionContainer = t.jsxExpressionContainer(scriptFunctionExpression);
        // 创建 <script> 标签的 JSXOpeningElement
        const scriptOpeningElement = t.jsxOpeningElement(t.jsxIdentifier('script'), [
          t.jsxAttribute(t.jsxIdentifier('lang'), t.stringLiteral('ts')),
          t.jsxAttribute(t.jsxIdentifier('setup'))
        ]);

        // 创建 <script> 标签的 JSXClosingElement
        const scriptClosingElement = t.jsxClosingElement(t.jsxIdentifier('script'));

        // 创建 <script> 标签的 JSXElement
        const scriptElement = t.jsxElement(
          scriptOpeningElement,
          scriptClosingElement,
          [scriptExpressionContainer],
          false
        );

        // path.replaceWithMultiple([scriptElement]);
        parent.body.splice(parent.body.indexOf(node), 1, scriptElement);
      }
      // if (node.id.name === 'AngularTest') {
      //   const transformedClassCode = `
      //     onMounted(): void {
      //       console.log('onMounted');
      //     }
      //   `;
      //   const transformedClassAst = parse(transformedClassCode, {
      //     sourceType: 'module',
      //     plugins: ['typescript'],
      //   });
      //   node.body = transformedClassAst.program.body;
      // }
    },
  });

  return ast;
}


export function angularPlugin() {
  const componentFileRegex = /\.(xvue\.ts)$/;
  const injectableFileRegex = /\.(ts)$/;

  return {
    name: 'angular-plugin',
    // enforce: 'pre',
    async transform(code: string, id: string, opt) {
      if (componentFileRegex.test(id)) {
        /*if (id.includes("test.xvue.ts")) {
          console.log(code);
          const code1 = fs.readFileSync(id).toString();
          const s = new MagicString(code1);
          // const classIndex = code.indexOf('class AngularTest');
          //
          // if (classIndex !== -1) {
          //   const t = '<template>\n  <div class="greetings">\n    greetings\n  </div>\n</template>\n'
          //   s.prepend('<template>\n  <div class="greetings">\n    greetings\n  </div>\n</template>\n');
          //   s.appendLeft(0, '<script setup lang="ts">\n');
          //   s.append('\nconst component = new AngularTest();\ncomponent.onMounted()\n</script>');
          //   s.prepend('/!*@__PURE__*!/');
          //   // 生成转换后的代码和 sourcemap
          //   const transformedCode = s.toString();
          //   const sourcemap = s.generateMap({
          //     source: id,
          //     hires: true,
          //   });
          //
          //   const tempFilePath = `${id}.vue`;
          //   await writeFile(tempFilePath, s.toString(), 'utf-8');
          //   return {
          //     code: transformedCode,
          //     map: sourcemap
          //   }
          // }
          /!*const ast = parse(code1, {
            sourceType: 'module',
            plugins: ['typescript'],
          });

          const code2 = `
  <template>
    <div class="greetings">
      greetings
    </div>
  </template>
  <script lang="ts" setup>
    // 在这里插入代码
  </script>
`;
// 创建要插入的代码
          const scriptCode = `class AngularTest {
  onMounted(): void {
    console.log('onMounted');
  }
}
const component = new AngularTest();
component.onMounted();`;
          console.log("11331");
          const ast1 = parse(code2, {
            sourceType: 'module',
            plugins: ['jsx'],
          });
          console.log("111");
// 将代码解析为 AST
          const scriptAst = parse(scriptCode, {
            sourceType: 'module',
            plugins: ['typescript'],
          }).program.body;
          // const scriptExpressionContainer = t.jsxExpressionContainer(scriptAst[0]);
          traverse(ast1, {
            JSXElement(path) {
              if (path.node.openingElement.name.name === 'script') {
                path.node.children.push(scriptAst);
              }
            },
          });
          // const transformedAst = transformAST(ast, code1);

          const { code: transformedCode, map: transformedMap } = generator.default(ast1, {
            sourceMaps: true,
            sourceFileName: id,
          });
          const tempFilePath = `${id}.vue`;
          await writeFile(tempFilePath, transformedCode, 'utf-8');
          return {
            code: transformedCode,
            map: transformedMap,
          };*!/
          s.prepend(`<template>
  <div class="greetings">
    greetings
  </div>
</template>\n<script setup lang="ts">\n`,
          ).append(`const component = new AngularTest();\ncomponent.onMounted()\n</script><style scoped lang="less"></style>`);
          console.log(s.toString());
          const map = s.generateMap({
            source: id,
            hires: true,
            // includeContent: true
          });
          const tempFilePath = `${id}.vue`;
          await writeFile(tempFilePath, s.toString(), 'utf-8');
          return {
            code: s.toString(),
            map
          }
          return
        }*/
        // console.log(code);
        const newCode = new Compiler(id, code).generate();
        const tempFilePath = `${id}.vue`;
        await writeFile(tempFilePath, newCode.code, 'utf-8');
        // const code1 = fs.readFileSync(`${id}.vue`).toString();
        return {
          code: newCode.code,
          map: newCode.map
          // map: sourceMap.toString()
        };
      } else if (injectableFileRegex.test(id)) {
        if (!code.includes('@Injectable')) {
          return;
        }

        const newCode = new Compiler(id, code).generate();

        if (!newCode) {
          return;
        }

        return {
          code: newCode.code,
          map: newCode.map
          // map: sourceMap.toString()
        };
      }
    },
  };
}
