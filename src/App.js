import React, {Component} from 'react';
import './App.css';
import ReactSvgPieChart from "react-svg-piechart"
// import { Chart } from "react-charts";

const URL = 'ws://localhost:9000/ws'
var ws;

/*
vehiclesPerDay:{
          date1: {
            vehicle1: 0,
            vehicle2: 0
          },
          date2: {
            vehicle1: 0,
            vehicle2: 0
          }
        }

*/

class App extends Component {
    constructor(props) {
        super(props);
        //tripsObj has keys of date
        this.state = {
            totalTrips: {
                yellow: 0,
                green: 0,
                fhv: 0,
            },
            vehiclesPerDay: {},
            noDropOffTrips: {
                yellow: 0,
                green: 0,
                fhv: 0,
            },
            tripsDuration: {
                yellow: 0,
                green: 0,
                fhv: 0,
            },
            tripsPickUpLoc: {
            },
            numTrips: 0,
            numRecords: 0,
            cars:{

            },
            madisonBrooklynID: -1,
            woodsideQueensID: -1,
            pickedFromMadison: {
                yellow: 0,
                green: 0,
                fhv: 0
            },
            pickedFromWoodside: {
                yellow: 0,
                green: 0,
                fhv: 0
            }
        };
    };

    componentWillMount = () => {
        this.readTextFile("/taxi_zones_simple.csv");

    };

    readTextFile =(file)=>{
        var rawFile = new XMLHttpRequest();
        rawFile.open("GET", file, true);
        rawFile.onreadystatechange = ()=>{
            if(rawFile.readyState === 4)
            {
                if(rawFile.status === 200 || rawFile.status === 0)
                {
                    var allText = rawFile.responseText;
                    this.getAllLocations(allText);
                }
            }
        }
        rawFile.send(null);
        ws = new WebSocket(URL);
        ws.onopen = function (event) {
            console.log("Socket connected")
        };
        ws.onmessage = (event) => {
            this.processData(JSON.parse(event.data));
            this.writeFile();
        }
    }

