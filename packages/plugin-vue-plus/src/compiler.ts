import * as ts from "typescript";
import { CallExpression, NamedImports, StringLiteral } from "typescript";
import path from "path";
import { readFileSync } from "fs";
import * as fs from "fs";
import { parse as vueTemplateParse, RootNode, TemplateChildNode } from "@vue/compiler-dom";

const lifecycleHook = [
  "onMounted",
  "onUpdated",
  "onUnmounted",
  "onBeforeMount",
  "onBeforeUpdate",
  "onBeforeUnmount",
  "onErrorCaptured",
  "onRenderTracked",
  "onRenderTriggered",
  "onActivated",
  "onDeactivated",
  "onServerPrefetch"
];

function getTemplate(template: string) {
  return `
    <template>${template}</template>
    `;
}

function getScript(template: string) {
  return `
    <script setup lang="ts">${template}</script>
    `;
}

function getStyle(template: string, lang: string) {
  return `
    <style scoped lang="${lang}">${template}</style>
    `;
}

export class Compiler {
  private readonly sourceFile!: ts.SourceFile;
  properties: { name: string; value: string }[] = [];
  methods: { name: string; params: any }[] = [];
  lifecycleHook: { name: string; params: any }[] = [];
  vueDepends: string[] = [];
  diDepends: string[] = [];
  updateMeta: any[] = [];
  paramTypes: any[] = [];
  template = "";
  componentName = "";
  templateUrl = "";
  selector = "";
  newSourceCode = "";
  finalSourceCode = "";
  styleUrls: string[] = [];
  styles: string[] = [];
  providers: any[] = [];
  needInjectableInjector = false;
  inputs: any[] = [];
  outputs: any[] = [];
  models: any[] = [];

  static getDecorator(decorators: readonly ts.Decorator[], decoratorName: string): ts.Decorator | undefined {
    return decorators?.find((decorator) => {
      const identifier = (decorator.expression as any)?.expression;
      return identifier.escapedText === decoratorName;
    }) as ts.Decorator;
  }

  static hasDecoratorByName(statement: ts.Statement, decoratorName: string): boolean {
    if (!ts.isClassDeclaration(statement)) {
      return false;
    }

    const decorators = ts.canHaveDecorators(statement) ? ts.getDecorators(statement) : undefined;
    const componentDecorator = decorators && Compiler.getDecorator(decorators, decoratorName);

    return !!componentDecorator;
  }

  get meta() {
    return {
      properties: this.properties,
      methods: this.methods,
      lifecycleHook: this.lifecycleHook,
      vueDepends: this.vueDepends,
      diDepends: this.diDepends,
      updateMeta: this.updateMeta,
      paramTypes: this.paramTypes,
      template: this.template,
      templateUrl: this.templateUrl,
      selector: this.selector,
      newSourceCode: this.newSourceCode,
      styleUrls: this.styleUrls,
      styles: this.styles,
      providers: this.providers,
      componentName: this.componentName,
      needInjectableInjector: this.needInjectableInjector,
      inputs: this.inputs,
      outputs: this.outputs,
      models: this.models
    };
  }

