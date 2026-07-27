const dataUrl = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSIhm3kS1xQfN_W2-TQY9q7vWMyhxa-xdyKCO1a8JLEHUgqT-NCo_xzXiFRyUa8dlqIJkjZ7rkQHBb4/pub?output=csv'

// declare variables
let mapOptions = {'centerLngLat': [-117.1249034752926,32.83010864129698],'startingZoomLevel':10}

let zipcode_response_data = [];
let zipcodePolygons;

loadSurveyResponse();

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

fetch('js/ZIP_CODES_20260725.geojson').then(
    response => response.json()
).then(
    data => {
        // map.addSource('zipcodes', { //geojson info into zipcodes layer
        //     'type': 'geojson',
        //     'data': data
        // });
        zipcodePolygons = data;


        // addToZipcode(data);

        // map.addLayer({
        //     'id': 'zipcodes', // access layer by id later
        //     'type': 'fill',
        //     'source': 'zipcodes',
        //     'paint': {
        //     'fill-color': '#088',
        //     'fill-opacity': 0.8
        // }
        
        // });
    }
);

joinSurveyDataToZipcodePolygons()

function addToZipcode(surveyData){
    // filter out no zipcode
    // console.log('running add to zipcode')
    console.log('copy me!')
    console.log(surveyData);

    if (surveyData['lat']){
        let zipcode = surveyData["What is your home zip code? \n\n你家的邮政编码是多少？"]
        let language = surveyData["Which language do you need translation help in?\n\n您需要哪种语言的翻译帮助？"]
        let word_rating = surveyData["How would you rate this translation service?\n\n您如何评价这项翻译服务？"]
        let explanation = surveyData["Why did you rate your experience this way?\n\n为什么你的体验是这样的？"]
        let services = surveyData["During my visit, I was offered...\n\n在访问期间，我获赠了……"]
        console.log(`language: \n ${language}`)
        console.log(`checking: \n ${zipcode}`)
        console.log(surveyData)

        let rating = convertRatingWordToNumerical(word_rating);
        console.log(rating)

        addSurveyDataToZipcode(zipcode, language, rating, explanation, services,surveyData)
    }
}

function convertRatingWordToNumerical(rating){
    let value;
    if (rating.includes("Good")){
        value = 4;
    }
    if (rating.includes("Fair")){
        value = 3
    }
    if (rating.includes("Poor")){
        value = 2
    }
    if (rating.includes("Very poor")){
        value = 1
    }
    return value
}

function addSurveyDataToZipcode(zipcode, language, rating, explanation, services,surveyData){
    //"92410" = [{language:"mandarin": 0,"cantonese":2, "averageRating":"4.4"}]
    //"92411" = [{language:"mandarin": 1,"cantonese":0}]
    //"92410" = [{language:"mandarin": 0,"cantonese":1, "avg_rating":"1"}]

    let zipcodeEntry = zipcode_response_data.find(function (entry){ //only adding same zipcode once
        return entry.zipcode === zipcode;
    });

    if (zipcodeEntry === undefined){
        zipcodeEntry = { // structuring array
            zipcode: zipcode,
            numberOfResponses: 0,
            allRatings: [],
            averageRating: 0,
            languageCounts: {},
            allResponses:[]
        };
        zipcode_response_data.push(zipcodeEntry);
    }
    zipcodeEntry.numberOfResponses = zipcodeEntry.numberOfResponses + 1;
    zipcodeEntry.allRatings.push(rating)
    // sum(rating) / numberOfResponses
    // let averageRating;
    const initialValue = 0;
    zipcodeEntry.averageRating = zipcodeEntry.allRatings.reduce((accumulator, currentValue) => accumulator + currentValue,
    initialValue,) / zipcodeEntry.numberOfResponses

    let languageCount;
    if(language){
        let previousCount = zipcodeEntry.languageCounts[language];
        if(previousCount === undefined){
            previousCount = 0;
        }
        zipcodeEntry.languageCounts[language] = previousCount + 1;
    }

    zipcodeEntry.allResponses.push(surveyData)

    // zipcode_response_data.push()

}

