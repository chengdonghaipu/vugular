import path from "path";
import {readFile} from "fs/promises";
import {readFileSync} from "fs";
import {parse} from "./parse";

function getTemplate(template: string) {
    return `
    <template>${template}</template>
    `
}
function getScript(template: string) {
    return `
    <script setup lang="ts">${template}</script>
    `
}
function getStyle(template: string, lang: string) {
    return `
    <style scoped lang="${lang}">${template}</style>
    `
}


export function angularPlugin() {
    const fileRegex = /\.(xvue)$/
    return {
        name: 'angular-plugin',
        async transform(code: string, id: string) {
            if (!fileRegex.test(id)) {
                return
            }
            const mate: any = {}
            parse(code, mate)
            if (mate['template'] && mate['templateUrl']) {
                throw Error('')
            }
            // return {code: '<template></template>'}
            const styles = []
            if (!mate['template']) {
                if (mate['templateUrl']) {
                    const basePath = path.dirname(id)
                    const url = path.resolve(basePath, mate['templateUrl'])
                    console.log(url, basePath);
                    mate['template'] = await readFile(url)
                } else {
                    mate['template'] = ''
                }
            }
            if (mate['styles']) {
                styles.push(...mate['styles'])
            }
            // console.log('rrrrr', path.extname(id))
            let cssLessType = 'css'
            if (mate['styleUrls']) {
                // cssLessType
                styles.push(...mate['styleUrls'].map((v: string) => {
                    const basePath = path.dirname(id)
                    const url = path.resolve(basePath, v)
                    cssLessType = path.extname(url).replace('.', '')
                    return readFileSync(url).toString()
                }))
            }
            const template = mate['template']
            const script: string[] = []

            if (mate['lifecycleHook']) {
                const unImports: string[] = []

                mate['lifecycleHook'].forEach((value: { name: string; }) => {
                    const {name} = value
                    if (mate.vueDepends.includes(name)) {
                        return
                    }

                    unImports.push(name)
                })

                if (unImports.length) {
                    script.unshift(`\nimport { ${unImports.join(', ')} } from 'vue'`)
                }
            }

            const unImports = []

            if (!mate.diDepends.includes('attachInjector')) {
                unImports.push('attachInjector')
            }

            if (mate.needInjectableInjector && !mate.diDepends.includes('attachInjectableInjector')) {
                unImports.push('attachInjectableInjector')
            }

            if (unImports.length) {
                script.unshift(`\nimport { ${unImports.join(', ')} } from 'vue-plus'`)
            }

            if (mate['newSourceCode']) {
                script.push(`\n${mate['newSourceCode']}`)
            }

            script.push(`\nObject.defineProperty(${mate['class']}, '__decorator__', {
    value: {
        providers: [
            ${mate['providers'].join(',')}
        ],
        paramTypes: [${mate['paramTypes'].join(',')}],
    },
    configurable: false,
    writable: false,
    enumerable: false
})`)

            if (mate['class']) {
                script.push(`\nconst component = attachInjector(${mate['class']})`)
            }

            const exposed: string[] = []

            if (mate['properties']) {
                mate['properties'].forEach((value: { name: string; }) => {
                    exposed.push(value.name)
                })
            }

            if (mate['methods']) {
                mate['methods'].forEach((value: { name: string; }) => {
                    exposed.push(value.name)
                })
            }

            if (mate['lifecycleHook']) {
                exposed.push(...mate['lifecycleHook'].map((value: { name: any; }) => `${value.name}: $$${value.name}`))
            }

            if (exposed.length) {
                script.push(`\nconst { ${exposed.join(', ')} } = component`)
            }

            mate['lifecycleHook'].forEach((value: { name: string; }) => {
                script.push(`\n${value.name}($$${value.name}.bind(component))`)
            });
            console.log({
                code: `${getTemplate(template)} \n ${getScript(script.join(''))}\n ${getStyle(styles.join(''), cssLessType)}\n`
            })

            return {
                code: `${getTemplate(template)} \n ${getScript(script.join(''))}\n ${getStyle(styles.join(''), cssLessType)}\n`,
                // map: sourceMap.toString()
            }
        }
    }
}
