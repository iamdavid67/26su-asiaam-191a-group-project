const dataUrl = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSIhm3kS1xQfN_W2-TQY9q7vWMyhxa-xdyKCO1a8JLEHUgqT-NCo_xzXiFRyUa8dlqIJkjZ7rkQHBb4/pub?output=csv'

// declare variables
let mapOptions = {'centerLngLat': [-117.1249034752926,32.83010864129698],'startingZoomLevel':10}

let zipcode_response_data = [];
let zipcodePolygons;

let mandarinSurveyData;
let cantoneseSurveyData;
let allSurveyData;

let justMandarin;
let justMandarin_verypoor;
let justMandarin_poor;

let justCanto;
let justCanto_verypoor;
let justCanto_poor;

let bothlang;
let bothlang_verypoor;
let bothlang_poor;

let currentLanguageFilter = null;
let currentLanguageGroup = null;

let serviceTypeLabels = ["in-person interpreter", "virtual interpreter", "bilingual staff", "translated paperwork", "other"]

//
let justMandarin_inperson
let justMandarin_virtual
let justMandarin_bilingual
let justMandarin_forms
let justMandarin_noneAbove
let JM_inperson_proportion
let JM_virtual_proportion
let JM_bilingual_proportion
let JM_forms_proportion
let JM_noneAbove_proportion
let justCanto_inperson
let justCanto_virtual
let justCanto_bilingual
let justCanto_forms
let justCanto_noneAbove
let JC_inperson_proportion
let JC_virtual_proportion
let JC_bilingual_proportion
let JC_forms_proportion
let JC_noneAbove_proportion
let bothlang_inperson
let bothlang_virtual
let bothlang_bilingual
let bothlang_forms
let bothlang_noneAbove
let B_inperson_proportion
let B_virtual_proportion
let B_bilingual_proportion
let B_forms_proportion
let B_noneAbove_proportion

let languageChart;
loadSurveyResponse();

let serviceColors = ['rgb(218, 165, 219)', 'rgb(152, 170, 234)', 'rgb(149, 167, 157)', 'rgb(103, 143, 146)','rgb(204, 209, 192)'
    
]

const map = new maplibregl.Map({
    container: 'map',
    style: 'https://api.maptiler.com/maps/streets-v2-light/style.json?key=wsyYBQjqRwKnNsZrtci1',
    center: mapOptions.centerLngLat,
    zoom: mapOptions.startingZoomLevel
});

map.addControl(new maplibregl.NavigationControl(), "top-right");

class GradientLegendControl {
    onAdd(map) {
        this.map = map;
        this.container = document.createElement("div");
        this.container.className = "maplibregl-ctrl maplibregl-ctrl-group legend";
        this.container.innerHTML = `
        <div class="legend-title">Experience</div>
        <div class="legend-gradient"></div>
        <div class="legend-labels">
            <span>Very poor</span>
            <span>Good</span>
        </div>
        `;
        return this.container;
    }
}

map.addControl(new GradientLegendControl(), "bottom-left");

function drawBarChart(language,proportions){
    currentLanguageFilter = language;
    let targetLanguageGroup; 
    if ("Mandarin")
        targetLanguageGroup = justMandarin
    if ("Cantonese")
        targetLanguageGroup = justCanto
    if ("Mandarin and Cantonese")
        targetLanguageGroup = bothlang

    currentLanguageGroup = targetLanguageGroup

    console.log(currentLanguageFilter)
// we are taking in the variables in this order:
// inperson virtual bilingual forms noneAbove
    document.getElementById("languagestats").innerHTML =
    `<h3>Services used by ${language} speakers: </h3>
    <canvas id="serviceChart"></canvas>;
    `
    document.getElementById("languagestats").style.backgroundColor = " antiquewhite "
    document.getElementById("languagestats").style.borderRadius = "10px";
    
    let chartContext = document.getElementById("serviceChart").getContext("2d")
    console.log(chartContext)
    if (languageChart){
        languageChart.destroy();
    }
    languageChart = new Chart(
    chartContext,
    {
      type: 'bar',
      data: {
        labels: serviceTypeLabels,
        datasets: [
          {
            //label: "% of "+language+ " speakers",
            data: proportions,
            backgroundColor: serviceColors
          }
        ],
      },
    options: {
        plugins:{
            legend: {
                display: false
             },
             tooltips: {
                enabled: false
            }

        },
        }
    }
  );
  document.getElementById("serviceChart").addEventListener('click', filterMap, false);
    
}

