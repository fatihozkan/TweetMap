var totalTweets = 0;
var countryTweetCount = [];
var cityTweetCount = [];
var hashTagCount = [];
var canvasLayer;
var continents = [];
var continentCount = [];
var isSideBarAndFooterEnabled = true;
var isFullScreen = false;

$(function () {
    prepareMap();
    prepareLayout();
    getTweets();
    continentBoundries();
    $(window).resize(function () {
        prepareLayout();
    });
});

function prepareLayout() {
    if (isSideBarAndFooterEnabled) {
        showSideBarAndFooter();
    }
    else {
        hideSideBarAndFooter();
    }
}
function hideSideBarAndFooter() {
    $(".rightSideBar").css("width", 0).css("height", 0).hide();
    $(".footer").css("width", 0).css("height", 0).hide();
    var mapArea = $("#map");
    var windowHeight = $(window).height();
    var windowWidth = $(window).width();
    mapArea.height(windowHeight);
    mapArea.width(windowWidth);
    $(".mapTweetCount").show();
    canvasLayer.redraw();
    isSideBarAndFooterEnabled = false;
}
function showSideBarAndFooter() {
    var mapArea = $("#map");
    var rightSideBar = $(".rightSideBar");
    var footer = $(".footer");
    var windowHeight = $(window).height();
    var windowWidth = $(window).width();

    rightSideBar.width("300px");
    rightSideBar.height(windowHeight);

    footer.height("200px");
    footer.width(windowWidth - rightSideBar.width());
    $("#picturesContent").height(windowHeight);

    mapArea.height(windowHeight - footer.height());
    mapArea.width(windowWidth - rightSideBar.width());

    rightSideBar.show();
    footer.show();
    $(".mapTweetCount").hide();
    canvasLayer.redraw();
    isSideBarAndFooterEnabled = true;
}
function checkOffScreen() {
    $(' #tweetListContent #tweetList li:offscreen').each(function () {
        $(this).remove();
    });
    $(' #picturesContent a:offscreen').each(function () {
        $(this).remove();
    });
}
function getTweets() {
    var url = document.location.hostname;
    if (document.location.hostname.indexOf("localhost") == -1) {
        url = "http://tweetmap-starlabs.rhcloud.com:8000/";
    }
    else {
        url = document.location.host;
    }
    var socket = io.connect(url);
    socket.on('tweet', function (data) {
        if (data.coordinates != null) {
            checkOffScreen();
            calculateTotal();
            printTweetInfo(data);
            printHeatMap(data);
            getPlaceInfo(data);
            getImages(data);
            extractHashTags(data);
            checkContinents(data);
        }
    });
}


function extractHashTags(data) {
    if (data.entities.hashtags != null && data.entities.hashtags.length > 0) {
        $.each(data.entities.hashtags, function (index, element) {
            var hashTag = element.text;

            var indexes = $.map(hashTagCount, function (obj, index) {
                if (obj.name == hashTag) {
                    return index;
                }
            });
            var tag = {};
            if (indexes.length != 0) {
                tag = hashTagCount[indexes[0]];
                tag.count = tag.count + 1;
                tag.updatedat = new Date();
                hashTagCount[indexes[0]] = tag;
            }
            else {
                tag.name = hashTag;
                tag.updatedat = new Date();
                tag.count = 1;
                hashTagCount.push(tag);
            }
        });
    }
    checkTopHashTags();
}

function checkTopHashTags() {
    hashTagCount.sort(compareDesc);
    var topCountries = hashTagCount.slice(0, 6);
    var html = "";
    $.each(topCountries, function (index, obj) {

        html += '<li>';
        html += '<div>';
        html += '<span class="name">';
        html += "#" + obj.name;
        html += '</span>';
        html += '<span class="count">';
        html += Humanize.formatNumber(obj.count, 0);
        html += '</span>';
        html += '</div>';
        html += '</li>';
    });
    $("#topHashTags").html(html);
}


function checkContinents(data) {
    continentCount.sort(compareDesc);
    var html = "";
    var continentSaved = getContinent(data.geo.coordinates[1], data.geo.coordinates[0]);
    if (continentSaved == undefined)
        return;
    var indexes = $.map(continentCount, function (obj, index) {
        if (obj.name == continentSaved.name) {
            return index;
        }
    });
    var continent = {};
    if (indexes.length != 0) {
        continent = continentCount[indexes[0]];
        continent.count = continent.count + 1;
        continent.code = continentSaved.code;
        continentCount[indexes[0]] = continent;
    }
    else {
        continent.name = continentSaved.name;
        continent.count = 1;
        continent.code = continentSaved.code;
        continentCount.push(continent);
    }

    $.each(continentCount, function (index, obj) {

        html += '<li>';
        html += '<div>';
        html += '<span class="name">';
        html += obj.name;
        html += '</span>';
        html += '<span class="count">';
        html += Humanize.formatNumber(obj.count, 0) + " tweets";
        html += '</span>';
        html += '</div>';
        html += '</li>';
    });
    $("#topContinents").html(html);
}

