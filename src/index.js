import http from 'node:http';
import fs from 'node:fs/promises';
import log from './util.js';

const server = http.createServer(async (req, res) => {

    function getFileName(headers) {
        const fileName = headers['content-disposition'].split('filename="')[1].split('"')[0];
        return fileName;
    };

    const html = await fs.readFile('public/index.html', 'utf-8');

    if (req.url === '/') {
        res.setHeader('Content-Type', 'text/html');
        res.end(html);
    }

    else if (req.url === '/file' && req.method.toUpperCase() === 'POST') {
        let fileProgress = 0;

        const fileName = getFileName(req.headers);

        const fileHandle = await fs.open(fileName, 'w');

        const writeStream = await fileHandle.createWriteStream();

        req.on('data', async (chunk) => {
            const stat = await fileHandle.stat();
            fileProgress = parseInt((stat.size / Number(req.headers['content-length'])) * 100);
            log(`${fileProgress}%`);
            if (!writeStream.write(chunk)) {
                req.pause();
            };
        });

        writeStream.on('finish', async () => {
            await fileHandle.close();
            log(`100%`);
            console.log('\nDownload completed');
        });

        writeStream.on('drain', () => {
            req.resume();
        })
        req.on('end', async () => {
            await writeStream.end();
            res.end(JSON.stringify({
                status: 'success'
            }));
        });
    };

});

server.listen(9090, '127.0.0.1', () => {
    console.log(server.address())
});