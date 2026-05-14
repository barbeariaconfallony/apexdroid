const fs = require('fs');
const path = require('path');

const inputFile = 'd:/Kodular Projetos/APEX DROID IDE/Componentes do Kodular e suas Propriedades.md';
const outputDir = 'd:/Kodular Projetos/APEX DROID IDE/lib/metadata/components';

if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
}

const content = fs.readFileSync(inputFile, 'utf8');
const sections = content.split('## ');

sections.forEach(section => {
    if (!section.trim()) return;
    
    const lines = section.split('\n');
    const componentName = lines[0].trim();
    const properties = lines
        .slice(1)
        .map(line => line.trim())
        .filter(line => line.startsWith('- '))
        .map(line => line.substring(2).trim());

    if (componentName && properties.length > 0) {
        const typeKey = componentName.replace(/\s+/g, '');
        const fileName = componentName.replace(/\s+/g, '').toLowerCase() + '.json';
        const filePath = path.join(outputDir, fileName);
        
        const componentData = {
            name: componentName,
            type: typeKey,
            properties: properties
        };
        
        fs.writeFileSync(filePath, JSON.stringify(componentData, null, 2));
        console.log(`Created ${fileName}`);
    }
});

// Generate index file
const files = fs.readdirSync(outputDir).filter(f => f.endsWith('.json'));
let indexContent = 'export const componentMetadata: Record<string, { name: string, type: string, properties: string[] }> = {\n';

files.forEach(file => {
    const data = JSON.parse(fs.readFileSync(path.join(outputDir, file), 'utf8'));
    indexContent += `  "${data.type}": ${JSON.stringify(data)},\n`;
});

indexContent += '};\n';

fs.writeFileSync(path.join('d:/Kodular Projetos/APEX DROID IDE/lib/metadata', 'index.ts'), indexContent);
console.log('Created index.ts');
