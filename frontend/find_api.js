const https = require('https');

https.get('https://sherkcvai.netlify.app/', (res) => {
    let data = '';
    res.on('data', (chunk) => data += chunk);
    res.on('end', () => {
        const match = data.match(/src="(\/assets\/index-[^"]+\.js)"/);
        if (match) {
            const jsUrl = 'https://sherkcvai.netlify.app' + match[1];
            console.log('Fetching:', jsUrl);
            https.get(jsUrl, (jsRes) => {
                let jsData = '';
                jsRes.on('data', (c) => jsData += c);
                jsRes.on('end', () => {
                    // Look for anything resembling the onrender URL
                    const apiMatch = jsData.match(/https:\/\/[^"']*\.onrender\.com/i);
                    if (apiMatch) {
                        console.log('FOUND API URL:', apiMatch[0]);
                    } else {
                        console.log('API URL not found in bundle. It might be falling back to localhost.');
                    }
                });
            });
        } else {
            console.log('Could not find JS bundle in index.html');
        }
    });
}).on('error', (err) => console.error(err));
