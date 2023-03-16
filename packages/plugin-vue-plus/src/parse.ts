import * as ts from 'typescript';
import type { CallExpression, NamedImports } from 'typescript';

const lifecycleHook = [
  'onMounted',
  'onUpdated',
  'onUnmounted',
  'onBeforeMount',
  'onBeforeUpdate',
  'onBeforeUnmount',
  'onErrorCaptured',
  'onRenderTracked',
  'onRenderTriggered',
  'onActivated',
  'onDeactivated',
  'onServerPrefetch',
];

function visit(node: ts.Node, output: any) {
  if (ts.isClassDeclaration(node)) {
    output['class'] = node.name!!.getText();
    node.members.forEach((member) => {
      if (ts.isPropertyDeclaration(member)) {
        if (!member.modifiers || member.modifiers?.some((modifier) => modifier.kind === ts.SyntaxKind.PublicKeyword)) {
          const propertyName = member.name.getText();
          const propertyValue = member.initializer?.getText() ?? 'undefined';
          output.properties.push({ name: propertyName, value: propertyValue });
        }
      } else if (ts.isMethodDeclaration(member)) {
        if (!member.modifiers || member.modifiers?.some((modifier) => modifier.kind === ts.SyntaxKind.PublicKeyword)) {
          // 收集 public 方法的信息
          const methodInfo: any = { params: [], name: '' };
          console.log(member.parameters);
          member.parameters.forEach((param) => {
            return methodInfo.params.push(param.name!!.getText());
          });
          const name = member.name!!.getText();
          if (lifecycleHook.includes(name)) {
            output.lifecycleHook.push({
              name,
              params: methodInfo.params,
            });
          } else {
            output.methods.push({
              name,
              params: methodInfo.params,
            });
          }
        }
      } else if (ts.isConstructorDeclaration(member)) {
        output.paramTypes = member.parameters
          .map((param) => {
            const decorators = ts.canHaveDecorators(param) ? ts.getDecorators(param) : undefined;

            if (!decorators) {
              return param.type!!.getText();
            }

            const decoratorList: any[] = [];
            const first = decorators[0];
            const last = decorators[decorators.length - 1];

            const start = first.getStart(node.getSourceFile());
            // @ts-ignore
            const end = last.end + 1;

            output['updateMeta'].push({
              start,
              end,
              action: 'del',
            });

            const allow = ['Inject', 'Host', 'SkipSelf', 'Self', 'Optional'];
            const flagMap: any = {
              Inject: {},
              Host: { host: true },
              SkipSelf: { skipSelf: true },
              Self: { self: true },
              Optional: { optional: true },
            };

            let token = '';

            decorators.forEach((de) => {
              const expression = (de.expression as CallExpression).expression;
              const name = expression.getText();

              if (!allow.includes(name)) {
                return;
              }

              if (name === 'Inject') {
                token = (de.expression as CallExpression).arguments[0].getText();
              }

              decoratorList.push({
                name: (de.expression as CallExpression).expression.getText(),
                flag: flagMap[name],
              });
            });

            if (!token || !decoratorList.some((value) => value.name === 'Inject')) {
              token = param.type!!.getText();
            }

            return `{
                        token: ${token},
                        injectOptions: ${JSON.stringify(
                          decoratorList.reduce(
                            (previousValue, currentValue) => Object.assign(previousValue, currentValue.flag),
                            {},
                          ),
                        )}
                    }`;
          })
          .filter((value) => !!value);
      }
    });
    // 找到@Component装饰器
    const decorators = ts.canHaveDecorators(node) ? ts.getDecorators(node) : undefined;
    const componentDecorator = decorators?.find((decorator) => {
      // @ts-ignore
      const identifier = decorator.expression?.expression;
      return identifier.escapedText === 'Component';
    }) as ts.Decorator;

    if (componentDecorator) {
      // 获取@Component装饰器的参数
      const [arg] = (componentDecorator.expression as CallExpression).arguments;

      if (ts.isObjectLiteralExpression(arg)) {
        const sourceCode = node.getSourceFile().getText();
        console.log(22, sourceCode);
        // 获取 @Component 装饰器的参数
        const args = (componentDecorator.expression as ts.CallExpression).arguments;
        if (args.length === 1) {
          // const options = args[0] as ts.ObjectLiteralExpression

          // 将 @Component 装饰器替换为空字符串
          const start = componentDecorator.getStart(node.getSourceFile());
          // @ts-ignore
          const end = node.modifiers.end;
          // const prefix = sourceCode.slice(0, start)
          // const suffix = sourceCode.slice(end)
          // const newSourceCode = prefix + ' ' + suffix

          output['updateMeta'].push({
            start,
            end,
            action: 'del',
          });

          // output['newSourceCode'] = newSourceCode
          // console.log('newSourceCode', newSourceCode)
        } else {
          console.error(`Failed to find @Component decorator options in "${sourceCode}"`);
        }
        // 获取template、selector和styleUrls
        arg.properties.forEach((prop) => {
          if (ts.isPropertyAssignment(prop)) {
            const name = prop.name.getText();
            const value = prop.initializer.getText().slice(1, -1); // 去掉引号
            switch (name) {
              case 'template':
                output['template'] = value;
                break;
              case 'templateUrl':
                output['templateUrl'] = value;
                break;
              case 'selector':
                output['selector'] = value;
                break;
              case 'styleUrls':
                if (ts.isArrayLiteralExpression(prop.initializer)) {
                  output['styleUrls'] = prop.initializer.elements.map((e) => e.getText().slice(1, -1));
                }
                break;
              case 'styles':
                if (ts.isArrayLiteralExpression(prop.initializer)) {
                  output['styles'] = prop.initializer.elements.map((e) => e.getText().slice(1, -1));
                }
                break;
              case 'providers':
                if (ts.isArrayLiteralExpression(prop.initializer)) {
                  output['providers'] = prop.initializer.elements.map((element) => {
                    if (ts.isObjectLiteralExpression(element)) {
                      const provideNode = element.properties.find(
                        (prop) => ts.isIdentifier(prop.name!) && prop.name.escapedText === 'provide',
                      );
                      const useClassNode = element.properties.find(
                        (prop) => ts.isIdentifier(prop.name!) && prop.name.escapedText === 'useClass',
                      );
                      // @ts-ignore
                      if (
                        provideNode &&
                        ts.isIdentifier(provideNode.initializer) &&
                        useClassNode &&
                        ts.isIdentifier(useClassNode.initializer)
                      ) {
                        // @ts-ignore
                        return `{ provide: ${provideNode.initializer.escapedText}, useClass: ${useClassNode.initializer.escapedText} }`;
                      }
                    } else if (ts.isIdentifier(element)) {
                      return `${element.getText()}`;
                    }
                  });
                }
                break;
            }
          }
        });
      }
    }
  }
}

