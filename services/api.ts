import axios from 'axios';

const API_KEY = 'c9407728';
const BASE_URL = 'https://www.omdbapi.com/';

// Types
export interface Movie {
  Title: string;
  Year: string;
  imdbID: string;
  Type: string;
  Poster: string;
}

export interface MovieDetails extends Movie {
  Rated: string;
  Released: string;
  Runtime: string;
  Genre: string;
  Director: string;
  Writer: string;
  Actors: string;
  Plot: string;
  Language: string;
  Country: string;
  Awards: string;
  Ratings: Array<{ Source: string; Value: string }>;
  Metascore: string;
  imdbRating: string;
  imdbVotes: string;
  DVD: string;
  BoxOffice: string;
  Production: string;
  Website: string;
  Response: string;
}

export interface SearchResponse {
  Search: Movie[];
  totalResults: string;
  Response: string;
  Error?: string;
}

// API functions
export const searchMovies = async (title: string, page = 1): Promise<SearchResponse> => {
  try {
    const response = await axios.get(`${BASE_URL}?apikey=${API_KEY}&s=${encodeURIComponent(title)}&page=${page}`);
    return response.data;
  } catch (error) {
    console.error('Error searching movies:', error);
    throw error;
  }
};

export const getMovieDetails = async (imdbID: string): Promise<MovieDetails> => {
  try {
    const response = await axios.get(`${BASE_URL}?apikey=${API_KEY}&i=${imdbID}&plot=full`);
    return response.data;
  } catch (error) {
    console.error('Error getting movie details:', error);
    throw error;
  }
};