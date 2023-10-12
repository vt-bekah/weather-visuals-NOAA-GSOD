// ## Capture the dropdown menus for global use

// Get the primary dropdown value from index.html reference by referencing it with d3 then storing it
let dropdownMenu = d3.select("#selDataset")
// Get the dropdown from index.html by referencing it with d3
let stateDDMenu = d3.select("#stateDataset")
// Get the Station dropdown from index.html by referencing it with d3
let stationDDMenu = d3.select("#stationSelect")

// ## Set global varaiables for each component
let data_values = {"Hottest" :  "max_temp",  "Coldest" : "min_temp",  "Severity" : "severity_rating"}
// Set the heatmap variables
let heatmapLayer;
let map;
let map_colors = {"Hottest" :  ["#fee0d2", "#fc9272", "#de2d26", "#c31e18", "#9c100b"],  
                    "Coldest" : ["#3182bd", "#1f71ab", "#0d588d", "#064674", "#023153"],
                    "Severity" : ["#efedf5", "#bcbddc", "#756bb1", "#5e5597", "#48407e"]}
let map_gradients = {"Hottest" :  { 0: "#fee0d2", 0.25: "#fc9272", 0.5: "#de2d26", 0.75: "#c31e18", 1: "#9c100b" },  
                    "Coldest" : {0: "#3182bd", 0.25: "#1f71ab", 0.5: "#0d588d", 0.75: "#064674", 1: "#023153"},
                    "Severity" : {0: "#efedf5", 0.25: "#bcbddc", 0.5: "#756bb1", 0.75: "#5e5597", 1: "#48407e"}}
let hover_text = {"Hottest" :  "2022 Absolute Max Temp",  
                "Coldest" : "2022 Absolute Min Temp",  
                "Severity" : "2022 Severity Rating"}
let radius_multiplier = {"Hottest" :  10,  "Coldest" : 10,  "Severity" : 250}
// Set the top10 dictionaries for Hottest vs. Coldest vs. Severity
let data_file = {"Hottest" :  "state_station_hot",  "Coldest" : "state_station_cold",  "Severity" : "state_station_severity"}
let data_sort = {"Hottest" :  "descending",  "Coldest" : "ascending",  "Severity" : "descending"}
let xAxisTitle = {"Hottest" : "Temperature (F)", "Coldest" : "Temperature (F)", "Severity" : "Rating"}
let yAxisSelection = {"Hottest" : "y", "Coldest" : "y2", "Severity" : "y"}
// Create a list of the table cell ids
let tableIDs = ["station_identifier", "min_temp", "mean_temp", "max_temp", "total_precipitation", "high_sndp_change_days", "days_with_tornado", "days_with_hail"]

// ## Get the Station Data
let stationsData = stations_all
console.log("data:", stationsData)

// ## Set up the dropdown menus 

// Set the list of state abbreviations for top 10 dropdown
let stateAbbs = ['AK', 'AL', 'AR', 'AZ', 'CA', 'CO', 'CT', 'DC', 'DE', 'FL', 'GA', 'HI', 'IA', 'ID', 
'IL', 'IN', 'KS', 'KY', 'LA', 'MA', 'MD', 'ME', 'MI', 'MN', 'MO', 'MS', 'MT', 'NC', 'ND', 'NE', 'NH', 
'NJ', 'NM', 'NV', 'NY', 'OH', 'OK', 'OR', 'PA', 'PR', 'RI', 'SC', 'SD', 'TN','TX', 'UT', 'VA', 'VI', 
'VT', 'WA', 'WI', 'WV', 'WY']
// Add the state abbreviation list to the menu by appending each one
stateAbbs.forEach((stateAbbs) => {
    stateDDMenu.append("option").text(stateAbbs).property("value", stateAbbs)
})

// Set up the dropdown menu for the table    
// Add the state + station name to the dropdown menu
stationsData.forEach((stationsData) => {
    stationDDMenu.append("option").text(stationsData.state + ': ' + stationsData.name).property("value", stationsData.usaf)
})

