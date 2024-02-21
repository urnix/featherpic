import path from "path";
import fs from "fs";
import gm from "gm";

export async function compressAllImages(dir, newDir, goodSize, callback = () => {
}) {
    if (!fs.existsSync(dir)) {
        console.error('Directory not found:', dir);
        return;
    }
    if (!fs.existsSync(newDir)) {
        fs.mkdirSync(newDir);
    }
    let files = fs.readdirSync(dir);
    files = files.filter(file => {
        let join = path.join(dir, file);
        let existsSync = fs.existsSync(join);
        if (!existsSync) {
            console.error('File not found:', join);
            fs.appendFileSync('./problems.txt', join + '\n');
        }
        return existsSync && fs.lstatSync(join).isDirectory() || /\.(jpe?g|png|gif|webp|tif)$/i.test(file);
    });
    files.sort((a, b) => {
        let aNum = parseInt(a);
        let bNum = parseInt(b);
        return aNum && bNum ? aNum - bNum : a.localeCompare(b);
    });

    async function handleFileORDir(file) {
        const filePath = path.join(dir, file);
        const newFilePath = path.join(newDir, file);
        if (!fs.existsSync(filePath)) {
            fs.appendFileSync('./problems.txt', 'File not found: ' + filePath + '\n');
            console.error('File not found:', filePath);
            return;
        }

        if (fs.lstatSync(filePath).isDirectory()) {
            if (!fs.existsSync(newFilePath)) {
                fs.mkdirSync(newFilePath);
            }
            await compressAllImages(filePath, newFilePath, goodSize, callback);
        } else {
            if (fs.existsSync(newFilePath)) {
                console.log('File already exists:', newFilePath);
                return;
            }
            await compressImage(filePath, newFilePath, goodSize);
            callback(filePath);
        }
    }

    for (const file of files) {
        await handleFileORDir(file);
    }
}

export async function compressImage(inputPath, outputPath, goodSize) {
    try {
        let percent = 50;
        let size = fs.statSync(inputPath).size;

        if (size <= goodSize) {
            fs.copyFileSync(inputPath, outputPath);
            console.log(`Image copied: ${path.basename(inputPath)}`);
            return;
        }

        while (size > goodSize && percent > 0) {
            await compressInner(inputPath, outputPath, percent);
            size = fs.statSync(outputPath).size;
            percent /= 2;
            console.log(path.basename(inputPath) + ` percent: ${percent}%, size: ${size / 1000} kb`);
        }
        console.log(`Image compressed finished: percent: ${percent}%, size: ${size / 1000} kb`);
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
