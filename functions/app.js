const serverless = require('serverless-http');
const express = require('express')
const { Client } = require('pg')

const client = new Client("postgresql://yamin:rf8uua05IG0clw1B6F2BpA@inofficial-projects-9932.8nk.gcp-asia-southeast1.cockroachlabs.cloud:26257/email-track?sslmode=verify-full")

async function Build_Collection(){
    // Connect Cockroachlabs
    await client.connect();
}

Build_Collection();

const app = express();
const port = 8080;

async function delete_db_cats() {
    // Delete Table
    await client.query("DROP TABLE users;");

    // Create Table
    await client.query(`
        CREATE TABLE users (
        Seen BOOLEAN,
        Visited BOOLEAN,
        Email VARCHAR(255),
        AffiliateURL VARCHAR(255),
        CONSTRAINT email_format CHECK (Email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
        );
    `);
}

async function record_managaer(email, url, type) {
    
    let seen = visited = false;
    if (type === "visited") {
        seen = visited = true;
    } else if (type === "seen") {
        seen = true;
    }
    
    try {

        // Find queries
        let results = await client.query(`SELECT * FROM users WHERE email = '${email}' AND affiliateurl = '${url}';`);
        let row = results.rows[0];

        if(row.visited == true) {
            let x = "";
        } else if(visited == true) {
            // Update query
            await client.query(`UPDATE users SET seen = TRUE, visited = TRUE WHERE email = '${email}' AND affiliateurl = '${url}';`);
        }
        
    } catch (e) {
        if(visited == true) {
             // Insert query
             await client.query(`INSERT INTO users (seen, visited, email, affiliateurl) VALUES (TRUE, TRUE, '${email}', '${url}');`);
        } else {
            // Insert query
            await client.query(`INSERT INTO users (seen, visited, email, affiliateurl) VALUES (TRUE, FALSE, '${email}', '${url}');`);
        }
    }

}

function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function validateURL(url) {
    const urlRegex = /^(https?:\/\/)?([\w-]+(\.[\w-]+)+)([\w.,@?^=%&:\/~+#-]*[\w@?^=%&\/~+#-])?$/;
    return urlRegex.test(url);
  }

app.get('/redirect-url', async (req, res) => {
    try {
        let redirectUrl = req.query.url;
        let email = req.query.email;

        let valid_ru = validateURL(redirectUrl);
        let valid_e = validateEmail(email);
        
        if (valid_ru && valid_e) {
            await record_managaer(email, redirectUrl, 'visited');
            res.redirect(redirectUrl);
        } else {
            res.status(400).send('...wrong url...');
        }

    } catch(e){
        let x = "";
    }
});

app.get('/seen-mail', async (req, res) => {
    try {
        let affiliateUrl = req.query.url;
        let email = req.query.email;

        let valid_ru = validateURL(affiliateUrl);
        let valid_e = validateEmail(email);

        if (valid_ru && valid_e) {
            await record_managaer(email, affiliateUrl, 'seen');
            // res.sendFile('base/small_pixel.png');
            res.redirect("https://records-adder.netlify.app/small_pixel.png");
        } else {
            res.status(400).send('...wrong url...');
        }
    } catch(e) {
        let x = "";
    }
});
  

app.get('/download', async (req, res) => {
    let pass = req.query.pass;
    let email = req.query.email;

    if (email === "yaminahad420@gmail.com" && pass === "password") {
        let db_catts = await client.query("SELECT * FROM users;");
        let catts_rows = db_catts.rows;

        const fileName = 'emaill-reports.csv';
        let csvContent = 'seen,visited,email,affiliateurl\n';
        
        async function cat_await() {
            for (let i = 0; i < catts_rows.length; i++) {
                let cat_row = catts_rows[i];
                csvContent += `${cat_row.seen},${cat_row.visited},${cat_row.email},${cat_row.affiliateurl}\n`;
            }
        }

        await cat_await();

        res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
        res.setHeader('Content-Type', 'text/csv');
        res.send(csvContent);

    } else {
        res.status(400).send('...loging in...');
    }
});

app.get('/delete-all-collection', async (req, res) => {
    let pass = req.query.pass;
    let email = req.query.email;
    if (email === "yaminahad420@gmail.com" && pass === "password") {
        await delete_db_cats();
        res.redirect("/reports-login?email=yaminahad420@gmail.com&pass=password")
    } else {
        res.status(400).send('...loging in...');
    }
});

async function web_visits_count() {
    let results = await client.query("SELECT * FROM website_visitor_count;");
    let total_visited = Number(results.rows[0].count);
    total_visited += 1;
    await client.query(`UPDATE website_visitor_count SET count = ${total_visited};`);
}

app.get('/website-visits-tracker', async (req, res) => {
    // Simple Steps
    // DROP TABLE website_visitor_count;
    // CREATE TABLE website_visitor_count (count INT);
    // INSERT INTO website_visitor_count (count) VALUES (0);
    // SELECT * FROM website_visitor_count;
    // UPDATE website_visitor_count SET count = ${};

    let pass = req.query.pass;
    let email = req.query.email;

    if (email === "yaminahad420@gmail.com" && pass === "password") {
        await web_visits_count();
        res.send({record_added: true});
    } else {
        res.status(400).send('...loging in...');
    }
});

app.get('/reports-login', async (req, res) => {
    try {
        let pass = req.query.pass;
        let email = req.query.email;

        let db_catts = await client.query("SELECT * FROM users;");
        let catts_rows = db_catts.rows;
        let html = `
        <table>
        <tr>
          <th>email</th>
          <th>seen</th>
          <th>visited</th>
          <th>affiliate</th>
        </tr>`;
        
        if (email === "yaminahad420@gmail.com" && pass === "password") {
            for (let i = 0; i < catts_rows.length; i++) {
                html += `
                <tr>
                    <td>${catts_rows[i].email}</td>
                    <td>${catts_rows[i].seen}</td>
                    <td>${catts_rows[i].visited}</td>
                    <td>${catts_rows[i].affiliateurl}</td>
                </tr>
                `;
            }
        
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
                <button id="emptyBtn" style="margin-top: 15px;margin-left: 20px;">Empty Cats</button>

                <script>

                    const urlParams = new URLSearchParams(window.location.search);
                    const email = urlParams.get('email');
                    const pass = urlParams.get('pass');

                    document.getElementById('downloadBtn').addEventListener('click', () => {
                        window.location.href = \`/download?email=\${email}&pass=\${pass}\`;
                    });

                    document.getElementById('emptyBtn').addEventListener('click', () => {
                        window.location.href = \`/delete-all-collection?email=\${email}&pass=\${pass}\`;
                    });

                </script>
            </body>
            </html>
            `);

        } else {
            res.status(400).send('...loging in...');
        }

    } catch(e) {
        let x = "";
    }
});

module.exports.handler = serverless(app);