//run after joining the data
function joinSurveyDataToZipcodePolygons(){
    let polygonsWithData = [];

    // console.log(zipcodePolygons)
    for (let polygon of zipcodePolygons.features){
        let polygonZipcode = polygon.properties.zip;
        let zipcodeEntry = zipcode_response_data.find(function (entry){ //only adding same zipcode once
            return  entry.zipcode === polygonZipcode;
        });
        if (zipcodeEntry == undefined){
            continue;
        }

        
        polygon.properties.numberOfResponses = zipcodeEntry.numberOfResponses;
        polygon.properties.averageRating = zipcodeEntry.averageRating;
        polygon.properties.languageCounts = zipcodeEntry.languageCounts
        polygon.properties.allResponses = zipcodeEntry.allResponses
        // console.log(polygon)
        polygonsWithData.push(polygon)
    }
    return{
        type:"FeatureCollection",
        features:polygonsWithData
    };  
}

function linkPages(link, name){
    console.log(link)
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


// When the map is fully loaded, start adding GeoJSON data
map.on('load', function() {
    // Note: if you want to run something on map load.. probably add zipcode to map?
});

function loadSurveyResponse(){
    Papa.parse(dataUrl, {
        download: true, // Tells PapaParse to fetch the CSV data from the URL
        header: true, // Assumes the first row of your CSV are column headers
        complete: results => {
            // Process the parsed data
            processData(results.data) // Use a new function to handle CSV data
        }
    });
}

function empty(elementname) {
    elementname.innerHTML="";
}

function process_each_response_inzipcode(data){ //data is array of allResponses for given zipcode
    region= document.getElementById("contents");
    let explanation = data["Why did you rate your experience this way?\n\n为什么你的体验是这样的？"]
    console.log(explanation)
    // replace old testimony with new
    let explanationText= document.createTextNode(`${explanation}`);
    region.appendChild(explanationText); 
}

    
    // for (single_data of data){
    //     zipcode_response_data
    // }


function processData(results){
    // console.log(results) //for debugging: this can help us see if the results are what we want
    results.forEach(feature => {
        console.log('process data for each')
        //console.log(feature) // for debugging: are we seeing each feature correctly?
        // assumes your geojson has a "title" and "message" attribute
        //let coordinates = feature.geometry.coordinates;
        //let longitude = feature.lng
        // let latitude = feature.lat;
        //let title = feature['What is your home zip code?'];
        //let message = feature['Which language do you need translation help in?'];
        //addMarker(latitude,longitude,title,message);
        // addMarker(feature);
        addToZipcode(feature);
    });
    let zipcodesWishResponses = joinSurveyDataToZipcodePolygons();
    map.addSource("zips",{type:"geojson",data:zipcodesWishResponses});
    // HERE!!!
    const layers = map.getStyle().layers;
    const firstSymbolId = layers.find(layer => layer.type === 'symbol').id;
    map.addLayer(
          {
            'id': 'zips',
            'source': 'zips',
            'type': 'fill',
            'paint': {
              'fill-color': [
                  'interpolate',
                  ['linear'],
                  ['get', 'averageRating'],
                  1,
                  '#ed4209',
                  2,
                  '#ef8d0c',
                  3,
                  '#eaea11',
                  4,
                  '#01d954',
                ],
                'fill-opacity': 1,
                'fill-outline-color': '#000'
            }
          },
          firstSymbolId   
        );

        region= document.getElementById("contents");
        let introText= document.createTextNode('Click a region on the map to get started.');
        region.appendChild(introText);

        map.on('click', 'zips', function (event) { //event is click
        //   let target_content = Document.getElementById("awesomeInfoWindow") //div in ()
        //const new_content = document.createElement("div");
        //   console.log(event.features[0].properties.zip)
        let zipcode_of_clicked_polygon = event.features[0].properties.zip
        console.log('zipcode_of_clicked_polygon')
        console.log(zipcode_of_clicked_polygon)

        // this will allow you to do something with the specific zipcode you clicked 
        let zipcode_filter = zipcode_response_data.filter(function (entry) {
                return entry.zipcode === zipcode_of_clicked_polygon;
        })[0];

        // this changes on click
        let filteredZipcodeResponses = zipcode_filter.allResponses;

        console.log(filteredZipcodeResponses)

        // let explanation = surveyData["Why did you rate your experience this way?\n\n为什么你的体验是这样的？"]

        empty(region); // will empty after clicking map region

        filteredZipcodeResponses.forEach(
            data => process_each_response_inzipcode(data) // will fill with regional testimonies
        )
        });

        map.on('click', 'zips', function (event) { //event is click
            let surveyStuff = event.features[0].properties
            console.log(surveyStuff)
            new maplibregl.Popup()
            .setLngLat(event.lngLat)
            .setHTML(`<h3>${surveyStuff.zip}    Average ratings</h3><p>${surveyStuff.averageRating}</p>`)
            .addTo(map);
        });
}