// ## Create the function to initialize the chart
function init(){
    // Get the drop down values
    let selectedWeather = dropdownMenu.property("value")
    let selectedState = stateDDMenu.property("value")
    let selectedStation = stationDDMenu.property("value")
    
    // Create the heatmap
    createHeatmap(selectedWeather)

    // Get the top 10 data
    let topTenStations = getTop10Data(selectedWeather, selectedState)
    console.log("top 10 data init:", topTenStations)
    //Plot the top 10 chart
    makeTop10Chart(topTenStations, selectedWeather)

    // Populate the table
    populateTable(selectedStation)
}

// ## Captures a change in dropdowns and re-initializes visuals
dropdownMenu.on("change", updateHeatTop10)
stateDDMenu.on("change", updateCharts)
stationDDMenu.on("change", updateTable)

// ## Create function tp call both update heatmap and charts for the primary dropdown
function updateHeatTop10(){
    updateHeatmap()
    updateCharts()
}

// ## Create a function to update the heatmap when the dropdown changes
function updateHeatmap() {
    // Get new dropdown value
    let newWeather = dropdownMenu.property("value")
    console.log("new selection", newWeather) 
    // clear old map
    map.remove()  
    // Plot the map
    createHeatmap(newWeather)
}

// ## Create function to generate heat map
function createHeatmap(weatherType) {

    let stations = stations_all;
    console.log("create map data: ", stations[0])
    
    const heatmapData = [];
  
    function getRadius(dataPoint, multiplier, mapType) {
        // Negative numbers are not handled well, so shifting the numbers
        if (mapType == "min_temp"){
            dataPoint = dataPoint + 75
        }
        return dataPoint * multiplier
    }
  
    function getColor(dataPoint, mapType) {
      const colors = map_colors[mapType];
      const index = Math.floor(dataPoint / 100) % colors.length;
      return colors[index];
    }
  
    stations.forEach(station => {
      const radius = getRadius(station[data_values[weatherType]], radius_multiplier[weatherType], data_values[weatherType]);
      const color = getColor(station[data_values[weatherType]], weatherType);
      const heatmapPoint = [station.lat, station.lon, radius]; 
      heatmapData.push(heatmapPoint);
    });
  
    heatmapLayer = L.heatLayer(heatmapData, {
      radius: 20, // Adjust the default radius as needed
      gradient: map_gradients[weatherType] // Specify gradient colors
    });
  
    const streetmap = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    });
  
    // initiate the map centered on continental U.S.
    map = L.map("heatmap", {
      center: [39.83, -98.58],
      zoom: 5,
      layers: [streetmap, heatmapLayer]
    });
  
    stations.forEach(station => {
      const circleMarker = L.circleMarker([station.lat, station.lon], {
        radius: 10,  // Adjust the radius as needed for the desired dot size
        fillColor: "rgba(0, 0, 0, 0)",  // Transparent color
        fillOpacity: 1,
        stroke: false
      });
  
      circleMarker.bindPopup(`<h4>${station.usaf}: ${station.name}, ${station.state}</h4><h5>${hover_text[[weatherType]]}: ${station[data_values[weatherType]]}</h5>`);
      circleMarker.addTo(map);
    });
  
    // Update the legend
    createLegend(weatherType);
}

// ## Create a function to generate the legend
function createLegend(weatherType) {
    const legendContainer = document.getElementById('legend');
    const gradients = map_gradients[weatherType];
  
    // Define the custom order of legend positions
    const customOrder = [0, 0.25, 0.5, 0.75, 1];
  
    // Clear the existing legend
    legendContainer.innerHTML = '';
  
    // Iterate over the custom order and generate legend items
    customOrder.forEach(position => {
      const color = gradients[position];
      const legendItem = document.createElement('div');
      legendItem.className = 'legend-item';
      legendItem.innerHTML = `
        <div class="legend-color" style="background-color: ${color};"></div>
        <div class="legend-label">${(position * 100).toFixed(0)}% - ${(parseFloat(position) + 0.25) * 100}%</div>
      `;
      legendContainer.appendChild(legendItem);
    });
  
    // Apply CSS styles to the legend container
    // Object.assign(legendContainer.style, legendContainerStyle);
}

