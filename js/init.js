// declare variables
let mapOptions = {'centerLngLat': [-117.1249034752926,32.83010864129698],'startingZoomLevel':12}


const map = new maplibregl.Map({
    container: 'map',
    style: 'https://api.maptiler.com/maps/streets-v2-light/style.json?key=wsyYBQjqRwKnNsZrtci1',
    center: mapOptions.centerLngLat,
    zoom: mapOptions.startingZoomLevel
});

function addMarker(lat,lng,title,message){
    let popup_message = `<h2>${title}</h2> <p>${message}</p>`
    new maplibregl.Marker({color:"purple"})
       .setLngLat([lng, lat])
       .setPopup(new maplibregl.Popup()
            .setHTML(popup_message))
         .addTo(map)
   return message
}

addMarker(32.83020780894479, -117.12492493296276, 'Kaiser Permanente San Diego Medical Center', 'Address: 9455 Clairemont Mesa Blvd, San Diego, CA 92123')


function linkPages(link, name){
    const newButton = document.createElement("button");
    newButton.id = "button" + name;
    newButton.innerHTML = name;
    newButton.addEventListener('click', function(){
        open(link)
    })
    document.getElementById("contents").appendChild(newButton);
}

//linkPages("http://127.0.0.1:5500/about.html", "About")
//linkPages("https://docs.google.com/forms/d/e/1FAIpQLScQ7vAbOnuIDIdvDw4DK-A2FCEsxusmI11FX7SJ2cem6rsgPw/viewform?usp=dialog", "Take Survey")
//linkPages("http://127.0.0.1:5500/mandarin.html", "Mandarin")

function createButtons(lat,lng,title){
    const newButton = document.createElement("button");
    newButton.id = "button"+title;
    newButton.innerHTML = title;
    newButton.setAttribute("lat",lat);
    newButton.setAttribute("lng",lng);
    newButton.addEventListener('click', function(){
        map.flyTo({
            center: [lng,lat],
        })
    })
    document.getElementById("contents").appendChild(newButton);
}

const dataUrl = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSIhm3kS1xQfN_W2-TQY9q7vWMyhxa-xdyKCO1a8JLEHUgqT-NCo_xzXiFRyUa8dlqIJkjZ7rkQHBb4/pubhtml'

// When the map is fully loaded, start adding GeoJSON data
map.on('load', function() {
    // Use PapaParse to fetch and parse the CSV data from a Google Forms spreadsheet URL
    Papa.parse(dataUrl, {
        download: true, // Tells PapaParse to fetch the CSV data from the URL
        header: true, // Assumes the first row of your CSV are column headers
        complete: results => {
            // Process the parsed data
            processData(results.data) // Use a new function to handle CSV data
        }
    });
});

function processData(results){
    //console.log(results) //for debugging: this can help us see if the results are what we want
    results.forEach(feature => {
        //console.log(feature) // for debugging: are we seeing each feature correctly?
        // assumes your geojson has a "title" and "message" attribute
        //let coordinates = feature.geometry.coordinates;
        //let longitude = feature.lng
        // let latitude = feature.lat;
        //let title = feature['What is your home zip code?'];
        //let message = feature['Which language do you need translation help in?'];
        //addMarker(latitude,longitude,title,message);
        addMarker(feature);
    });
}