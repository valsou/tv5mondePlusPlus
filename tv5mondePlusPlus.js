// ==UserScript==
// @name         TV5Monde++
// @version      1.0
// @description  Download videos of TV5Monde.com
// @author       Valentin MEZIN
// @include      http://www.tv5monde.com/*
// @run-at       document-body
// @grant        GM_addStyle
// @grant        GM_setClipboard
// @noframes
// ==/UserScript==

'use strict';

GM_addStyle(`

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
`);

const REGEX = /http:\/\/www.tv5monde.com\/emissions\/episode\/merci-professeur-/;
const ELEMENT_TO_OBSERVE = document.querySelector('body');
const PARENT_TO_APPEND = '.episode-text';
let quality = {
    'index_0_av': {
        'type': 'video',
        'resolution' : '640x360'
    },
    'index_1_av': {
        'type': 'video',
        'resolution' : '1024x576'
    },
    'index_2_av': {
        'type': 'video',
        'resolution' : '1280x720'
    },
    'index_3_av': {
        'type': 'video',
        'resolution' : '1920x1080'
    },
    'index_0_a': {
        'type': 'audio'
    }
};
const ICON_COPY = '&#x2398';

let last_page_viewed = "";


console.log("TV5Monde++ is running...");

(function() {
    console.log("Observing...");

    let nodeElement = ELEMENT_TO_OBSERVE;
    let config = { attributes: true, subtree: true };

    let callback = function(mutationsList) {

        for(var mutation of mutationsList) {

            if (mutation.target.attributes['data-broadcast']) {

                if (last_page_viewed != mutation.target.baseURI) {

                    console.log("Page changed : "+ window.location.pathname);

                    if (mutation.target.baseURI.match(REGEX)) {
                        last_page_viewed = mutation.target.baseURI;
                        getLinks(JSON.parse(mutation.target.attributes['data-broadcast'].value));
                    }

                }

            }

        }

    };

    let observer = new MutationObserver(callback);
    observer.observe(nodeElement, config);
})();

function getLinks(attribute) {
    let array_to_return = [];
    let master_url = attribute.files[0].url.split('/');
    let magic_number = master_url[5];
    let video_id = master_url[6];

    showLinks(magic_number, video_id);
}

function showLinks(magic, id) {

    let parent = document.querySelector(PARENT_TO_APPEND);
    let content = document.createElement("div");
    let div = document.createElement("div");

    parent.after(content);
    content.classList.add("episode-text", "episode-downloads");

    let quality_keys = Object.keys(quality);

    Array.from(quality_keys).forEach((key) => {
        let data = quality[key];
        let label = data.resolution;
        let url = 'https://hlstv5mplus-vh.akamaihd.net/i/hls/'+magic+'/'+id+'/'+key+'.m3u8';

        if (data.type == 'audio') {
            label = 'Audio';
        }

        div.insertAdjacentHTML('beforeend', '<div><a href="'+url+'" target="_blank">Flux .M3U8 ('+label+')</a><span class="copypaste">'+ICON_COPY+' Copier</span></div>');

    });

    content.appendChild(div);

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