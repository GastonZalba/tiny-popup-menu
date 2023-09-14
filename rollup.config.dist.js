import resolve from '@rollup/plugin-node-resolve';
import terser from '@rollup/plugin-terser';
import postcss from 'rollup-plugin-postcss';
import typescript from '@rollup/plugin-typescript';
import del from 'rollup-plugin-delete';
import serve from 'rollup-plugin-serve';
import livereload from 'rollup-plugin-livereload';
import path from 'path';
import commonjs from '@rollup/plugin-commonjs';
import banner2 from 'rollup-plugin-banner2';
import svg from 'rollup-plugin-svg-import';
import { readFileSync } from 'fs';
const pkg = JSON.parse(readFileSync('./package.json', 'utf8'));

const banner = `/*!
 * ${pkg.name} - v${pkg.version}
 * ${pkg.homepage}
 * Built: ${new Date()}
*/
`;

const globals = (id) => {
    const globals = {
        myPragma: 'myPragma'
    };
    return globals[id];
};

export default function (commandOptions) {
    return [
        {
            input: 'src/index-umd.ts',
            output: [
                {
                    file: 'dist/tiny-popup-menu.js',
                    format: 'umd',
                    name: 'TinyPopupMenu',
                    globals: globals,
                    sourcemap: true
                },
                !commandOptions.dev && {
                    file: 'dist/tiny-popup-menu.min.js',
                    format: 'umd',
                    plugins: [terser()],
                    name: 'TinyPopupMenu',
                    globals: globals,
                    sourcemap: true
                }
            ],
            plugins: [
                banner2(() => banner),
                commonjs(),
                del({ targets: 'dist/*' }),
                typescript({
                    outDir: 'dist',
                    declarationDir: 'dist',
                    outputToFilesystem: true
                }),
                svg(),
                resolve(),
                postcss({
                    extensions: ['.css', '.sass', '.scss'],
                    inject: commandOptions.dev,
                    minimize: !commandOptions.dev,
                    extract: !commandOptions.dev
                        ? path.resolve('dist/css/tiny-popup-menu.css')
                        : false,
                    config: {
                        path: './postcss.config.cjs',
                        ctx: {
                            isDev: commandOptions.dev
                        }
                    }
                }),
                commandOptions.dev &&
                    serve({
                        open: false,
                        verbose: true,
                        contentBase: ['', 'examples'],
                        historyApiFallback: `/${
                            commandOptions.example || 'basic'
                        }.html`,
                        host: 'localhost',
                        port: 3001,
                        // execute function after server has begun listening
                        onListening: function (server) {
                            const address = server.address();
                            // by using a bound function, we can access options as `this`
                            const protocol = this.https ? 'https' : 'http';
                            console.log(
                                `Server listening at ${protocol}://localhost:${address.port}/`
                            );
                        }
                    }),
                commandOptions.dev &&
                    livereload({
                        watch: ['dist'],
                        delay: 500
                    })
            ]
        },
        ...(commandOptions.dev
            ? []
            : // Minified css
              [
                  {
                      input: path.resolve('dist/css/tiny-popup-menu.css'),
                      plugins: [
                          postcss({
                              extract: true,
                              minimize: true,
                              config: {
                                  path: './postcss.config.cjs',
                                  ctx: {
                                      isDev: commandOptions.dev
                                  }
                              }
                          })
                      ],
                      output: {
                          file: path.resolve('dist/css/tiny-popup-menu.min.css')
                      },
                      onwarn(warning, warn) {
                          if (warning.code === 'FILE_NAME_CONFLICT') return;
                          warn(warning);
                      }
                  }
              ])
    ];
}
