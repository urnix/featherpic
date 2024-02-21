import path from "path";
import fs from "fs";
import gm from "gm";

let numFilenameComparator = (a, b) => {
    let aNum = parseInt(a);
    let bNum = parseInt(b);
    return aNum && bNum ? aNum - bNum : a.localeCompare(b);
};

function copyFoldersStrupture(dir, newDir) {
    let folders = fs.readdirSync(dir)
    folders = folders
        .sort(numFilenameComparator)
        .map(f => dir + '/' + f)
        .filter(f => {
            // if (!fs.existsSync(f) || fs.lstatSync(f).isDirectory() && f.includes('.tif')) {
            //     console.log(`!!!f: ${JSON.stringify(f)}`);
            // }
            return fs.existsSync(f) && fs.lstatSync(f).isDirectory() && !f.includes('.tif')
        })
    folders.forEach(f => {
        const nf = f.replace(dir, newDir);
        if (!fs.existsSync(nf)) {
            fs.mkdirSync(nf);
        }
        copyFoldersStrupture(f, nf);
    });
}

function collectFilePaths(dir) {
    let filesAndFolders = fs.readdirSync(dir);
    const files = filesAndFolders
        .sort(numFilenameComparator)
        .map(f => dir + '/' + f)
        .filter(f => fs.existsSync(f) && !fs.lstatSync(f).isDirectory())
        // .filter(f => !f.endsWith('.ini') && !f.endsWith('.mp4'))
    let foldders = filesAndFolders
        .sort(numFilenameComparator)
        .map(f => dir + '/' + f)
        .filter(f => fs.existsSync(f) && fs.lstatSync(f).isDirectory() && !f.includes('.tif'));
    let filesFromFolders = foldders.reduce((a, c) => [...a, ...collectFilePaths(c)], []);
    return [...files, ...filesFromFolders];
}

export async function compressAllImages(dir, newDir, goodSize, callback = () => {
}) {
    if (!fs.existsSync(dir)) {
        console.error('Directory not found:', dir);
        return;
    }
    if (!fs.existsSync(newDir)) {
        fs.mkdirSync(newDir);
    }

    copyFoldersStrupture(dir, newDir);
    let files = collectFilePaths(dir);
    fs.writeFileSync('in_files.json', JSON.stringify(files))
    files = files.filter(f => /\.(jpe?g|png|gif|webp|tif|tiff|jfif)$/i.test(f));
    fs.writeFileSync('in_images.json', JSON.stringify(files))

    async function handleFile(f) {
        const nf = f.replace(dir, newDir);
        if (!fs.existsSync(nf)) {
            await compressImage(f, nf, goodSize);
        }
        callback(f, nf);
    }

    // for (let file of files) {
    //     await handleFile(file);
    // }
    // ------------
    let promises = [];
    for (let i = 0; i < files.length; i++) {
        promises.push(handleFile(files[i]));
        if (i % 30 === 0) {
            await Promise.all(promises);
            promises = [];
        }
    }
    // ------------
    // async function processFilesInParallel(files, maxParallel) {
    //     const semaphore = new Array(maxParallel).fill(Promise.resolve());
    //     const processFile = async (file) => {
    //         const slot = await Promise.race(semaphore);
    //         return handleFile(file).finally(() => slot);
    //     };
    //     files.forEach(file => {
    //         const index = semaphore.findIndex(promise => promise === Promise.resolve() || promise.isFulfilled);
    //         semaphore[index] = processFile(file).catch(console.error);
    //     });
    //     await Promise.all(semaphore);
    // }
    // processFilesInParallel(files, 10).then(() => {
    //     console.log('Все файлы обработаны');
    // });






}

export async function compressImage(inputPath, outputPath, goodSize) {
    try {
        let percent = 50;
        // let percent = 1;
        let size = fs.statSync(inputPath).size;

        if (size <= goodSize) {
            fs.copyFileSync(inputPath, outputPath);
            // console.log(`Image copied: ${path.basename(inputPath)}`);
            return;
        }

        while (size > goodSize && percent > 0) {
            await compressInner(inputPath, outputPath, percent);
            size = fs.statSync(outputPath).size;
            percent /= 2;
            // console.log(path.basename(inputPath) + ` percent: ${percent}%, size: ${size / 1000} kb`);
        }
        // console.log(`Image compressed finished: percent: ${percent}%, size: ${size / 1000} kb`);
    } catch (error) {
        console.error('Error compressing image:', error);
    }
}

function compressInner(inputPath, outputPath, percent) {
    return new Promise((resolve, reject) => {
        gm(inputPath)
            .resize(percent + '%')
            .noProfile()
            .setFormat('webp')
            .write(outputPath, function (error) {
                if (error) {
                    reject(error);
                } else {
                    resolve();
                }
            });
    });
}