export function parseInjectable(node: ts.Node, output: any) {
  if (!ts.isClassDeclaration(node)) {
    return;
  }

  const end = node.end;
  const className = node.name!!.getText();
  let paramTypes: any[] = [];
  node.members.forEach((member) => {
    if (!ts.isConstructorDeclaration(member)) {
      return;
    }

    paramTypes = member.parameters
      .map((param) => {
        const decorators = ts.canHaveDecorators(param) ? ts.getDecorators(param) : undefined;

        if (!decorators) {
          return param.type!!.getText();
        }

        const decoratorList: any[] = [];
        const first = decorators[0];
        const last = decorators[decorators.length - 1];

        const start = first.getStart(node.getSourceFile());
        // @ts-ignore
        const end = last.end + 1;

        output['updateMeta'].push({
          start,
          end,
          action: 'del',
        });

        const allow = ['Inject', 'Host', 'SkipSelf', 'Self', 'Optional'];
        const flagMap: any = {
          Inject: {},
          Host: { host: true },
          SkipSelf: { skipSelf: true },
          Self: { self: true },
          Optional: { optional: true },
        };

        let token = '';

        decorators.forEach((de) => {
          const expression = (de.expression as CallExpression).expression;
          const name = expression.getText();

          if (!allow.includes(name)) {
            return;
          }

          if (name === 'Inject') {
            token = (de.expression as CallExpression).arguments[0].getText();
          }

          decoratorList.push({
            name: (de.expression as CallExpression).expression.getText(),
            flag: flagMap[name],
          });
        });

        if (!token || !decoratorList.some((value) => value.name === 'Inject')) {
          token = param.type!!.getText();
        }

        return token;
      })
      .filter((value) => !!value);

    // output.injectables.push({className, paramTypes, insertText, insertIndex: end})
  });

  const insertText = `\n;Object.defineProperty(${className}, '__decorator__', {
    value: {
        paramTypes: [${paramTypes.join(',')}],
    },
    configurable: false,
    writable: false,
    enumerable: false
})\nattachInjectableInjector(${className})`;
  output['updateMeta'].push({
    start: end,
    end: end + insertText.length,
    action: 'add',
    insertText,
  });
  output.needInjectableInjector = true;
}