  private collectDependencies(statements: ts.NodeArray<ts.Statement>) {
    const dep = ["vue-plus", "vue"];
    const appendDep = {
      "vue-plus": (d: string) => this.diDepends.push(d),
      vue: (d: string) => this.vueDepends.push(d)
    };

    for (const statement of statements) {
      if (!ts.isImportDeclaration(statement)) {
        continue;
      }

      const text = statement.moduleSpecifier.getText().replace(/"|'/g, "");

      if (!dep.includes(text)) {
        continue;
      }

      const namedBindings = statement.importClause?.namedBindings as NamedImports;

      if (!namedBindings) {
        continue;
      }

      namedBindings.elements.forEach((element) => {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        appendDep[text](element.name.escapedText);
      });
    }
  }

  private parseParamTypes(parameters: ts.NodeArray<ts.ParameterDeclaration>, onlyOptional = false): string[] {
    return parameters
      .map((param) => {
        const decorators = ts.canHaveDecorators(param) ? ts.getDecorators(param) : undefined;

        if (!decorators) {
          return param.type!.getText();
        }

        const decoratorList: any[] = [];
        const first = decorators[0];
        const last = decorators[decorators.length - 1];

        const start = first.getStart(this.sourceFile);
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        const end = last.end + 1;

        this.updateMeta.push({
          start,
          end,
          action: "del"
        });

        const allow = ["Inject", "Host", "SkipSelf", "Self", "Optional"];
        const flagMap: any = {
          Inject: {},
          Host: { host: true },
          SkipSelf: { skipSelf: true },
          Self: { self: true },
          Optional: { optional: true }
        };

        let token = "";

        decorators.forEach((de) => {
          const expression = (de.expression as CallExpression).expression;
          const name = expression.getText();

          if (!allow.includes(name)) {
            return;
          }

          if (name === "Inject") {
            token = (de.expression as CallExpression).arguments[0].getText();
          }

          decoratorList.push({
            name: (de.expression as CallExpression).expression.getText(),
            flag: flagMap[name]
          });
        });

        if (!token || !decoratorList.some((value) => value.name === "Inject")) {
          token = param.type!.getText();
        }

        let injectOptions = decoratorList.reduce(
          (previousValue, currentValue) => Object.assign(previousValue, currentValue.flag),
          {}
        );

        if (onlyOptional && injectOptions.optional) {
          injectOptions = { optional: true };
        }

        return `{
                        token: ${token},
                        injectOptions: ${JSON.stringify(injectOptions)}
                    }`;
      })
      .filter((value) => !!value);
  }

  private parseInjectable(node: ts.Statement) {
    if (!ts.isClassDeclaration(node)) {
      return;
    }
    const end = node.end;
    const className = node.name!.getText();
    let paramTypes: any[] = [];

    node.members.forEach((member) => {
      if (!ts.isConstructorDeclaration(member)) {
        return;
      }

      paramTypes = this.parseParamTypes(member.parameters, true);
    });

    const insertText = `\n;Object.defineProperty(${className}, '__decorator__', {
    value: {
        paramTypes: [${paramTypes.join(",")}],
    },
    configurable: false,
    writable: false,
    enumerable: false
})\nattachInjectableInjector(${className})`;
    this.updateMeta.push({
      start: end,
      end: end + insertText.length,
      action: "add",
      insertText
    });

    this.needInjectableInjector = true;
  }

  private parseModels(node: ts.PropertyDeclaration): any[] {
    const decorators = ts.canHaveDecorators(node) ? ts.getDecorators(node) : null;

    if (!decorators) {
      return [];
    }

    const modelDecorator = decorators && Compiler.getDecorator(decorators, "Model");

    if (!modelDecorator) {
      return [];
    }

    const meta: any = {
      name: node.name.getText(),
      param: "",
      modifiers: null,
      props: [],
      emit: ""
    };

    const [arg] = (modelDecorator.expression as CallExpression).arguments;

    if (arg && ts.SyntaxKind.StringLiteral === arg.kind) {
      // 参数
      meta.param = (arg as StringLiteral).text;
      meta.emit = `update:${meta.param}`;
      meta.props = [`${meta.param}`];
    } else {
      meta.emit = "update:modelValue";
      meta.props = ["modelValue"];
    }

    // const [p1] = (modelDecorator.expression as CallExpression).arguments;
    //
    // if (!p1 && !p2) {
    //   meta.emit = "update:modelValue";
    //   meta.props = ["modelValue"];
    // } else if (p1 && !p2) {
    //   const paramName = (p1 as CallExpression).expression.getText();
    //
    //   if (p1.kind === ts.SyntaxKind.CallExpression && paramName === "ModelParams") {
    //     const [arg] = (p1 as CallExpression).arguments;
    //
    //     if (arg && ts.SyntaxKind.StringLiteral === arg.kind) {
    //       meta.param = (arg as StringLiteral).text;
    //       meta.emit = `'update:${meta.param}`;
    //       meta.props = [`${meta.param}`];
    //     }
    //   } else if (p1.kind === ts.SyntaxKind.CallExpression && paramName === "ModelModifiers") {
    //     meta.emit = "update:modelValue";
    //     meta.props = ["modelValue", `modelModifiers`];
    //   }
    // } else if (p2 && !p1) {
    //
    // } else {
    //   // 既存在参数 又存在修饰符
    //   const paramName = (p1 as CallExpression).expression.getText();
    //
    //   if (p1.kind === ts.SyntaxKind.CallExpression && paramName === "ModelParams") {
    //     const [arg] = (p1 as CallExpression).arguments;
    //
    //     if (arg && ts.SyntaxKind.StringLiteral === arg.kind) {
    //       meta.param = (arg as StringLiteral).text;
    //       meta.emit = `update:${meta.param}`;
    //       meta.props = [`${meta.param}`, `${meta.param}Modifiers`];
    //     }
    //   }
    // }

    const propertyName = node.name.getText();
    const propertyValue = node.initializer?.getText() ?? "undefined";
    this.properties.push({ name: propertyName, value: propertyValue });

    if (meta.props.length) {
      return [meta];
    }

    new Errors("error");
    //
    return [];
  }

  private parseOutputs(node: ts.PropertyDeclaration): any[] {
    const decorators = ts.canHaveDecorators(node) ? ts.getDecorators(node) : null;

    if (!decorators) {
      return [];
    }

    const outputDecorator = decorators && Compiler.getDecorator(decorators, "Output");

    if (!outputDecorator) {
      return [];
    }

    const meta = {
      name: node.name.getText(),
      alias: node.name.getText()
    };

    const [arg] = (outputDecorator.expression as CallExpression).arguments;

    if (arg && ts.SyntaxKind.StringLiteral === arg.kind) {
      meta.alias = (arg as StringLiteral).text;
    }

    const propertyName = node.name.getText();
    const propertyValue = node.initializer?.getText() ?? "undefined";
    this.properties.push({ name: propertyName, value: propertyValue });

    return [meta];
  }

  private parseInputs(node: ts.PropertyDeclaration): any[] {
    const decorators = ts.canHaveDecorators(node) ? ts.getDecorators(node) : null;

    if (!decorators) {
      return [];
    }

    const inputDecorator = decorators && Compiler.getDecorator(decorators, "Input");

    if (!inputDecorator) {
      return [];
    }

    const meta = {
      required: false,
      type: "",
      name: node.name.getText(),
      alias: node.name.getText()
    };
    const [arg] = (inputDecorator.expression as CallExpression).arguments;

    if (arg && [ts.SyntaxKind.FalseKeyword, ts.SyntaxKind.TrueKeyword].includes(arg.kind)) {
      meta.required = ts.SyntaxKind.TrueKeyword === arg.kind;
    }

    if (arg && ts.SyntaxKind.StringLiteral === arg.kind) {
      meta.alias = (arg as StringLiteral).text;
    }

    if (node.type) {
      meta.type = node.type.getText();
      // const preType = node.type.kind === ts.SyntaxKind.TypeReference;
      //
      // if (preType) {
      //   meta.type = node.type.getText();
      // }
    }

    // if (node.initializer) {
    //
    // }
    const propertyName = node.name.getText();
    const propertyValue = node.initializer?.getText() ?? "undefined";
    this.properties.push({ name: propertyName, value: propertyValue });
    return [meta];
  }

  private parseComponent(node: ts.Statement) {
    if (!ts.isClassDeclaration(node)) {
      return;
    }
    this.componentName = node.name!.getText();
    for (const member of node.members) {
      if (ts.isPropertyDeclaration(member)) {
        this.inputs = [...this.inputs, ...this.parseInputs(member)];
        this.outputs = [...this.outputs, ...this.parseOutputs(member)];
        this.models = [...this.models, ...this.parseModels(member)];
        if (
          !(!member.modifiers || member.modifiers?.some((modifier) => modifier.kind === ts.SyntaxKind.PublicKeyword))
        ) {
          continue;
        }

        const propertyName = member.name.getText();
        const propertyValue = member.initializer?.getText() ?? "undefined";
        this.properties.push({ name: propertyName, value: propertyValue });
      } else if (ts.isMethodDeclaration(member)) {
        if (
          !(!member.modifiers || member.modifiers?.some((modifier) => modifier.kind === ts.SyntaxKind.PublicKeyword))
        ) {
          continue;
        }

        // 收集 public 方法的信息
        const methodInfo: any = { params: [], name: "" };
        // console.log(member.parameters)
        member.parameters.forEach((param) => {
          return methodInfo.params.push(param.name!.getText());
        });
        const name = member.name!.getText();
        if (lifecycleHook.includes(name)) {
          this.lifecycleHook.push({
            name,
            params: methodInfo.params
          });
        } else {
          this.methods.push({
            name,
            params: methodInfo.params
          });
        }
      } else if (ts.isConstructorDeclaration(member)) {
        this.paramTypes = this.parseParamTypes(member.parameters);
      }
    }

    const decorators = ts.canHaveDecorators(node) ? ts.getDecorators(node) : undefined;
    const componentDecorator = decorators && Compiler.getDecorator(decorators, "Component");

    if (!componentDecorator) {
      return;
    }
    // 获取@Component装饰器的参数
    const [arg] = (componentDecorator.expression as CallExpression).arguments;

    if (ts.isObjectLiteralExpression(arg)) {
      const sourceCode = this.sourceFile.getText();
      // 获取 @Component 装饰器的参数
      const args = (componentDecorator.expression as ts.CallExpression).arguments;

      if (args.length === 1) {
        // 将 @Component 装饰器替换为空字符串
        const start = componentDecorator.getStart(node.getSourceFile());

        const end = node.modifiers?.end;

        this.updateMeta.push({
          start,
          end,
          action: "del"
        });
      } else {
        console.error(`Failed to find @Component decorator options in "${sourceCode}"`);
      }

      // 获取template、selector和styleUrls
      arg.properties.forEach((prop) => {
        if (!ts.isPropertyAssignment(prop)) {
          return;
        }
        const name = prop.name.getText();
        const value = prop.initializer.getText().slice(1, -1); // 去掉引号

        switch (name) {
          case "template":
            this.template = value;
            break;
          case "templateUrl":
            this.templateUrl = value;
            break;
          case "selector":
            this.selector = value;
            break;
          case "styleUrls":
            if (ts.isArrayLiteralExpression(prop.initializer)) {
              this.styleUrls = prop.initializer.elements.map((e) => e.getText().slice(1, -1));
            }
            break;
          case "styles":
            if (ts.isArrayLiteralExpression(prop.initializer)) {
              this.styles = prop.initializer.elements.map((e) => e.getText().slice(1, -1));
            }
            break;
          case "providers":
            if (!ts.isArrayLiteralExpression(prop.initializer)) {
              break;
            }

            this.providers = prop.initializer.elements.map((element) => {
              if (ts.isObjectLiteralExpression(element)) {
                const provideNode: any = element.properties.find(
                  (prop) => ts.isIdentifier(prop.name!) && prop.name.escapedText === "provide"
                );
                const useClassNode: any = element.properties.find(
                  (prop) => ts.isIdentifier(prop.name!) && prop.name.escapedText === "useClass"
                );
                if (
                  provideNode &&
                  ts.isIdentifier(provideNode.initializer) &&
                  useClassNode &&
                  ts.isIdentifier(useClassNode.initializer)
                ) {
                  return `{ provide: ${provideNode.initializer.escapedText}, useClass: ${useClassNode.initializer.escapedText} }`;
                }
              } else if (ts.isIdentifier(element)) {
                return `${element.getText()}`;
              }
            });
            break;
        }
      });
    }
  }

  private forEachChild(node: RootNode | TemplateChildNode, callback: (node: TemplateChildNode) => void) {
    if ('children' in node && node.children && node.children?.length) {
      for (const child of node.children) {
        callback(child as TemplateChildNode);
        this.forEachChild(child as TemplateChildNode, callback);
      }
    }
  }

  private parseTemplate(template: string) {
    const rootNode = vueTemplateParse(template);
    const updateMeta: any[] = [];

    this.forEachChild(rootNode, (node: any) => {
      const props = node.props;

      if (props && props.length) {
        for (const prop of props) {
          if (prop.type === 7) {
            const exp = prop.exp;
            const start = exp.loc.start.offset;
            const end = exp.loc.end.offset;
            updateMeta.push({
              start,
              end,
              action: "update",
              insertText: `$$component$$.${exp.content}`,
              text: exp.content
            });
            continue;
          }
        }
      }

      if (node.type === 5) {
        const content = node.content;
        if (content.type === 4) {
          const start = content.loc.start.offset;
          const end = content.loc.end.offset;
          updateMeta.push({
            start,
            end,
            action: "update",
            insertText: `$$component$$.${content.content}`,
            text: content.content
          });

          return;
        }
        // console.log(node);
      }
    });

    const updateMeta_ = updateMeta.sort((a: { start: number }, b: { start: number }) => a.start - b.start);
    let newSourceCode = template;
    let offset = 0;

    updateMeta_.forEach(({ start, end, action, insertText, text }) => {
      if (action === "update") {
        const tempCodes = newSourceCode.split("");
        tempCodes.splice(start - offset, text.length, insertText);
        newSourceCode = tempCodes.join("");
        offset += text.length - insertText.length;
      }
    });

    this.template = newSourceCode;
  }

  private parse() {
    const statements = this.sourceFile.statements;

    this.collectDependencies(statements);
    const componentDeclaration = statements.find((value) => Compiler.hasDecoratorByName(value, "Component"));
    componentDeclaration && this.parseComponent(componentDeclaration);

    statements.forEach((s) => {
      const injectableDeclaration = Compiler.hasDecoratorByName(s, "Injectable");
      injectableDeclaration && this.parseInjectable(s);
    });

    this.updateMeta = this.updateMeta.sort((a: { start: number }, b: { start: number }) => a.start - b.start);

    let newSourceCode = this.sourceFile.getText();
    let deleteCount = 0;

    this.updateMeta.forEach(({ start, end, action, insertText }) => {
      if (action === "del") {
        const prefix = newSourceCode.slice(0, start - deleteCount);
        const suffix = newSourceCode.slice(end - deleteCount);
        newSourceCode = prefix + " " + suffix;
        deleteCount += end - start - 1;
      } else if (action === "add") {
        // console.log('start - deleteCount', start - deleteCount, insertText);
        const tempCodes = newSourceCode.split("");
        tempCodes.splice(start - deleteCount, 0, insertText);
        newSourceCode = tempCodes.join("");
        deleteCount -= end - start;
      }
    });

    this.newSourceCode = newSourceCode;

    this.parseTemplate(this.meta.template);

    console.log(this.meta);
  }

  generate(id: string): string {
    const newSourceCode = this.newSourceCode;
    const meta = this.meta;
    const { templateUrl, template, styles, styleUrls, lifecycleHook, providers, paramTypes, componentName } = meta;

    if (template && templateUrl) {
      throw Error("template, templateUrl must exist a");
    }

    if (!template) {
      if (templateUrl) {
        const basePath = path.dirname(id);
        const url = path.resolve(basePath, templateUrl);
        // console.log(url, basePath);
        this.template = readFileSync(url).toString();
      } else {
        this.template = "";
      }
    }

    const finalStyles = [];

    if (styles) {
      finalStyles.push(...styles);
    }

    let cssLessType = "css";

    if (styleUrls) {
      styleUrls.push(
        ...styleUrls.map((v: string) => {
          const basePath = path.dirname(id);
          const url = path.resolve(basePath, v);
          cssLessType = path.extname(url).replace(".", "");
          return readFileSync(url).toString();
        })
      );
    }

    const finalScript = [];
    const unDepImports: string[] = [];
    if (meta.inputs.length && !this.vueDepends.includes("defineProps")) {
      // unDepImports.push("defineProps")
    }

    if (lifecycleHook) {
      lifecycleHook.forEach((value: { name: string }) => {
        const { name } = value;
        if (this.vueDepends.includes(name)) {
          return;
        }

        unDepImports.push(name);
      });
    }

    if (unDepImports.length) {
      // console.log(unDepImports);
      finalScript.unshift(`\nimport { ${unDepImports.join(", ")} } from 'vue';`);
    }

    const unImports = [];

    if (!this.diDepends.includes("attachInjector")) {
      unImports.push("attachInjector");
    }

    if (this.needInjectableInjector && !this.diDepends.includes("attachInjectableInjector")) {
      unImports.push("attachInjectableInjector");
    }

    if (unImports.length) {
      finalScript.unshift(`\nimport { ${unImports.join(", ")} } from 'vue-plus';`);
    }

    if (meta.inputs.length || meta.models.length) {
      const propsList = meta.inputs
        .filter((v) => v.alias)
        .map((v) => v.alias)
        .concat(meta.models.filter((v) => v.props.length).map((v) => v.props[0]));
      if (propsList.length) {
        finalScript.push(`\nconst $props$ = defineProps(${JSON.stringify(propsList)});`);
      }
    }
    if (meta.outputs.length || meta.models.length) {
      const propsList = meta.outputs
        .filter((v) => v.alias)
        .map((v) => v.alias)
        .concat(meta.models.filter((v) => v.emit).map((v) => v.emit));
      if (propsList.length) {
        finalScript.push(`\nconst $emits$ = defineEmits(${JSON.stringify(propsList)});`);
      }
    }

    if (newSourceCode) {
      finalScript.push(`\n${newSourceCode}`);
    }

    finalScript.push(`\nObject.defineProperty(${componentName}, '__decorator__', {
    value: {
        providers: [
            ${providers.join(",")}
        ],
        paramTypes: [${paramTypes.join(",")}],
        outputs: ${JSON.stringify(meta.outputs)},
        inputs: ${JSON.stringify(meta.inputs)},
        models: ${JSON.stringify(meta.models)}
    },
    configurable: false,
    writable: false,
    enumerable: false
});`);
    if (componentName) {
      finalScript.push(`\nconst $$component$$ = attachInjector(${componentName});`);
    }
    if (meta.inputs.length) {
      // const propsList = meta.inputs
      //   .filter((v) => v.name)
      //   .map((v) => {
      //     return {
      //       name: v.name,
      //       alias: v.alias
      //     };
      //   });
      // if (propsList.length) {
      //   finalScript.push(
      //     `\n${JSON.stringify(
      //       propsList
      //     )}.filter(v => $props$[v.alias] !== undefined).forEach(v => $$component$$[v.name]=$props$[v.alias]);`
      //   );
      // }
    }
    const exposed: string[] = [];

    if (meta.properties) {
      meta.properties.forEach((value: { name: string }) => {
        exposed.push(value.name);
      });
    }

    if (meta.methods) {
      meta.methods.forEach((value: { name: string }) => {
        exposed.push(value.name);
      });
    }

    if (lifecycleHook) {
      exposed.push(...lifecycleHook.map((value: { name: any }) => `${value.name}: $$${value.name}`));
    }

    if (exposed.length) {
      finalScript.push(`\nconst { ${exposed.join(", ")} } = $$component$$;`);
      const defineExposes = meta.methods.map((v) => v.name).concat(meta.properties.map((v) => v.name));
      finalScript.push(`\ndefineExpose({${defineExposes.join(", ")}});`);
    }

    lifecycleHook.forEach((value: { name: string }) => {
      finalScript.push(`\n${value.name}($$${value.name}.bind($$component$$));`);
    });

    // console.log(template);

    this.finalSourceCode = `${getTemplate(template)} \n ${getScript(finalScript.join(""))}\n ${getStyle(
      finalStyles.join(""),
      cssLessType
    )}\n`;

    console.log(`${this.finalSourceCode}`);
    return this.finalSourceCode;
  }

  constructor(public id: string) {
    const code = fs.readFileSync(id).toString();
    this.sourceFile = ts.createSourceFile("example.ts", code, ts.ScriptTarget.Latest, true);
    this.parse();
  }
}
