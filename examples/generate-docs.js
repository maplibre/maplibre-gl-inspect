import fs from 'fs';

const files = fs.readdirSync('./examples');
if (!fs.existsSync('./docs')) {
    fs.mkdirSync('./docs');
}

for (const file of files) {
    if (file.endsWith('.html')) {
        let content = fs.readFileSync(`./examples/${file}`, 'utf8');
        content = content.replaceAll("../", 'https://unpkg.com/@maplibre/maplibre-gl-inspect@latest/');
        fs.writeFileSync(`./docs/${file}`, content);
    }
}

const index = `
<!DOCTYPE html>
<html>
<head>
    <meta charset='utf-8' />
    <title>Maplibre GL Inspect Docs</title>
    <meta name='viewport' content='initial-scale=1,maximum-scale=1,user-scalable=no' />
</head>
<body>

<H1>Maplibre GL Inspect Docs</H1>
<ul>
${files.map(f => '    <li><a href="' + f +'">' + f + '</a></li>').join('\n')}
</body>
</html>`

fs.writeFileSync(`./docs/index.html`, index);