function getContinent(x, y) {
    var continent = undefined;
    $.each(continents, function (index, value) {
        if (x > value.x1 && x < value.x2 && y < value.y1 && y > value.y2) {
            continent = value;
            return false;
        }
    });
    return continent;
}

function calculateTotal() {
    totalTweets++;
    $(".tweetCount").html(Humanize.formatNumber(totalTweets, 0));
    $(".mapTweetCount").html(Humanize.formatNumber(totalTweets, 0) + " tweets");
}

function printTweetInfo(data) {
    var tweetList = $("#tweetList");
    var html = "<li>";
    html += '<div class="profilePictureWrapper">';
    html += '<a href= "http://twitter.com/' + data.user.screen_name + '" target="_blank"> <img src="' + data.user.profile_image_url + '" class="profilePicture" /></a>';
    html += "</div>";
    html += '<div class="tweetContentWrapper">';
    html += '<a href="http://twitter.com/' + data.user.screen_name + '" class="userName" target="_blank">' + data.user.screen_name + '</a>';
    html += '<div class="text">' + data.text + '</div>';
    html += "</div>";
    html += "</li>";

    tweetList.prepend(html);
}

function getImages(data) {
    if (data.extended_entities != null && data.extended_entities.media) {
        $.each(data.extended_entities.media, function (index, element) {
            if (element.type == "photo") {
                var imageUrl = element.media_url + ":thumb"
                var html = '<a class="picture" href="' + element.expanded_url + '" ' +
                    'target="_blank" style="width: 150px; height: 150px; ' +
                    'background-image: url(' + imageUrl + ');"></a>';
                $("#picturesContent").prepend(html);
            }
        });
    }
}

function getPlaceInfo(data) {
    if (data.place != null) {
        if (data.place.country != null) {
            var country = {};
            var indexes = $.map(countryTweetCount, function (obj, index) {
                if (obj.name == data.place.country) {
                    return index;
                }
            });
            if (indexes.length != 0) {
                country = countryTweetCount[indexes[0]];
                country.count = country.count + 1;
                countryTweetCount[indexes[0]] = country;
            }
            else {
                country.name = data.place.country;
                country.count = 1;
                countryTweetCount.push(country);
            }

            if (data.place.place_type == "city") {
                var city = {};
                var cityIndexes = $.map(cityTweetCount, function (obj, index) {
                    if (obj.name == data.place.name) {
                        return index;
                    }
                });
                if (cityIndexes.length != 0) {
                    city = cityTweetCount[cityIndexes[0]];
                    city.count = city.count + 1;
                    cityTweetCount[cityIndexes[0]] = city;

                }
                else {
                    city.country = data.place.country;
                    city.count = 1;
                    city.name = data.place.name;
                    cityTweetCount.push(city)
                }
            }
        }
    }
    checkTopCountries();
    checkTopCities();
}

function checkTopCountries() {
    countryTweetCount.sort(compareDesc);
    var topCountries = countryTweetCount.slice(0, 6);
    var html = "";
    $.each(topCountries, function (index, obj) {
        html += '<li>';
        html += '<div>';
        html += '<span class="name">';
        html += obj.name;
        html += '</span>';
        html += '<span class="count">';
        html += Humanize.formatNumber(obj.count, 0) + " tweets";
        html += '</span>';
        html += '</div>';
        html += '</li>';
    });
    $("#topCountryList").html(html);
}

function checkTopCities() {
    cityTweetCount.sort(compareDesc);
    var topCountries = cityTweetCount.slice(0, 6);
    var html = "";
    $.each(topCountries, function (index, obj) {
        html += '<li>';
        html += '<div>';
        html += '<span class="name">';
        html += obj.name + "(" + obj.country + ")";
        html += '</span>';
        html += '<span class="count">';
        html += Humanize.formatNumber(obj.count, 0) + " tweets";
        html += '</span>';
        html += '</div>';
        html += '</li>';
    });

    $("#topCityList").html(html);
}

function compareDesc(a, b) {
    if (a.count > b.count)
        return -1;
    if (a.count < b.count)
        return 1;
    return 0;
}

