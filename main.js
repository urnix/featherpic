import fs from "fs";
import gm from "gm";

let goodSize = 50000;
let goodQuality = 50;

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
            console.log(`quality: ${quality}, percent: ${percent}%, size: ${size / 1000} kb`);
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
