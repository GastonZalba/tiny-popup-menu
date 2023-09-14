import postcss from 'rollup-plugin-postcss';
import typescript from '@rollup/plugin-typescript';
import del from 'rollup-plugin-delete';
import path from 'path';
import copy from 'rollup-plugin-copy';
import banner2 from 'rollup-plugin-banner2'
import svg from 'rollup-plugin-svg-import';
import { readFileSync } from 'fs';
const pkg = JSON.parse(readFileSync('./package.json', 'utf8'));

const banner =
`/*!
 * ${pkg.name} - v${pkg.version}
 * ${pkg.homepage}
 * Built: ${new Date()}
*/
`;

export default {
    input: 'src/tiny-popup-menu.tsx',
    output: [
        {
            dir: 'lib',
            format: 'es',
            sourcemap: true
        }
    ],
    plugins: [
        banner2(() => banner),
        del({ targets: 'lib/*' }),
        typescript({
            outDir: 'lib',
            declarationMap: true,
            declarationDir: 'lib',
            outputToFilesystem: true
        }),
        svg(),
        postcss({
            extensions: ['.css', '.sass', '.scss'], 
            inject: false,
            extract: path.resolve('lib/style/css/tiny-popup-menu.css'),
            config: {
                path: './postcss.config.cjs',
                ctx: {
                    isDev: false
                }
            }
        }),
        copy({
            targets: [
                { src: 'src/assets/scss', dest: 'lib/style' }
            ]
        }),
    ],
    external: id => !(path.isAbsolute(id) || id.startsWith("."))
};