function prepareMap() {
    //light_nolabels
    var baseLayer = L.tileLayer(' http://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}.png', {
            attribution: 'Map tiles by <a href="http://cartodb.com/attributions#basemaps">CartoDB</a>, under <a href="https://creativecommons.org/licenses/by/3.0/">CC BY 3.0</a>. Data by <a href="http://www.openstreetmap.org/">OpenStreetMap</a>, under ODbL.',
            maxZoom: 18,
            noWrap: true
        }
    );

    var map = new L.Map('map', {
        center: new L.latLng(49.009952, 2.548635),
        maxBounds: [[-90.0, -180.0], [90.0, 180.0]],
        zoom: 3
    });

    map.setView(new L.LatLng(17.7850, -12.4183), 3);
    map.addLayer(baseLayer);
    canvasLayer = L.canvasOverlay().addTo(map);

    L.easyButton({
        states: [
            {
                stateName: 'expand',
                icon: 'fa-toggle-off',
                title: 'Hide Sidebar and Footer',
                onClick: function (control) {
                    hideSideBarAndFooter();
                    control.state('compress');
                    map.invalidateSize(true);
                }
            },
            {
                stateName: 'compress',
                icon: 'fa-toggle-on',
                title: "Show Sidebar and Footer",
                onClick: function (control) {
                    showSideBarAndFooter();
                    map.invalidateSize(true);
                    control.state("expand")
                }
            }
        ]
    }).addTo(map);

    L.easyButton({
        states: [
            {
                stateName: 'goFullScreen',
                icon: 'fa-expand',
                title: 'Full Screen',
                onClick: function (control) {
                    isFullScreen = true;
                    toggleFullScreen();
                    if (isSideBarAndFooterEnabled) {
                        showSideBarAndFooter();
                    }
                    else {
                        hideSideBarAndFooter();
                    }
                    control.state('exitFullScreen');
                    map.invalidateSize(true);
                }
            },
            {
                stateName: 'exitFullScreen',
                icon: 'fa-compress',
                title: "Exit Full Screen",
                onClick: function (control) {
                    isFullScreen = false;
                    toggleFullScreen();
                    if (isSideBarAndFooterEnabled) {
                        showSideBarAndFooter();
                    }
                    else {
                        hideSideBarAndFooter();
                    }
                    map.invalidateSize(true);
                    control.state("goFullScreen")
                }
            }
        ]
    }).addTo(map);
}

function toggleFullScreen() {
    if ((document.fullScreenElement && document.fullScreenElement !== null) ||
        (!document.mozFullScreen && !document.webkitIsFullScreen)) {
        if (document.documentElement.requestFullScreen) {
            document.documentElement.requestFullScreen();
        } else if (document.documentElement.mozRequestFullScreen) {
            document.documentElement.mozRequestFullScreen();
        } else if (document.documentElement.webkitRequestFullScreen) {
            document.documentElement.webkitRequestFullScreen(Element.ALLOW_KEYBOARD_INPUT);
        }
    } else {
        if (document.cancelFullScreen) {
            document.cancelFullScreen();
        } else if (document.mozCancelFullScreen) {
            document.mozCancelFullScreen();
        } else if (document.webkitCancelFullScreen) {
            document.webkitCancelFullScreen();
        }
    }
}

function printHeatMap(data) {
    var latLong = [data.geo.coordinates[1], data.geo.coordinates[0]];
    canvasLayer.addPoint(latLong)
}

jQuery.expr.filters.offscreen = function (el) {
    return (
        (el.offsetLeft + el.offsetWidth) < 0
        || (el.offsetTop + el.offsetHeight) < 0
        || (el.offsetLeft > window.innerWidth || el.offsetTop > window.innerHeight)
    );
};

function continentBoundries() {
    continents = [
        {
            name: "Africa",
            code: "AF",
            x1: -26,
            y1: 25.71,
            x2: 47,
            y2: -39.1
        },
        {
            name: "Europe",
            code: "EU",
            x1: -30,
            y1: 69,
            x2: 47,
            y2: 36
        },
        {
            name: "North America",
            code: "NA",
            x1: -168,
            y1: 64,
            x2: -49,
            y2: 16
        },
        {
            name: "South America",
            code: "SA",
            x1: -94,
            y1: 16,
            x2: -26,
            y2: -56
        },
        {
            name: "Asia",
            code: "AS",
            x1: 47,
            y1: 69,
            x2: 147,
            y2: -10
        },
        {
            name: "Australia",
            code: "AU",
            x1: 110,
            y1: -11,
            x2: 179,
            y2: -48
        }
    ];
}