    writeFile = async()=>{
        let {numTrips, numRecords, totalTrips, vehiclesPerDay, cars, pickedFromWoodside} = this.state;
        let availableDays = Object.keys(vehiclesPerDay).length;
        let tripsPerDay = Math.floor((totalTrips.yellow + totalTrips.green + totalTrips.yellow) / availableDays);
        let distinctCars = Object.keys(cars).length;
        let woodside = pickedFromWoodside.yellow + pickedFromWoodside.green + pickedFromWoodside.fhv;

        if(!tripsPerDay) tripsPerDay = 0;

        let response = await fetch('http://localhost:3000/writeresults', {
            method: 'POST',
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                numRecords,
                numTrips,
                tripsPerDay,
                distinctCars,
                woodside
            })
        });
    }

    getAllLocations =(data)=>{
        let zones = data.split("\n");
        let madisonBrooklynID = -1;
        let woodsideQueensID = -1;
        for(let i = 0; i < zones.length; i++){
            zones[i] = zones[i].split(",");
            if(zones[i][1] === "Madison" && zones[i][2] === "Brooklyn"){
                madisonBrooklynID = zones[i][0];
            }else if(zones[i][1] === "Woodside" && zones[i][2] === "Queens"){
                woodsideQueensID = zones[i][0];
            }
            
        }
        this.setState({zones, madisonBrooklynID, woodsideQueensID});
    }

    processData = (data) => {
        let {
            taxiType,
            vendorId,
            pickupDateTime,
            dropOffLocationId,
            pickupLocationId,
            dropOffDatetime,
            type
        } = data;

        let {numTrips, numRecords} = this.state;
        if(type === "new_trip"){
            numTrips ++;
        }
        numRecords ++;

        let {totalTrips, noDropOffTrips} = this.updateTrips(taxiType, dropOffLocationId, pickupLocationId, type);
        let vehiclesPerDay = this.updateVehicles(pickupDateTime, vendorId);
        let tripsDuration = this.updateTripsDuration(pickupDateTime, dropOffDatetime, taxiType);
        this.setState({totalTrips,
            vehiclesPerDay,
            noDropOffTrips,
            tripsDuration,
            numTrips,
            numRecords
        })
    };

    updateTrips = (taxiType, dropOffLocationId, pickupLocationId, recordType) => {
        let {totalTrips, noDropOffTrips, madisonBrooklynID, pickedFromMadison, woodsideQueensID, pickedFromWoodside} = this.state;
        if(recordType === "new_trip") totalTrips[taxiType]++;
        if (dropOffLocationId === '""' || dropOffLocationId === "" || dropOffLocationId === undefined) {
            noDropOffTrips[taxiType]++;
        }
        if(pickupLocationId.includes(madisonBrooklynID)){
            if(pickedFromMadison[taxiType] === undefined) pickedFromMadison[taxiType] = 0;
            pickedFromMadison[taxiType] ++;
        }
        if(pickupLocationId.includes(woodsideQueensID)){
            if(pickedFromWoodside[taxiType] === undefined) pickedFromWoodside[taxiType] = 0;
            pickedFromWoodside[taxiType] ++;
        }
        
        return {totalTrips, noDropOffTrips, pickedFromMadison, pickedFromWoodside}
    };

    updateVehicles = (pickupDateTime, vendorId) => {
        let {vehiclesPerDay, cars} = this.state;
        //res[0] = date, res[1] = time;
        let res = pickupDateTime.split(" ");
        res[0] = this.editFormat(res[0]);
        if (vehiclesPerDay[res[0]] === undefined) {
            vehiclesPerDay[res[0]] = {}
        }
        if (vehiclesPerDay[res[0]][vendorId] === undefined) {
            vehiclesPerDay[res[0]][vendorId] = 0
        }
        if(cars === undefined){
            cars = {}
        }
        if(cars[vendorId] === undefined){
            cars[vendorId] = 0;
        }
        if(vendorId) {
            vehiclesPerDay[res[0]][vendorId]++;
            cars[vendorId] ++;
        }
        return vehiclesPerDay;
    };

    editFormat = (myString)=>{
        if(myString.substr(0,1) === '"'){
            myString = myString.substr(1);
        }
        if(myString.substr(myString.length - 1) === '"'){
            myString = myString.slice(0, -1);
        }
        return myString;
    }

    updateTripsDuration = (pickupDateTime, dropOffDateTime, taxiType) => {
        let {tripsDuration} = this.state;
        //data sent in fhv is wrong formatted
        pickupDateTime = this.editFormat(pickupDateTime);
        dropOffDateTime = this.editFormat(dropOffDateTime);
        let resPickUp = new Date(pickupDateTime).getTime();
        let resDropOff = new Date(dropOffDateTime).getTime();
        let minutes = Math.floor((resDropOff - resPickUp) / (1000 * 60));
        if (!isNaN(minutes)) {
            tripsDuration[taxiType] += minutes;
        }
        return tripsDuration;
    };

    renderDays = () => {
        let {vehiclesPerDay} = this.state;
        let arr = [];
        for (let day in vehiclesPerDay) {
            arr.push(
                <option key={day} value={day}>{day}</option>
            )
        }
        return arr;
    };
    renderVendors =()=>{
        let {cars} = this.state;
        let arr = [];
        for(let car in cars){
            arr.push(
                <option key={car} value={car}>{car}</option>
            )
        }
        return arr;
    }
