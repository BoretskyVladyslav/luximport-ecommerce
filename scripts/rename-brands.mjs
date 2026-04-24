
import fs from 'fs';
import path from 'path';

const brandsDir = 'public/images/brands';

async function renameBrands() {
    try {
        const files = fs.readdirSync(brandsDir);
        
        // Filter WhatsApp images (JPEG)
        const whatsappFiles = files
            .filter(f => f.startsWith('WhatsApp Image') && (f.endsWith('.jpeg') || f.endsWith('.jpg')))
            .sort(); // Sort to have a consistent sequence
            
        console.log(`Found ${whatsappFiles.length} WhatsApp images.`);

        if (whatsappFiles.length === 0) {
            console.log('No WhatsApp images found to rename.');
            return;
        }

        whatsappFiles.forEach((file, index) => {
            const oldPath = path.join(brandsDir, file);
            const newName = `brand-${index + 1}.png`; // Keeping .png as requested, even if source is jpeg
            const newPath = path.join(brandsDir, newName);
            
            fs.renameSync(oldPath, newPath);
            console.log(`Renamed: ${file} -> ${newName}`);
        });

        console.log('Renaming complete.');
    } catch (error) {
        console.error('Error during renaming:', error);
    }
}

renameBrands();
