import path from "path";
import fs from "fs";
import gm from "gm";

let goodSize = 50000;
let goodQuality = 50;

export async function compressAllImages(dir, newDir) {
    if (!fs.existsSync(dir)) {
        console.error('Directory not found:', dir);
        return;
    }
    if (!fs.existsSync(newDir)) {
        fs.mkdirSync(newDir);
    }
    let files = fs.readdirSync(dir);
    files = files.filter(file => fs.lstatSync(path.join(dir, file)).isDirectory() || /\.(jpe?g|png|gif|webp|tif)$/i.test(file));
    files.sort((a, b) => {
            let aIsDir = fs.lstatSync(path.join(dir, a)).isDirectory();
            let bIsDir = fs.lstatSync(path.join(dir, b)).isDirectory();
            if (aIsDir && !bIsDir) {
                return -1;
            }
            if (!aIsDir && bIsDir) {
                return 1;
            }
            return a.localeCompare(b);
        }
    );
    console.log(`files: ${JSON.stringify(files)}`);

    async function handleFileORDir(file) {
        console.log(`file: ${JSON.stringify(file)}`);
        const filePath = path.join(dir, file);
        const newFilePath = path.join(newDir, file);
        if (fs.lstatSync(filePath).isDirectory()) {
            if (!fs.existsSync(newFilePath)) {
                fs.mkdirSync(newFilePath);
            }
            await compressAllImages(filePath, newFilePath);
        } else {
            if (fs.existsSync(newFilePath)) {
                console.log('File already exists:', newFilePath);
                return;
            }
            await compressImage(filePath, newFilePath);
        }
    }

    for (const file of files) {
        await handleFileORDir(file);
    }
}

export async function compressImage(inputPath, outputPath) {

    try {
        let quality = 100;
        let percent = 100;
        let size;

        while (!size || size > goodSize && quality > goodQuality && percent > 0) {
            await compressInner(inputPath, outputPath, quality, percent);
            await new Promise(resolve => setTimeout(resolve, 2000));
            size = fs.statSync(outputPath).size;
            // quality -= 5;
            percent /= 2;
            console.log(path.basename(inputPath) + ` quality: ${quality}, percent: ${percent}%, size: ${size / 1000} kb`);
        }
        console.log(`Image compressed finished with ${quality}% quality, percent: ${percent}%, size: ${size / 1000} kb`);
    } catch (error) {
        console.error('Error compressing image:', error);
    }
}

function compressInner(inputPath, outputPath, quality, percent) {
    return new Promise((resolve, reject) => {
        gm(inputPath)
            .resize(percent + '%')
            .noProfile()
            .setFormat('webp')
            .quality(quality)
            .write(outputPath, function (error) {
                if (error) {
                    reject(error);
                } else {
                    resolve();
                }
            });
    });
}