function getNodeByDecorator(statements: ts.NodeArray<ts.Statement>, decoratorName: string): ts.Statement | undefined {
  return statements.find((node) => {
    if (!ts.isClassDeclaration(node)) {
      return;
    }
    const decorators = ts.canHaveDecorators(node) ? ts.getDecorators(node) : undefined;
    const componentDecorator = decorators?.find((decorator) => {
      // @ts-ignore
      const identifier = decorator.expression?.expression;
      return identifier.escapedText === decoratorName;
    }) as ts.Decorator;
    return !!componentDecorator;
  });
}
export function parse(code: string, output: any) {
  // if (!output.refs) {
  //     output.refs = []
  // }
  if (!output.properties) {
    output.properties = [];
  }
  if (!output.methods) {
    output.methods = [];
  }
  if (!output.lifecycleHook) {
    output.lifecycleHook = [];
  }
  if (!output.vueDepends) {
    output.vueDepends = [];
  }
  if (!output.diDepends) {
    output.diDepends = [];
  }
  if (!output.updateMeta) {
    output.updateMeta = [];
  }
  if (!output.paramTypes) {
    output.paramTypes = [];
  }
  const sourceFile = ts.createSourceFile('example.ts', code, ts.ScriptTarget.Latest, true);

  const classDeclaration = getNodeByDecorator(sourceFile.statements, 'Component');

  const dep = ['vue-plus', 'vue'];
  const appendDep = {
    'vue-plus': (d: string) => output.diDepends.push(d),
    vue: (d: string) => output.vueDepends.push(d),
  };
  sourceFile.statements.forEach((node) => {
    if (!ts.isImportDeclaration(node)) {
      return;
    }

    const text = node.moduleSpecifier.getText().replace(/"|'/g, '');

    if (!dep.includes(text)) {
      return;
    }

    const namedBindings = node.importClause?.namedBindings as NamedImports;

    if (!namedBindings) {
      return;
    }

    namedBindings.elements.forEach((element) => {
      // @ts-ignore
      appendDep[text](element.name.escapedText);
    });
  });
  classDeclaration && visit(classDeclaration, output);

  sourceFile.statements.forEach((s) => {
    const injectableDeclaration = getNodeByDecorator([s] as any, 'Injectable');

    injectableDeclaration && parseInjectable(injectableDeclaration, output);
  });

  output.updateMeta = output.updateMeta.sort((a: { start: number }, b: { start: number }) => a.start - b.start);

  if (!classDeclaration) {
    return;
  }

  let newSourceCode = classDeclaration.getSourceFile().getText();
  let deleteCount = 0;
  console.log(output.updateMeta);
  // @ts-ignore
  output.updateMeta.forEach(({ start, end, action, insertText }) => {
    if (action === 'del') {
      const prefix = newSourceCode.slice(0, start - deleteCount);
      const suffix = newSourceCode.slice(end - deleteCount);
      newSourceCode = prefix + ' ' + suffix;
      deleteCount += end - start - 1;
    } else if (action === 'add') {
      console.log('start - deleteCount', start - deleteCount, insertText);
      const tempCodes = newSourceCode.split('');
      tempCodes.splice(start - deleteCount, 0, insertText);
      newSourceCode = tempCodes.join('');
      deleteCount -= end - start;
    }
  });

  output['newSourceCode'] = newSourceCode;

  delete output.updateMeta;
  console.log(output);
}
