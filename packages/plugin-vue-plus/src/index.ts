import { Compiler } from './compiler';

export function angularPlugin() {
  const componentFileRegex = /\.(xvue)$/;
  const injectableFileRegex = /\.(ts)$/;
  return {
    name: 'angular-plugin',
    async transform(code: string, id: string) {
      if (componentFileRegex.test(id)) {
        const newCode = new Compiler(code).generate(id);

        // console.log(newCode);

        return {
          code: newCode,
          // map: sourceMap.toString()
        };
      } else if (injectableFileRegex.test(id)) {
        if (!code.includes('@Injectable')) {
          return;
        }

        const newCode = new Compiler(code).generate(id);

        if (!newCode) {
          return;
        }

        return {
          code: newCode,
          // map: sourceMap.toString()
        };
      }
    },
  };
}
