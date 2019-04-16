This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Available Scripts

In the project directory, you can run:

###Steps to run the client side and filewriter:

### 1) `npm install`

To install all the node modules associated with the client side

### 2) `node ./writeFileServer/writeFile.js`

It runs the local server to write the required results in a file named [results.txt] <br>
under the results folder

### 3) `npm start`

Runs the app in the development mode.<br>
Open [http://localhost:19001](http://localhost:19001) to view it in the browser.
The client side is listening on the server given which runs at [https://localhost:9000] <br>
It also send the results to the express local server running at [https://localhost:3000/writeresults]

### 4) `For dynamic locations IDs`

Put the csv of taxi locations in the public folder and the client will read the ID
of madison,Brooklyn and woodside,Queens

### 5) `Sidenotes:`
- If the client don't read the server messages at the first run just refresh the page
- The preferred OS is ubuntu but it should work on any other OS
- The local server to write in a file is under the folder [writeFileServer] written in nodejs
- The results in the results.txt file in the results folder are comma separated on the order <br>
	(total records, total trips, average trips per day, distinct vehicles, total trips from woodside,Queens)
