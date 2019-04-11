import React, { Component } from 'react';
import './App.css';

const URL = 'ws://localhost:9000/ws'
var ws = new WebSocket(URL)
ws.onopen = function (event) {
  console.log("Socket connected") 
};
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
        vehiclesPerDay:{
        },
        noDropOffTrips:{
          yellow: 0,
          green: 0,
          fhv: 0,
        },
        tripsDuration:{
          yellow: 0,
          green: 0,
          fhv: 0,
        },
        tripsPickUpLoc:{
          id1: 0,
          id2: 0,
        }
      };
  };

  componentWillMount =()=>{
    ws.onmessage = (event)=> {
      this.processData(JSON.parse(event.data));
    }

  }
  processData =(data)=>{
    let {taxiType,
         vendorId,
         pickupLocationId,
         pickupDateTime,
         dropOffLocationId,
         dropOffDatetime} = data;

    let {totalTrips, noDropOffTrips} = this.updateTripsAndNoDrop(taxiType, dropOffLocationId);
    let vehiclesPerDay = this.updateVehicles(pickupDateTime, vendorId);
    let tripsDuration = this.updateTripsDuration(pickupDateTime, dropOffDatetime, taxiType);
    this.setState({totalTrips, vehiclesPerDay, noDropOffTrips, tripsDuration})
  }
  updateTripsAndNoDrop =(taxiType, dropOffLocationId)=>{
    let {totalTrips, noDropOffTrips} = this.state;
    totalTrips[taxiType] ++;
    if(dropOffLocationId === "" || dropOffLocationId === undefined){
      noDropOffTrips[taxiType] ++;
    }
    return {totalTrips, noDropOffTrips}
  }
  updateVehicles =(pickupDateTime, vendorId)=>{
    let {vehiclesPerDay} = this.state;
    //res[0] = date, res[1] = time;
    let res = pickupDateTime.split(" ");
    if(vehiclesPerDay[res[0]] === undefined){
      vehiclesPerDay[res[0]] = {}
    }
    if(vehiclesPerDay[res[0]][vendorId] === undefined){
      vehiclesPerDay[res[0]][vendorId] = 0
    }
    vehiclesPerDay[res[0]][vendorId] ++;
    return vehiclesPerDay;
  }
  updateTripsDuration =(pickupDateTime, dropOffDateTime, taxiType)=>{
    let {tripsDuration} = this.state;
    //data sent in fhv is wrong formatted
    if(taxiType === "fhv"){
      pickupDateTime = pickupDateTime.substr(1).slice(0, -1);
      dropOffDateTime = dropOffDateTime.substr(1).slice(0, -1);
    }
    let resPickUp = new Date(pickupDateTime).getTime();
    let resDropOff = new Date(dropOffDateTime).getTime();
    let minutes = Math.floor((resDropOff - resPickUp)/(1000 * 60));
    if(!isNaN(minutes)){
      tripsDuration[taxiType] += minutes;
    }
    return tripsDuration;
  }

  renderDays =()=>{
    let {vehiclesPerDay} = this.state;
    let arr = [];
    for(let day in vehiclesPerDay){
      let total = 0;
      for(let num in vehiclesPerDay[day]){
        total += vehiclesPerDay[day][num];
      }
      arr.push(
        <h1>On the day {day}: {total} vehichles</h1>
      )
    }
    return arr;
  }
//
  getResults =()=>{
    ws.close();
  }
  render() {
    let {totalTrips, vehiclesPerDay, noDropOffTrips, tripsDuration} = this.state;
    let availableDays = Object.keys(vehiclesPerDay).length;
    let tripsPerDay = Math.floor((totalTrips.yellow + totalTrips.green + totalTrips.yellow) / availableDays);
    let totalNumOfVehichles = 0;
    for(let day in vehiclesPerDay){
      totalNumOfVehichles += Object.keys(vehiclesPerDay[day]).length
    }
    let numVehiclesPerDay = totalNumOfVehichles / availableDays;
    return (
      <div className="App">
        <h1 id="header">Real time taxi tracker</h1>
        <div className="totalTrips">
          <h6>Trips data</h6>
          <h1>Total trips per day: {tripsPerDay}</h1>
          <h1>Average vehichles per day: {numVehiclesPerDay}</h1>
          <h1>yellow: {totalTrips.yellow}</h1>
          <h1>green: {totalTrips.green}</h1>
          <h1>fhv: {totalTrips.fhv}</h1>
        </div>
        <div className="noDropTrips">
          <h6>No location id trips</h6>
          <h1>yellow cars no dropID: {noDropOffTrips.yellow}</h1>
          <h1>green cars no dropID: {noDropOffTrips.green}</h1>
          <h1>FHV cars no dropID: {noDropOffTrips.fhv}</h1>
        </div>
        <div className="minutesPerTrip">
          <h6>Average trip time in minutes</h6>
          <h1>Yellow average trip time: {tripsDuration.yellow / totalTrips.yellow}</h1>
          <h1>Green average trip time: {tripsDuration.green / totalTrips.green}</h1>
          <h1>FHV average trip time: {tripsDuration.fhv / totalTrips.fhv}</h1>
        </div>
        <div className="vehiclesPerDay">
          <h6>Days and vehicles</h6>
          {this.renderDays()}
        </div>
        <div id="btnSubmit">
          <button onClick={()=>this.getResults()}>Stop socket</button>
        </div>
      </div>
    );
  }
}

export default App;