function filterMap(click){
    let clickedElements = languageChart.getElementsAtEventForMode(
        click,
        'nearest',
        {intersect:true},
        true
    );
    console.log(clickedElements)
    
    if (clickedElements.length === 0){ // is any bar clicked? if not, do nothing
        console.log('you didnt on the chart')
        return;
    }
    
    let clickedBarIndex = clickedElements[0].index;
    let clickedServiceType = serviceTypeLabels[clickedBarIndex];
    console.log(clickedServiceType)
    console.log('this is the langauge currently selected')
    console.log(`${currentLanguageFilter}`)

    let matchingResponses = currentLanguageGroup.filter(
        function (entry){
            console.log(entry)
            return entry["During my visit, I was offered...\n\n在访问期间，我获赠了……"]
        });

    empty(document.getElementById("contents"));
    generate_response_header(clickedServiceType);
    matchingResponses.forEach(
        data => process_each_response_inzipcode(data)
    )

}


function addMarker(lat,lng,title,message){
    let popup_message = `<h2>${title}</h2> <p>${message}</p>`
    new maplibregl.Marker({color:"purple"})
       .setLngLat([lng, lat])
       .setPopup(new maplibregl.Popup()
            .setHTML(popup_message))
         .addTo(map)
   return message
}

//adding custom icon to map

const geojson = {
    'type': 'FeatureCollection',
    'features': [
        {
            'type': 'Feature',
            'properties': {
                'message': 'Medical',
                'iconSize': [262, 262]
            },
            'geometry': {
                'type': 'Point',
                'coordinates': [-117.12492493296276, 32.83020780894479]
            }
        },
    ]
};





geojson.features.forEach((marker) => {
    // create a DOM element for the marker
    const el = document.createElement('div');
    el.className = 'marker';
    el.style.backgroundImage =
        `url(kp_logo.png)`;
    el.style.backgroundSize = "contain";
    el.style.width = "60px";
    el.style.height = "60px";
    el.style.borderRadius = "100%"; // fix later
    el.style.border = "solid"; //type
    el.style.borderWidth = "1px";
    //el.style.iconSize(2)
    new maplibregl.Popup()
            .setHTML(marker.properties.message);
    //el.addEventListener('click', () => {
        //(marker.properties.message);
    new maplibregl.Marker({element: el})
        .setLngLat(marker.geometry.coordinates)
        .addTo(map);
        //maybe legend?
});



//addMarker(32.83020780894479, -117.12492493296276, 'Kaiser Permanente San Diego Medical Center', 'Address: 9455 Clairemont Mesa Blvd, San Diego, CA 92123')

