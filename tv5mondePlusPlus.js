// ==UserScript==
// @name         TV5Monde++
// @version      1.1
// @description  Download videos of TV5Monde.com
// @author       Valentin MEZIN
// @include      /(http|https):\/\/(www|dictee|langue-francaise).tv5monde.com\/(emissions\/episode\/merci-professeur-|dictee\/|decouvrir\/(ne-plus-se-tromper\/(osez-le-francais|sans-fautes|mais-comment-ca-secrit\/)|(voyager-en-francais\/(ta-langue-en-dit-long))))/
// @run-at       document-start
// @grant        GM_addStyle
// @grant        GM_setClipboard
// @noframes
// ==/UserScript==

'use strict';

GM_addStyle(`
.episode-downloads.episode-infos {
border-radius: 0 !important;
}

.episode-downloads div {
padding-bottom: 1rem;
}


.episode-downloads .copypaste {
background-color: #1cace6;
color: white;
padding: 0.25rem;
margin-left: 0.5rem;
cursor: pointer;
border-radius: 0.25rem;
}

.episode-downloads .copypaste:hover,
.episode-downloads .copied {
background-color: rgb(102, 21, 104);
color: white;
}
.fullPlayer {
margin-bottom: 1rem;
}
`);

const REGEX = /(http|https):\/\/(www|dictee|langue-francaise).tv5monde.com\/(emissions\/episode\/merci-professeur-|dictee\/|decouvrir\/(ne-plus-se-tromper\/(osez-le-francais|sans-fautes|mais-comment-ca-secrit\/)|(voyager-en-francais\/(ta-langue-en-dit-long))))/;
const REGEX_DICTEE = /(http|https):\/\/dictee.tv5monde.com\/dictee\//;
const ICON_COPY = '&#x2398';
let element_to_observe = document.querySelector('html');
let parent_to_append = '.episode-player';
let m3u8 = {
    'index_3_av': {
        'type': 'video',
        'resolution' : '1920x1080'
    },
    'index_2_av': {
        'type': 'video',
        'resolution' : '1280x720'
    },
    'index_1_av': {
        'type': 'video',
        'resolution' : '1024x576'
    },
    'index_0_av': {
        'type': 'video',
        'resolution' : '640x360'
    },
    'index_0_a': {
        'type': 'audio'
    }
};

let last_page_viewed = "";

(function() {

    let current_url = window.location.href;

    console.log("TV5Monde++ is running...");

    if (current_url.match(REGEX_DICTEE)) {

        document.addEventListener('DOMContentLoaded', (event) => {
            getLinks('dictee', document.querySelector('#recit source'));
        });

    } else if (current_url.match(REGEX)) {

        let nodeElement = element_to_observe;
        let config = { attributes: true, subtree: true, attributeFilter: ['data-jwplayer-id'] };

        let callback = function(mutationsList) {
            console.log("Observing...");

            for(var mutation of mutationsList) {

                if (last_page_viewed != mutation.target.baseURI) {

                    console.log("Page changed : "+ window.location.pathname);

                    if (mutation.target.baseURI.match(REGEX)) {
                        last_page_viewed = mutation.target.baseURI;
                        getLinks('default', JSON.parse(mutation.target.attributes['data-broadcast'].value));
                    }

                }

            }

        };

        let observer = new MutationObserver(callback);
        observer.observe(nodeElement, config);
    }

})();

async function getLinks(page, attribute) {

    let alive = [];
    let magic_number = "";
    let video_id = "";
    let type = "";
    let message = [];

    if (page == 'default') {

        let master_url = attribute.files[0].url.split('/');
        type = attribute.files[0].format;

        // ------------
        // --- MP4 ----
        // ------------
        if (type == 'mp4') {

            let ajax = await fetch(attribute.files[0].url)
            .then(response => {

                if (response.status == 200) {

                    alive[0] = true;
                    video_id = master_url[5].slice(0,-4);
                    let url = 'https://dlhd.tv5monde.com/tv5mondeplus/hq/'+video_id+'.mp4';
                    message.push('<div><a href="'+url+'" target="_blank">Fichier .MP4</a><span class="copypaste">'+ICON_COPY+' Copier</span></div>');

                } else {

                    alive[0] = false;
                    alive[1] = response.status;
                    message.push('<div>Fichier .MP4 : Erreur '+alive[1]+'</div>');

                }
            });

        }
        // ------------
        // --- M3U8 ---
        // ------------
        else if (type = 'm3u8') {



            let ajax = await fetch(master_url.join("/"))
            .then(response => {
                alive[0] = true;
                magic_number = master_url[5];
                video_id = master_url[6];


                let m3u8_keys = Object.keys(m3u8);

                Array.from(m3u8_keys).forEach((key) => {

                    let data = m3u8[key];
                    let label = data.resolution;
                    let url = 'https://hlstv5mplus-vh.akamaihd.net/i/hls/'+magic_number+'/'+video_id+'/'+key+'.m3u8';

                    if (data.type == 'audio') {
                        label = 'Audio';
                    }

                    if (response.status == 200) {

                        message.push('<div><a href="'+url+'" target="_blank">Flux .M3U8 ('+label+')</a><span class="copypaste">'+ICON_COPY+' Copier</span></div>');

                    } else {

                        alive[0] = false;
                        alive[1] = response.status;

                        if (data.type == 'audio') {
                            label = 'Audio';
                        }

                        message.push('<div>Flux .M3U8 ('+label+') : Erreur '+alive[1]+'</div>');

                    }
                });


            });

            // https://hlstv5mplus-vh.akamaihd.net/i/hls/magic_number/video_id/index_xxx.m3u8'

        }

    } else if (page == 'dictee') {

        let url = attribute.src;

        message[0] = '<div><a href="'+url+'" target="_blank">Fichier .MP3</a><span class="copypaste">'+ICON_COPY+' Copier</span></div>';

    }

    showLinks(message, page);
}

async function showLinks(message, page) {

    if (page == 'dictee') {
     parent_to_append = '.fullPlayer';
    }

    let parent = document.querySelector(parent_to_append);
    let content = document.createElement("div");


    content.classList.add("episode-infos", "episode-info", "episode-downloads");

    Array.from(message).forEach(element => {
        content.insertAdjacentHTML('beforeend', element);
    });

    parent.after(content);

    let copypaste = document.querySelectorAll('.copypaste');
    let last_copied = [];

    Array.from(copypaste).forEach(link => {

        link.addEventListener('click', function(event) {

            if (last_copied[0] != undefined) {
                clearTimeout(last_copied[0]);
                copied(last_copied[1], ICON_COPY+' Copier', false);
            }

            copied(link, ICON_COPY+' Copié !', true);

            last_copied = [setTimeout(function(timer){
                copied(link, ICON_COPY+' Copier', false);
            }, 4000), link];

            GM_setClipboard(link.previousSibling.href, "text")

        });
    });
}

function copied(element, message, bool) {
    if (bool) {
        element.innerHTML = message;
        element.classList.add("copied");
    } else {
        element.innerHTML = message;
        element.classList.remove("copied");
    }
}