// ## Create function to get new property value and update top 10 chart
function updateCharts() {
    // Get new drop down values
    let selectedWeather = dropdownMenu.property("value")
    let selectedState = stateDDMenu.property("value")
    // Get the data
    let topTenStations = getTop10Data(selectedWeather, selectedState)
    console.log("top data update:", topTenStations)
    //Plot the chart
    makeTop10Chart(topTenStations, selectedWeather)
}

// ## Create function to filter and sort the data based on page inputs data = stations_all
function getTop10Data(weather_type, selectedState) {

    console.log("weather type get", weather_type)
    console.log("state get", selectedState)
    // Filter the data by desired state
    let stateStations = stations_all.filter(data => data.state == selectedState)
    // console.log("data:", stateStations)

    // Sort data based on defined order; don't sort if not defined
    let sortedStStations

    if (data_sort[weather_type] == "descending"){
        // Sort the data by descending
        sortedStStations = stateStations.sort((a, b) => b[data_values[weather_type]] - a[data_values[weather_type]])    
        console.log("desc sorted: ", sortedStStations)
    }
    else if (data_sort[weather_type] == "ascending"){
        // Sort the data by ascending
        sortedStStations = stateStations.sort((a, b) => a[data_values[weather_type]] - b[data_values[weather_type]])
        console.log("asc sorted: ", sortedStStations)
    }
    else {
        sortedStStations = stateStations
        console.log("no sort: ", sortedStStations)
    }

    // console.log("sorted: ", sortedStStations)

    // Slice the first 10 objects for plotting
    let topTen = sortedStStations.slice(0,10)
    console.log("top10 data get:", topTen)

    return topTen
}

// ## Create a function for the horizontal bar chart plot
function makeTop10Chart(topTenStations, weather_type) {
    // Reverse the array to accommodate Plotly's defaults (note to self: reverse operates on the original array!)
    topTenStations.reverse()
    // console.log("top reverse:", topTenStations)

    // Horizontal bar chart trace for the Data
    let trace1 = {
        y: topTenStations.map(item => item.name),
        x: topTenStations.map(item => item[data_values[weather_type]]),
        type: 'bar',
        orientation: 'h',
        marker: {color: "#6c6c6c"},
        yaxis: yAxisSelection[weather_type]
    }

    // Apply a title to the layout
    let layout = {
        title: {
            text: "<b>Top 10 Stations by Selected State <br> & Weather Condition</b>",
            font: {size: 20}
        }, 
        xaxis:{title: xAxisTitle[weather_type]},
        plot_bgcolor:"#f5f6d8",
        paper_bgcolor:"#e6e7d1",
        // Prevent labels from being cutoff
        yaxis: {automargin: true},
        yaxis2: {side: 'right', automargin: true}
    }

    // Render the plot to the div tag with id "plot"
    Plotly.newPlot("top10_plot", [trace1], layout)
}

// ## Create function to get new property value and update table
function updateTable() {
    // Get new drop down values
    let newStation = stationDDMenu.property("value")
    //Update the table
    populateTable(newStation)
}

// ## Create a function for populating the table
function populateTable(selectedStation) {
    // Get the single station data
    let station = stations_all.filter(data => data.usaf == selectedStation)
    console.log("populate station data:", station)
    // Update the header by selecting the header by id and then changing text
    let header = d3.select("#" + tableIDs[0])
    header.text("2022 Summary: " + station[0].usaf + " " + station[0].name + ", " + station[0].state)
    console.log("populate header", station[0].name)
    // Iterate through the data ids to update the table
    for (i=1; i < tableIDs.length; i++){
        let cell = d3.select("#" + tableIDs[i])
        cell.text(station[0][tableIDs[i]])
        // console.log("tableID data", station[0][tableIDs[i]])
    }  
}

init()