fetch('js/ZIP_CODES_20260725.geojson').then(
    response => response.json()
).then(
    data => {
        // map.addSource('zipcodes', { //geojson info into zipcodes layer
        //     'type': 'geojson',
        //     'data': data
        // });
        zipcodePolygons = data;
        joinSurveyDataToZipcodePolygons() // after zipcode data loaded

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



function addToZipcode(surveyData){
    // filter out no zipcode
    // console.log('running add to zipcode')
    //console.log('copy me!')
    //console.log(surveyData);

    if (surveyData['lat']){
        let zipcode = surveyData["What is your home zip code? \n\n你家的邮政编码是多少？"]
        let language = surveyData["Which language do you need translation help in?\n\n您需要哪种语言的翻译帮助？"]
        let word_rating = surveyData["How would you rate this translation service?\n\n您如何评价这项翻译服务？"]
        let explanation = surveyData["Why did you rate your experience this way?\n\n为什么你的体验是这样的？"]
        let services = surveyData["During my visit, I was offered...\n\n在访问期间，我获赠了……"]
        //console.log(`language: \n ${language}`)
        //console.log(`checking: \n ${zipcode}`)
        //console.log(surveyData)

        let rating = convertRatingWordToNumerical(word_rating);

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
init()
function init(){
    const el = document.createElement('div');
    el.className = 'custom-marker'; // Add a class for styling
    el.style.backgroundImage = 'url(kp_logo.png)'; // Custom icon URL
    el.style.width = '25px'; // Width of the marker
    el.style.height = '25px'; // Height of the marker
    new maplibregl.Marker({ element: el })
        .setLngLat([-117.12492493296276, 32.73020780894479]) // Set marker position
        .addTo(map); // Add marker to the map
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
init()


function process_each_response_inzipcode(data){ //data is array of objects (individual entries) for given zipcode
    console.log(data)
    const newResponse = document.createElement("div");
    let explanation = data["Why did you rate your experience this way?\n\n为什么你的体验是这样的？"];
    console.log(explanation)
    newResponse.id = "div"+explanation;
    newResponse.innerHTML = 
    `<div class="card"> 
            <div class="container">
            <h4><b>Rating: ${data["How would you rate this translation service?\n\n您如何评价这项翻译服务？"]}</b></h4>
            <p>${explanation}</p>
            </div>
    </div>`;
    if (data["How would you rate this translation service?\n\n您如何评价这项翻译服务？"].includes("Very poor")){
        newResponse.style.backgroundColor = "#f78b85"
    }
    if (data["How would you rate this translation service?\n\n您如何评价这项翻译服务？"].includes("Poor")){
        newResponse.style.backgroundColor = "#f7c285"
    }
    if (data["How would you rate this translation service?\n\n您如何评价这项翻译服务？"].includes("Fair")){
        newResponse.style.backgroundColor = "#f7ef85"
    }
    if (data["How would you rate this translation service?\n\n您如何评价这项翻译服务？"].includes("Good")){
        newResponse.style.backgroundColor = "#baceb2"
    }
    document.getElementById("contents").appendChild(newResponse);
   

    // return formatted_response
};

function poor_tally(individualentry){
    let tally = 0;
    if (individualentry["How would you rate this translation service?\n\n您如何评价这项翻译服务？"].includes("Poor")) {
        tally = tally + 1 
        };
    if (individualentry["How would you rate this translation service?\n\n您如何评价这项翻译服务？"].includes("Very poor")) {
        tally = tally + 1 
        };
    return tally;
    console.log(tally);
    }


function format_each_response(response){
    console.log('formatting this response')
    console.log(response)
};


function LanguageButton(languagetype){
    console.log("starting buttons")
    const newButton = document.createElement("button");
    newButton.id = "hi";
    newButton.innerHTML = languagetype;
    newButton.addEventListener('click', function(){
        console.log("pressed language button")
        })
    document.getElementById("contents").appendChild(newButton);
};

//LanguageButton("Chinese")


let hello;

let langauges= ["Mandarin (普通话)","Cantonese (广东话)","Mandarin and Cantonese (普通话与粤语)"]

function processData(results){
    console.log(results);
    // let test 
    justMandarin = results.filter((eachEntry) => eachEntry["Which language do you need translation help in?\n\n您需要哪种语言的翻译帮助？"].includes("Mandarin (普通话)"));
    justMandarin_verypoor = justMandarin.filter((Mandarinentry) => Mandarinentry["How would you rate this translation service?\n\n您如何评价这项翻译服务？"].includes("Very poor"));
    justMandarin_poor = justMandarin.filter((Mandarinentry) => Mandarinentry["How would you rate this translation service?\n\n您如何评价这项翻译服务？"].includes("Poor"));
    let Mandarinpercentage = 100*(justMandarin_verypoor.length + justMandarin_poor.length) / justMandarin.length;
    console.log(Mandarinpercentage);
    justCanto = results.filter((eachEntry) => eachEntry["Which language do you need translation help in?\n\n您需要哪种语言的翻译帮助？"].includes("Cantonese (广东话)"));
    justCanto_verypoor = justCanto.filter((Cantoentry) => Cantoentry["How would you rate this translation service?\n\n您如何评价这项翻译服务？"].includes("Very poor"));
    justCanto_poor = justCanto.filter((Cantoentry) => Cantoentry["How would you rate this translation service?\n\n您如何评价这项翻译服务？"].includes("Poor"));
    let Cantopercentage = 100*(justCanto_verypoor.length + justCanto_poor.length) / justCanto.length;
    console.log(Cantopercentage);
    document.getElementById("Mandarinbutton").appendChild(document.createTextNode(`${Mandarinpercentage}%`));
    document.getElementById("Cantonesebutton").appendChild(document.createTextNode(`${Cantopercentage}%`));
    bothlang = results.filter((eachEntry) => eachEntry["Which language do you need translation help in?\n\n您需要哪种语言的翻译帮助？"].includes("Mandarin and Cantonese (普通话与粤语)"));
    bothlang_verypoor = bothlang.filter((entry) => entry["How would you rate this translation service?\n\n您如何评价这项翻译服务？"].includes("Very poor"));
    bothlang_poor = bothlang.filter((entry) => entry["How would you rate this translation service?\n\n您如何评价这项翻译服务？"].includes("Poor"));
    let bothlangpercentage = 100*(bothlang_verypoor.length + bothlang_poor.length) / bothlang.length;
    console.log(bothlangpercentage);
    document.getElementById("Bothbutton").appendChild(document.createTextNode(`${bothlangpercentage}%`));
    // console.log(results) //for debugging: this can help us see if the results are what we want
    results.forEach(feature => {
        // console.log('process data for each')
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

        let region = document.getElementById("contents");
        let introText= document.createTextNode('Click a zipcode region on the map to get started.');
        region.appendChild(introText);

        map.on('click', 'zips', function (event) { //event is click
        //   let target_content = Document.getElementById("awesomeInfoWindow") //div in ()
        //const new_content = document.createElement("div");
        //   console.log(event.features[0].properties.zip)
        let zipcode_of_clicked_polygon = event.features[0].properties.zip
        //console.log('zipcode_of_clicked_polygon')
        //console.log(zipcode_of_clicked_polygon)

        // this will allow you to do something with the specific zipcode you clicked 
        let zipcode_filter = zipcode_response_data.filter(function (entry) {
                return entry.zipcode === zipcode_of_clicked_polygon;
        })[0];

        // this changes on click
        let filteredZipcodeResponses = zipcode_filter.allResponses;

        //console.log(filteredZipcodeResponses)

        
        // let explanation = surveyData["Why did you rate your experience this way?\n\n为什么你的体验是这样的？"]

        empty(region); // will empty after clicking map region
        let prepare_response_container = `<h3>Responses</h3>`
        let responses_div = "";

        generate_response_header(zipcode_of_clicked_polygon) 


        filteredZipcodeResponses.forEach( // go through each individual response
            data => process_each_response_inzipcode(data) // will fill with regional testimonies
        ) // data is an array of objects
        });

        // region.appendChild(`${prepare_response_container} ${responses_div}`)

        map.on('click', 'zips', function (event) { //event is click
            let surveyStuff = event.features[0].properties
            //console.log(surveyStuff)
            new maplibregl.Popup()
            .setLngLat(event.lngLat)
            .setHTML(`<h3>${surveyStuff.zip} </h3> <h4>  Average rating: ${surveyStuff.averageRating}</h4>`)
            .addTo(map);
            console.log(surveyStuff) 
            surveyStuff.allResponses.forEach((oneentry) => {
                displayEntryOfZipcodes(oneentry)})
            })
            //response after clicking mandarin
        document.getElementById("Mandarinbutton").addEventListener('click', function(){
            document.getElementById("languagestats").innerHTML="";
            console.log("mandarin button")
            justMandarin_inperson = justMandarin.filter((Mandarinentry) => Mandarinentry["During my visit, I was offered...\n\n在访问期间，我获赠了……"].includes("In-person interpreter (现场口译员)"));
            justMandarin_virtual = justMandarin.filter((Mandarinentry) => Mandarinentry["During my visit, I was offered...\n\n在访问期间，我获赠了……"].includes("Virtual interpreter (虚拟口译员)"));
            justMandarin_bilingual = justMandarin.filter((Mandarinentry) => Mandarinentry["During my visit, I was offered...\n\n在访问期间，我获赠了……"].includes("Bilingual staff"));
            justMandarin_forms = justMandarin.filter((Mandarinentry) => Mandarinentry["During my visit, I was offered...\n\n在访问期间，我获赠了……"].includes("Forms/papers translated"));
            justMandarin_noneAbove = justMandarin.filter((Mandarinentry) => Mandarinentry["During my visit, I was offered...\n\n在访问期间，我获赠了……"].includes("None of the above"));
            JM_inperson_proportion = 100* justMandarin_inperson.length / justMandarin.length;
            JM_virtual_proportion = 100* justMandarin_virtual.length / justMandarin.length;
            JM_bilingual_proportion = 100* justMandarin_bilingual.length / justMandarin.length;
            JM_forms_proportion = 100* justMandarin_forms.length / justMandarin.length;
            JM_noneAbove_proportion = 100* justMandarin_noneAbove.length / justMandarin.length;

            // document.getElementById("languagestats").setHTML(`<h3>Services used by Mandarin speakers:</h3> ${JM_inperson_proportion}% had in-person interpreters.<br />${JM_virtual_proportion}% had virtual interpreters.<br />${JM_bilingual_proportion}% had bilingual staff.<br />${JM_forms_proportion}% had translated forms and paperwork.<br /> ${JM_noneAbove_proportion}% had other services.`);
            // document.getElementById("languagestats").style.backgroundColor= " rgb(188, 187, 187)";
            // document.getElementById("languagestats").style.borderRadius = "10px" });
            drawBarChart("Mandarin", [JM_inperson_proportion, JM_virtual_proportion, JM_bilingual_proportion, JM_forms_proportion, JM_noneAbove_proportion])});
        
            //response after clicking cantonese
            document.getElementById("Cantonesebutton").addEventListener('click', function(){
            document.getElementById("languagestats").innerHTML="";
            console.log("mandarin button")
            justCanto_inperson = justCanto.filter((entry) => entry["During my visit, I was offered...\n\n在访问期间，我获赠了……"].includes("In-person interpreter (现场口译员)"));
            justCanto_virtual = justCanto.filter((entry) => entry["During my visit, I was offered...\n\n在访问期间，我获赠了……"].includes("Virtual interpreter (虚拟口译员)"));
            justCanto_bilingual = justCanto.filter((entry) => entry["During my visit, I was offered...\n\n在访问期间，我获赠了……"].includes("Bilingual staff"));
            justCanto_forms = justCanto.filter((entry) => entry["During my visit, I was offered...\n\n在访问期间，我获赠了……"].includes("Forms/papers translated"));
            justCanto_noneAbove = justCanto.filter((entry) => entry["During my visit, I was offered...\n\n在访问期间，我获赠了……"].includes("None of the above"));
            JC_inperson_proportion = 100* justCanto_inperson.length / justCanto.length;
            JC_virtual_proportion = 100* justCanto_virtual.length / justCanto.length;
            JC_bilingual_proportion = 100* justCanto_bilingual.length / justCanto.length;
            JC_forms_proportion = 100* justCanto_forms.length / justCanto.length;
            JC_noneAbove_proportion = 100* justCanto_noneAbove.length / justCanto.length;

            // document.getElementById("languagestats").setHTML(`<h3>Services used by Cantonese speakers:</h3> ${JC_inperson_proportion}% had in-person interpreters.<br />${JC_virtual_proportion}% had virtual interpreters.<br />${JC_bilingual_proportion}% had bilingual staff.<br />${JC_forms_proportion}% had translated forms and paperwork.<br /> ${JC_noneAbove_proportion}% had other services.`);
            // document.getElementById("languagestats").style.backgroundColor= " rgb(188, 187, 187)";
            // document.getElementById("languagestats").style.borderRadius = "10px";
            drawBarChart("Cantonese", [JC_inperson_proportion, JC_virtual_proportion, JC_bilingual_proportion, JC_forms_proportion, JC_noneAbove_proportion]);

        });
            //response after clicking both languages
             document.getElementById("Bothbutton").addEventListener('click', function(){
            document.getElementById("languagestats").innerHTML="";
            console.log("both button")
            bothlang_inperson = bothlang.filter((entry) => entry["During my visit, I was offered...\n\n在访问期间，我获赠了……"].includes("In-person interpreter (现场口译员)"));
            bothlang_virtual = bothlang.filter((entry) => entry["During my visit, I was offered...\n\n在访问期间，我获赠了……"].includes("Virtual interpreter (虚拟口译员)"));
            bothlang_bilingual = bothlang.filter((entry) => entry["During my visit, I was offered...\n\n在访问期间，我获赠了……"].includes("Bilingual staff"));
            bothlang_forms = bothlang.filter((entry) => entry["During my visit, I was offered...\n\n在访问期间，我获赠了……"].includes("Forms/papers translated"));
            bothlang_noneAbove = bothlang.filter((entry) => entry["During my visit, I was offered...\n\n在访问期间，我获赠了……"].includes("None of the above"));
            B_inperson_proportion = 100* bothlang_inperson.length / bothlang.length;
            B_virtual_proportion = 100* bothlang_virtual.length / bothlang.length;
            B_bilingual_proportion = 100* bothlang_bilingual.length / bothlang.length;
            B_forms_proportion = 100* bothlang_forms.length / bothlang.length;
            B_noneAbove_proportion = 100* bothlang_noneAbove.length / bothlang.length;

            //document.getElementById("languagestats").setHTML(`<h3>Services used by Cantonese speakers:</h3> ${B_inperson_proportion}% had in-person interpreters.<br />${B_virtual_proportion}% had virtual interpreters.<br />${B_bilingual_proportion}% had bilingual staff.<br />${B_forms_proportion}% had translated forms and paperwork.<br /> ${B_noneAbove_proportion}% had other services.`);
            //document.getElementById("languagestats").style.backgroundColor= " rgb(188, 187, 187)";
            //document.getElementById("languagestats").style.borderRadius = "10px";

            drawBarChart("Mandarin and Cantonese", [B_inperson_proportion, B_virtual_proportion, B_bilingual_proportion, B_forms_proportion, B_noneAbove_proportion]);

      
        }); 

        }

    

function generate_response_header(zipcode){
    const response_header = document.createElement("div");
    response_header.innerHTML =  `<h3>Responses for ${zipcode}</h3>`;
    document.getElementById("contents").appendChild(response_header);

}


function displayEntryOfZipcodes(){

    console.log("this zipcodes record:")
    console.log(record)
    //console.log(`${oneentry["Why did you rate your experience this way?\n\n为什么你的体验是这样的？"]}`)
    const entrytext = document.createTextNode(`${oneentry["Why did you rate your experience this way?\n\n为什么你的体验是这样的？"]}`);
    const newDiv=document.createElement("div")
    newDiv.appendChild(entrytext);
    const currentDiv = document.getElementById("contents");
    document.body.insertBefore(newDiv, currentDiv);
}

    //let indexOfFirst = surveyStuff.allResponses(""Why did you rate your experience this way?\n\n为什么你的体验是这样的？"");
    //console.log(indexOfFirst)
