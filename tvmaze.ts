import axios from "axios";
import * as $ from 'jquery';
import { ids } from "webpack";

const $showsList = $("#showsList");
const $episodesArea = $("#episodesArea");
const $searchForm = $("#searchForm");

const BASE_URL = "https://api.tvmaze.com";
/** Given a search term, search for tv shows that match that query.
 *
 *  Returns (promise) array of show objects: [show, show, ...].
 *    Each show object should contain exactly: {id, name, summary, image}
 *    (if no image URL given by API, put in a default image URL)
 */

interface ShowInterfaceFromAPI {
  id: number,
  name: string,
  summary: string,
  image: {
    medium: string
  }
}

interface ShowInterface {
  id: number,
  name: string,
  summary: string,
  image: string
}

interface EpisodeInterface {
  id: number,
  name: string,
  season: number,
  number: number
}

/**  Given a serach term in string, request API and return data of shows 
 * matching the search
*/
async function getShowsByTerm(term: string): Promise<ShowInterface[]> {
  let shows = await axios.get(`${BASE_URL}/search/shows?q=${term}`);
  console.log("Shows", shows)
  let showsDisplayData = shows
    .data
    .map((s: {
      show: ShowInterfaceFromAPI
    }): ShowInterface => {

      return {
        id: s.show.id,
        name: s.show.name,
        summary: s.show.summary,
        image: (
          s.show.image
            ?.medium || 'tv_placeholder.jpg'
        )
      }

    });

  return showsDisplayData;
}


/** Given list of shows, create markup for each and to DOM */

function populateShows(shows
  : ShowInterface[]): void {
  $showsList.empty();

  for (let show of shows) {

    const $show = $(
      `<div data-show-id="${show.id}" class="Show col-md-12 col-lg-6 mb-4">
         <div class="media">
           <img
              src="${show.image}"
              alt="Bletchly Circle San Francisco"
              class="w-25 me-3">
           <div class="media-body">
             <h5 class="text-primary">${show.name}</h5>
             <div><small>${show.summary}</small></div>
             <button class="btn btn-outline-light btn-sm Show-getEpisodes">
               Episodes
             </button>
           </div>
         </div>
       </div>
      `
    );

    $showsList.append($show);
  }
}


/** Handle search form submission: get shows from API and display.
 *    Hide episodes area (that only gets shown if they ask for episodes)
 */

async function searchForShowAndDisplay(): Promise<void> {
  const term = $("#searchForm-term").val() as string;
  const shows = await getShowsByTerm(term);

  $episodesArea.hide();
  populateShows(shows);
}

$searchForm.on("submit", async function (evt
  : JQuery.SubmitEvent)
  : Promise<void> {
  evt.preventDefault();
  await searchForShowAndDisplay();
});

/** Handle a episode button click */
async function getEpisodesAndDisplay(evt: JQuery.ClickEvent): Promise<void> {
  const showId = $(evt.target).closest(".Show").data("show-id");

  const episodes = await getEpisodesOfShow(showId);
  populateEpisodes(episodes);
  $episodesArea.show();
}

$showsList.on("click", ".Show-getEpisodes", getEpisodesAndDisplay);


/** Given a show ID, get from API and return (promise) array of episodes:
 *      { id, name, season, number }
 */

async function getEpisodesOfShow(id
  : number) {
  const response = await axios.get(`${BASE_URL}/shows/${id}/episodes`);

  return response
    .data
    .map((e
      : EpisodeInterface) => ({ 
        id: e.id, 
        name: e.name, 
        season: e.season, 
        number: e.number 
      }));
}

/** Given a array of episode interfaces, show list of episodes in area */

function populateEpisodes(episodes
  : EpisodeInterface[]): void {
  $episodesArea.empty();

  for (let episode of episodes) {

    const $episode = $(
      `<li>
      <strong>${episode.name}</strong>(season ${episode.season}, ep. ${episode.number})
      </li>`
    );

    $episodesArea.append($episode);
  }
}
