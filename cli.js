#!/usr/bin/env node
import { compressAllImages } from './main.js';
import path from 'path';

const args = process.argv.slice(2);
if (args.length < 2) {
    console.log('Usage: compressAllImages <source_directory> <target_directory>');
    process.exit(1);
}

const [dir, newDir] = args.map(arg => path.resolve(arg));

compressAllImages(dir, newDir).then(() => {
    console.log('Compression completed successfully.');
}).catch(err => {
    console.error('Error during compression:', err);
});
