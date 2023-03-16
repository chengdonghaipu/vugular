// eslint-disable-next-line no-undef
const ts = require('typescript');
// eslint-disable-next-line no-undef
// const { CallExpression } = require('typescript');

function visit(node, output) {
    if (ts.isClassDeclaration(node)) {
        console.log('isClassDeclaration');
        // 找到@Component装饰器
        const decorators = ts.canHaveDecorators(node) ? ts.getDecorators(node) : undefined;
        const componentDecorator = decorators?.find((decorator) => {
            const identifier = decorator.expression?.expression;
            console.log(identifier.text);
            return identifier.escapedText === 'Component';
        });
        console.log(`componentDecorator: ${decorators}  ${!!componentDecorator}`);
        if (componentDecorator) {
            console.log(componentDecorator.expression);
            // 获取@Component装饰器的参数
            const [arg] = (componentDecorator.expression).arguments;
            console.log(`arg11: ${arg}`);
            if (ts.isObjectLiteralExpression(arg)) {
                // 获取template、selector和styleUrls
                arg.properties.forEach((prop) => {
                    if (ts.isPropertyAssignment(prop)) {
                        const name = prop.name.getText();
                        const value = prop.initializer.getText().slice(1, -1); // 去掉引号
                        switch (name) {
                            case 'template':
                                output['template'] = value;
                                break;
                            case 'selector':
                                output['selector'] = value;
                                break;
                            case 'styleUrls':
                                if (ts.isArrayLiteralExpression(prop.initializer)) {
                                    output['styleUrls'] = prop.initializer.elements.map((e) =>
                                        e.getText().slice(1, -1)
                                    );
                                }
                                break;
                        }
                    }
                });
            }
        }
    }

    // 遍历子节点
    node.forEachChild((node1) => visit(node1, output));
}

function parse(code) {
    const sourceFile = ts.createSourceFile('example.ts', code, ts.ScriptTarget.Latest, true);
    console.log(code);
    const output = {};
    visit(sourceFile, output);
    console.log(output);
}

parse(`
import {Component} from "@/angular/core/component";

@Component({
    template: \`<div>ff</div>\`,
    selector: '',
    styleUrls: []
})
export default class AngularDemo {}
`);
