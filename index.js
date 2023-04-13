import chokidar from "chokidar";
import fs from "fs";
import {PurgeCSS} from 'purgecss';

/**
 * @param options.content {Array}
 * @param options.css {Array}
 * @param options.output {String}
 * @param options.watch {Boolean}
 *
 * @returns {Promise<void>}
 */
export default (options) => {
    let cssContent = fs.readFileSync(options.output, 'utf8');

    options.css ??= ['../npm/src/air-scss/css/utilities.css'];

    const purge = async () => {
        const startTime = Date.now();

        const result = await new PurgeCSS().purge({
            css: options.css,
            content: options.content,
        })

        let purgedCssContent = '';
        result.forEach((result) => purgedCssContent += result.css)

        if (purgedCssContent !== cssContent) {
            fs.writeFile(options.output, purgedCssContent, (err) => {
                if (err) {
                    return console.log(err);
                }

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
