import axios from 'axios';

const API_KEY = 'c9407728';
const API_BASE_URL = 'https://www.omdbapi.com/';

const client = axios.create({
  baseURL: API_BASE_URL,
  params: { apikey: API_KEY },
});

// The OMDb API has different field names, so we update the interface.
export interface Movie {
  imdbID: string;
  Title: string;
  Poster: string;
  Year: string;
  // Details
  Plot?: string;
  imdbRating?: string;
  Director?: string;
  Actors?: string;
  Genre?: string;
  Runtime?: string;
  Rated?: string;
  Awards?: string;
  Writer?: string;
}

// OMDb doesn't have a "popular" endpoint, so we'll search for a general term to get a list.
export const getPopularMovies = async (): Promise<Movie[]> => {
  try {
    // Searching for 'top' to get a list of popular-like movies.
    const response = await client.get('/', { params: { s: 'top', type: 'movie' } });
    if (response.data.Response === 'True') {
      return response.data.Search;
    }
    return [];
  } catch (error) {
    console.error('Error fetching popular movies:', error);
    return [];
  }
};

export const getMovieDetails = async (id: string): Promise<Movie | null> => {
  try {
    const response = await client.get('/', { params: { i: id, plot: 'full' } });
    if (response.data.Response === 'True') {
      return response.data;
    } else {
      return null;
    }
  } catch (error) {
    console.error('Error fetching movie details:', error);
    return null;
  }
};
