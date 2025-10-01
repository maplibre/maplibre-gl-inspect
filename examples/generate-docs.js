import fs from 'fs';

/**
 * This script is used to generate the docs for the examples.
 * It reads the examples folder and replaces the relative paths to the maplibre-gl-inspect library with the unpkg url.
 * It also creates an index.html file with links to all the examples.
 */

const files = fs.readdirSync('./examples').filter(f => f.endsWith('.html'));

for (const file of files) {
    let content = fs.readFileSync(`./examples/${file}`, 'utf8');
    content = content.replaceAll("../", 'https://unpkg.com/@maplibre/maplibre-gl-inspect@latest/');
    fs.writeFileSync(`./docs/${file}`, content);
}

const index = `
<!DOCTYPE html>
<html>
<head>
    <meta charset='utf-8' />
    <title>Maplibre GL Inspect Docs</title>
    <meta name='viewport' content='initial-scale=1,maximum-scale=1,user-scalable=no' />
    <style>
        body {
            margin: 20px;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Noto Sans",Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji";
        }
        a {
            text-decoration: none;
        }
        img {
            max-width: 100%;
            max-height: 400px;
        }
    </style>
</head>
<body>

<H1>Maplibre GL Inspect Docs</H1>
<H2><a href="API/index.html">API documentation</a></H2>
<img src="https://cloud.githubusercontent.com/assets/1288339/21744637/11759412-d51a-11e6-9581-f26741fcd182.gif" alt="Maplibre GL Inspect Preview">
<H2>Examples</H2>
<ul>
${files.map(f => '    <li><a href="' + f +'">' + f + '</a></li>').join('\n')}
</body>
</html>`

fs.writeFileSync(`./docs/index.html`, index);