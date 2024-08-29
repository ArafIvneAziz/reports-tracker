const express = require('express')
const functions = require("firebase-functions");
const cors = require("cors");
const fs = require('fs');
const serverless = require('serverless-http');
const csv = require('csv-parser');
const { createObjectCsvWriter } = require('csv-writer');

const app = express()
// const port = 8080

// test urls
// reports-login?email=yaminahad420@gmail.com&pass=password
// redirect-url?email=email-address&url=url
// seen-mail?email=email-address&url=url

function record_managaer(email, url, type) {
    const records = [];
    let hasit = false;
    
    let seen = visited = false;
    if (type === "visited") {
        seen = visited = true;
    } else if (type === "seen") {
        seen = true;
    }
    
    fs.createReadStream('data.csv')
    .pipe(csv())
    .on('data', (row) => {
        if(row['emails'] == email && row['affiliate'] == url){
            if(row['visited'] == "true") {
                records.push(row);
            } else {
                records.push({
                    seen: seen,
                    visited: visited,
                    emails: email,
                    affiliate: url
                });
            }
            hasit = true;
        } else {
            records.push(row);
        }
    })
    .on('end', () => {
        if(!hasit) {
            records.push({
                seen: seen,
                visited: visited,
                emails: email,
                affiliate: url
            });
        }
    
        // Write the updated records back to the file
        const csvWriter = createObjectCsvWriter({
        path: 'data.csv',
        header: [
            { id: 'seen', title: 'seen' },
            { id: 'visited', title: 'visited' },
            { id: 'emails', title: 'emails' },
            { id: 'affiliate', title: 'affiliate' }
        ]
    });

    csvWriter.writeRecords(records)
      .then(() => console.log('CSV file updated successfully!'));
    });

}

function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function validateURL(url) {
    const urlRegex = /^(https?:\/\/)?([\w-]+(\.[\w-]+)+)([\w.,@?^=%&:\/~+#-]*[\w@?^=%&\/~+#-])?$/;
    return urlRegex.test(url);
  }

app.get('/redirect-url', (req, res) => {
    try {
        let redirectUrl = req.query.url;
        let email = req.query.email;

        let valid_ru = validateURL(redirectUrl);
        let valid_e = validateEmail(email);
        
        if (valid_ru && valid_e) {
            res.redirect(redirectUrl);
            record_managaer(email, redirectUrl, 'visited');
        } else {
            res.status(400).send('...wrong url...');
        }

    } catch(e){
        console.log("")
    }
});

app.get('/seen-mail', (req, res) => {
    try {
        let redirectUrl = req.query.url;
        let email = req.query.email;

        let valid_ru = validateURL(redirectUrl);
        let valid_e = validateEmail(email);

        if (valid_ru && valid_e) {
            res.sendFile(__dirname + '/small_pixel.png');
            record_managaer(email, redirectUrl, 'seen');
        } else {
            res.status(400).send('...wrong url...');
        }
    } catch(e) {
        console.log("")
    }
});

app.get('/download', (req, res) => {
    let pass = req.query.pass;
    let email = req.query.email;
    if (email === "yaminahad420@gmail.com" && pass === "password") {
        let filePath = __dirname + '/data.csv';
        res.download(filePath, 'reports.csv', (err) => {
            if (err) {
                console.error('File download error:', err);
                res.status(500).send('An error occurred during the download.');
            }
        });
    } else {
        res.status(400).send('...loging in...');
    }
});

app.get('/emptyingfile', (req, res) => {
    let pass = req.query.pass;
    let email = req.query.email;
    if (email === "yaminahad420@gmail.com" && pass === "password") {
        res.redirect("/reports-login?email=yaminahad420@gmail.com&pass=password")
        let filePath = __dirname + '/data.csv';
        fs.writeFileSync(filePath, '');
    } else {
        res.status(400).send('...loging in...');
    }
});

app.get('/reports-login', (req, res) => {
    try {
        let pass = req.query.pass;
        let email = req.query.email;
        let html = `
        <table>
        <tr>
          <th>email</th>
          <th>seen</th>
          <th>visited</th>
          <th>affiliate</th>
        </tr>`;
        
        if (email === "yaminahad420@gmail.com" && pass === "password") {
            fs.createReadStream('data.csv')
            .pipe(csv())
            .on('data', (row) => {
                html += `
                <tr>
                    <td>${row.emails}</td>
                    <td>${row.seen}</td>
                    <td>${row.visited}</td>
                    <td>${row.affiliate}</td>
                </tr>
                `;
            })
            .on('end', () => {
                html += '</table>';
                res.send(`
                <!DOCTYPE html>
                <html lang="en">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Report Page</title>
                    <style>
                        table {
                        font-family: arial, sans-serif;
                        border-collapse: collapse;
                        width: 100%;
                        }

                        td, th {
                        border: 1px solid #dddddd;
                        text-align: left;
                        padding: 8px;
                        }

                        tr:nth-child(even) {
                        background-color: #dddddd;
                        }
                    </style>
                </head>
                <body style="font-family: cursive;">
                    <h1>Report Page</h1>
                    <div style="height: 400px; overflow: auto; margin: 15px 12px; font-size: 14px;">
                    ${html}
                    </div>

                    <button id="downloadBtn" style="margin-top: 15px;margin-left: 20px;">Download File</button>
                    <button id="emptyBtn" style="margin-top: 15px;margin-left: 20px;">Empty File</button>

                    <script>

                        document.getElementById('downloadBtn').addEventListener('click', () => {
                            const urlParams = new URLSearchParams(window.location.search);
                            const email = urlParams.get('email');
                            const pass = urlParams.get('pass');
                            window.location.href = \`/download?email=\${email}&pass=\${pass}\`;
                        });

                        document.getElementById('emptyBtn').addEventListener('click', () => {
                            const urlParams = new URLSearchParams(window.location.search);
                            const email = urlParams.get('email');
                            const pass = urlParams.get('pass');
                            window.location.href = \`/emptyingfile?email=\${email}&pass=\${pass}\`;
                        });

                    </script>
                </body>
                </html>
                `)

            });

        } else {
            res.status(400).send('...loging in...');
        }

    } catch(e) {
        console.log("")
    }
});

// app.listen(port, () => {
//   console.log(`Example app listening on port ${port}`)
// })

// how you can host:
// https://medium.com/boca-code/the-basic-process-is-that-we-will-use-firebase-cloud-functions-to-create-a-single-function-app-13ba3b852077
// issue is need to use credit card...

// exports.app = functions.https.onRequest(app);

module.exports.handler = serverless(app);