//
    getResults = () => {
        ws.close();
    };

    render() {
        let {totalTrips,
            vehiclesPerDay,
            noDropOffTrips,
            tripsDuration,
            cars,
            pickedFromMadison,
            selectedDay,
            selectedVendor
            } = this.state;
        let availableDays = Object.keys(vehiclesPerDay).length;
        let tripsPerDay = Math.floor((totalTrips.yellow + totalTrips.green + totalTrips.yellow) / availableDays);
        let numVehiclesPerDay = Object.keys(cars).length/availableDays;
        var dataPieTrips = [
            {title: "yellow", value: totalTrips.yellow, color: "#FFFF00"},
            {title: "green", value: totalTrips.green, color: "#008000"},
            {title: "fhv", value: totalTrips.fhv, color: "#0000ff"}
        ]
        var dataAverageTime = [
            {title: "yellow", value: tripsDuration.yellow / totalTrips.yellow, color: "#FFFF00"},
            {title: "green", value: tripsDuration.green / totalTrips.green, color: "#008000"},
            {title: "fhv", value: tripsDuration.fhv / totalTrips.fhv, color: "#0000ff"}
        ]
        var dataNoDrop = [
            {title: "yellow", value: noDropOffTrips.yellow, color: "#FFFF00"},
            {title: "green", value: noDropOffTrips.green, color: "#008000"},
            {title: "fhv", value: noDropOffTrips.fhv, color: "#0000ff"}
        ]
        var dataFromMadison = [
            {title: "yellow", value: pickedFromMadison.yellow, color: "#FFFF00"},
            {title: "green", value: pickedFromMadison.green, color: "#008000"},
            {title: "fhv", value: pickedFromMadison.fhv, color: "#0000ff"}
        ]
        
        let totalInDay = 0;
        for (let num in vehiclesPerDay[selectedDay]) {
            totalInDay += vehiclesPerDay[selectedDay][num];
        }
            
        return (
            <div className="App">
                <h1 id="header">Real time taxi tracker</h1>
                <div className="firstContainer totalTrips">
                    <div>
                        <h6>Trips data</h6>
                        <h1>Total trips per day: {tripsPerDay}</h1>
                        <h1>Average vehichles per day: {numVehiclesPerDay}</h1>
                        <h1>yellow: {totalTrips.yellow}</h1>
                        <h1>green: {totalTrips.green}</h1>
                        <h1>fhv: {totalTrips.fhv}</h1>
                    </div>
                    <ReactSvgPieChart expandOnHover={true} expandSize={5}
                        data={dataPieTrips} strokeWidth={0}
                    />
                </div>
                <div className="firstContainer noDropTrips">
                    <div>
                        <h6>No location id trips</h6>
                        <h1>yellow cars no dropID: {noDropOffTrips.yellow}</h1>
                        <h1>green cars no dropID: {noDropOffTrips.green}</h1>
                        <h1>FHV cars no dropID: {noDropOffTrips.fhv}</h1>
                    </div>
                    <ReactSvgPieChart expandOnHover={true} expandSize={5}
                        data={dataNoDrop} strokeWidth={0}
                    />
                </div>
                <div className="firstContainer fromMadison">
                    <div>
                        <h6>From Madison,Brooklyn trips</h6>
                        <h1>yellow cars: {pickedFromMadison.yellow}</h1>
                        <h1>green cars: {pickedFromMadison.green}</h1>
                        <h1>FHV cars: {pickedFromMadison.fhv}</h1>
                    </div>
                    <ReactSvgPieChart expandOnHover={true} expandSize={5}
                        data={dataFromMadison} strokeWidth={0}
                    />
                </div>
                <div className="firstContainer minutesPerTrip">
                    <div>
                        <h6>Average trip time in minutes</h6>
                        <h1>Yellow average trip time: {Math.floor(tripsDuration.yellow / totalTrips.yellow)}</h1>
                        <h1>Green average trip time: {Math.floor(tripsDuration.green / totalTrips.green)}</h1>
                        <h1>FHV average trip time: {Math.floor(tripsDuration.fhv / totalTrips.fhv)}</h1>
                    </div>
                    <ReactSvgPieChart expandOnHover={true} expandSize={5}
                        data={dataAverageTime} strokeWidth={0}
                    />
                </div>
                <div className="firstContainer vehiclesPerDay">
                    <div>
                        <h6>Vehicles on day</h6>
                        <select onChange={(event)=>this.setState({selectedDay: event.target.value})}>
                            {this.renderDays()}
                        </select>
                        <h1>{totalInDay}</h1>
                    </div>
                </div>
                <div className="firstContainer vehiclesNum">
                    <div>
                        <h6>Vehicles</h6>
                        <select onChange={(event)=>this.setState({selectedVendor: event.target.value})}>
                            {this.renderVendors()}
                        </select>
                        <h1>{cars[selectedVendor]}</h1>
                    </div>
                </div>
                <div id="btnSubmit">
                    <button onClick={() => this.getResults()}>Stop socket</button>
                </div>
            </div>
        );
    }
}

export default App;
