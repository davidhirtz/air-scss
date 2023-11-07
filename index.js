import chokidar from "chokidar";
import fs from "fs";
import {PurgeCSS} from 'purgecss';

/**
 * Runs PurgeCSS on `options.css` files for the given content files and writes the result to the output file.
 *
 * @param options.content {Array}
 * @param options.css {Array} default: ['../npm/src/air-scss/css/utilities.css']
 * @param options.output {String}
 * @param options.watch {Boolean}
 *
 * @returns {Promise<void>}
 */
export default (options) => {
    options.css ??= ['node_modules/air-scss/css/utilities.css'];
    options.watch ??= process.argv.slice(2).includes('--watch');

    if (!fs.existsSync(options.output)) {
        fs.writeFileSync(options.output, '');
        console.log(`Created output file ${options.output}`);
    }

    let cssContent = fs.readFileSync(options.output, 'utf8');

    const purge = async () => {
        const startTime = Date.now();

        // noinspection JSUnresolvedReference
        const result = await new PurgeCSS().purge({
            css: options.css,
            content: options.content,
        })

        let purgedCssContent = '';
        result.forEach((result) => purgedCssContent += result.css)

        if (purgedCssContent !== cssContent) {
            fs.writeFile(options.output, purgedCssContent, () => {
                console.log(`Rebuild ${options.output} in ${Date.now() - startTime}ms`);
                cssContent = purgedCssContent;
            });
        }
    }

    if (options.watch) {
        let isRunning = true;

        chokidar.watch(options.content).on('all', () => {
            if (!isRunning) {
                purge().then(() => setTimeout(() => isRunning = false, 100));
                isRunning = true;
            }
        });

        return purge().then(() => isRunning = false);
    }

    return purge();
}
