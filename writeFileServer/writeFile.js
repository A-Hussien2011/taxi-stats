const express = require('express')
const app = express()
const port = 3000
var cors = require('cors');
const fs = require('fs')
const url = require('url');

app.use(express.static('../results'))
app.use(cors());
app.get('/', (req, res) => res.send('Hello World!'))

app.post('/writeresults', (request, respond) => {
    var body = '';
    filePath = './results/results.txt';
    request.on('data', function(data) {
    	data = JSON.parse(data);
        body += data.numRecords + ","
        		+ data.numTrips + ","
        		+ data.tripsPerDay + ","
        		+ data.distinctCars + ","
        		+ data.woodside;
        fs.writeFile(filePath, body, function() {
            respond.end();
        });
    });
    respond.send("writing")
})

app.listen(port, () => console.log(`Example app listening on port ${port}!`))