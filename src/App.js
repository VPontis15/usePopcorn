import { useEffect, useState } from "react";
import StarRating from "./Stars";

const KEY = "5232240c";

const average = (arr) =>
  arr.reduce((acc, cur, i, arr) => acc + cur / arr.length, 0);

export default function App() {
  const [movies, setMovies] = useState([]);
  const [watched, setWatched] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const [query, setQuery] = useState("");

  function handleQuery(e) {
    setQuery(e.target.value);
  }

  function handleAddWatched(item) {
    setWatched((watched) => [...watched, item]);
  }
  const [selectId, setSelectId] = useState(null);

  function handleSelectId(id) {
    setSelectId((curr) => (curr === id ? null : id));
  }

  function handleDeleteWatched(id) {
    setWatched((movies) => movies.filter((movie) => movie.imdbID !== id));
  }

  function closeMovie() {
    setSelectId(null);
  }

  useEffect(
    function () {
      const controller = new AbortController();
      async function fecthMovies() {
        try {
          setError("");
          setIsLoading(true);
          const res = await fetch(
            `http://www.omdbapi.com/?apikey=${KEY}&s=${query}`,
            { signal: controller.signal }
          );
          if (!res.ok)
            throw new Error(
              "There was a problem fetching the data.Check your internet connection"
            );

          const data = await res.json();
          if (data.Response === "False") throw new Error("movie not found");
          setMovies(data.Search);
          setError("");
        } catch (error) {
          if (error.name !== "AbortError") setError(error.message);
        } finally {
          setIsLoading(false);
        }
      }
      if (query.length < 3) {
        setMovies([]);
        setError("");
        return;
      }
      fecthMovies();

      return function () {
        controller.abort();
      };
    },
    [query]
  );

  return (
    <>
      <NavBar>
        <Search query={query} onHandleQuery={handleQuery} />
        <NumResults movies={movies} />
      </NavBar>

      <Main>
        <Box>
          {isLoading && <Loader />}
          {!isLoading && !error && (
            <MovieList onHandleSelectId={handleSelectId} movies={movies} />
          )}
          {error && <ErrorMessage error={error} />}
        </Box>

        <Box onHandleSelectId={handleSelectId}>
          {selectId ? (
            <MovieDetails
              onHandleAddWatched={handleAddWatched}
              onCloseMovie={closeMovie}
              selectId={selectId}
              watched={watched}
            />
          ) : (
            <>
              <WatchedSummary watched={watched} />
              <WatchedMoviesList
                onDeleteWatched={handleDeleteWatched}
                watched={watched}
              />
            </>
          )}
        </Box>
      </Main>
    </>
  );
}
function ErrorMessage({ query, error }) {
  return <p className="error"> {error}</p>;
}

function Loader() {
  return <p className="loader">Loading...</p>;
}

function NavBar({ children }) {
  return (
    <nav className="nav-bar">
      <Logo />
      {children}
    </nav>
  );
}

function Logo() {
  return (
    <div className="logo">
      <span role="img">🍿</span>
      <h1>usePopcorn</h1>
    </div>
  );
}

function MovieDetails({ onCloseMovie, selectId, onHandleAddWatched, watched }) {
  const [movie, setMovie] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [userRating, setUserRating] = useState("");
  const isWatched = watched.map((movie) => movie.imdbID).includes(selectId);
  const watchedRating = watched.find(
    (movie) => movie.imdbID === selectId
  )?.userRating;

  const {
    Title: title,
    Runtime: runtime,
    Year: year,
    Actors: actors,
    Poster: poster,
    Director: director,
    Genre: genre,
    Plot: plot,
    Released: released,
    imdbRating,
  } = movie;
  function handleAdd() {
    const newWatchedMovie = {
      title,
      year,
      imdbID: selectId,
      poster,
      imdbRating: Number(imdbRating),
      runtime: runtime.split(" ").at(0),
      userRating,
    };

    onHandleAddWatched(newWatchedMovie);

    onCloseMovie();
  }

  useEffect(
    function () {
      document.title = `Movie | ${title}`;
      return function () {
        document.title = "usePopcorn";
      };
    },
    [title]
  );

  useEffect(
    function () {
      setIsLoading(true);
      async function getMovieDetails() {
        const res = await fetch(
          `http://www.omdbapi.com/?apikey=${KEY}&i=${selectId}`
        );
        const data = await res.json();
        setMovie(data);
        setIsLoading(false);
      }
      getMovieDetails();
    },
    [selectId]
  );
  return (
    <div className="details">
      {isLoading ? (
        <Loader />
      ) : (
        <>
          <header>
            <button onClick={onCloseMovie} className="btn-back">
              &larr;
            </button>
            <img src={poster} alt={`Poster of ${title} movie`} />
            <div className="details-overview">
              <h2>{title}</h2>
              <p>
                {released} &bull; {runtime}
              </p>
              <p>{genre}</p>
              <p>
                <span>⭐</span>
                {imdbRating} IMDb rating
              </p>
            </div>
          </header>
          <section>
            <div className="rating">
              {!isWatched ? (
                <>
                  <StarRating
                    maxRating={10}
                    size={24}
                    onSetRating={setUserRating}
                  />
                  {userRating > 0 && (
                    <button className="btn-add" onClick={handleAdd}>
                      Add to watched
                    </button>
                  )}
                </>
              ) : (
                <p>You have already rated this movie {watchedRating}</p>
              )}
            </div>
            <p>
              <em>{plot}</em>
            </p>
            <p>Starring {actors}</p>
            <p>Directed by {director}</p>
          </section>
        </>
      )}
    </div>
  );
}

function Search({ query, onHandleQuery }) {
  return (
    <input
      className="search"
      type="text"
      placeholder="Search movies..."
      value={query}
      onChange={onHandleQuery}
    />
  );
}

function NumResults({ movies }) {
  return (
    <p className="num-results">
      Found <strong>{movies.length}</strong> results
    </p>
  );
}

function Main({ children }) {
  return <main className="main">{children}</main>;
}

function Box({ onHandleSelectId, children }) {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className="box">
      {" "}
      <button className="btn-toggle" onClick={() => setIsOpen((open) => !open)}>
        {isOpen ? "–" : "+"}
      </button>
      {isOpen && children}
    </div>
  );
}

function WatchedBox() {
  const [watched, setWatched] = useState();
  const [isOpen2, setIsOpen2] = useState(true);

  return (
    <div className="box">
      <button
        className="btn-toggle"
        onClick={() => setIsOpen2((open) => !open)}
      >
        {isOpen2 ? "–" : "+"}
      </button>

      {isOpen2 && (
        <>
          <WatchedSummary watched={watched} />
          <WatchedMoviesList watched={watched} />
        </>
      )}
    </div>
  );
}

function MovieList({ onHandleSelectId, movies }) {
  return (
    <ul className="list list-movies">
      {movies?.map((movie) => (
        <Movie
          onHandleSelectId={onHandleSelectId}
          movie={movie}
          key={movie.imdbID}
        />
      ))}
    </ul>
  );
}

function Movie({ onHandleSelectId, movie }) {
  return (
    <li onClick={() => onHandleSelectId(movie.imdbID)}>
      <img src={movie.Poster} alt={`${movie.Title} poster`} />
      <h3>{movie.Title}</h3>
      <div>
        <p>
          <span>🗓</span>
          <span>{movie.Year}</span>
        </p>
      </div>
    </li>
  );
}

function WatchedSummary({ watched }) {
  const avgImdbRating = average(watched.map((movie) => movie.imdbRating));
  const avgUserRating = average(watched.map((movie) => movie.userRating));
  const avgRuntime = average(watched.map((movie) => movie.runtime));

  return (
    <div className="summary">
      <h2>Movies you watched</h2>
      <div>
        <p>
          <span>#️⃣</span>
          <span>{watched.length} movies</span>
        </p>
        <p>
          <span>⭐️</span>
          <span>{avgImdbRating.toFixed(2)}</span>
        </p>
        <p>
          <span>🌟</span>
          <span>{avgUserRating.toFixed(2)}</span>
        </p>
        <p>
          <span>⏳</span>
          <span>{avgRuntime} min</span>
        </p>
      </div>
    </div>
  );
}

function WatchedMoviesList({ watched, onDeleteWatched }) {
  return (
    <ul className="list">
      {watched.map((movie) => (
        <WatchedMovie
          onDeleteWatched={onDeleteWatched}
          movie={movie}
          key={movie.imdbID}
        />
      ))}
    </ul>
  );
}

function WatchedMovie({ movie, onDeleteWatched }) {
  return (
    <li>
      <img src={movie.poster} alt={`${movie.title} poster`} />
      <h3>{movie.title}</h3>
      <div>
        <p>
          <span>⭐️</span>
          <span>{movie.imdbRating}</span>
        </p>
        <p>
          <span>🌟</span>
          <span>{movie.userRating}</span>
        </p>
        <p>
          <span>⏳</span>
          <span>{movie.runtime} min</span>
        </p>
        <button
          className="btn-delete"
          onClick={() => onDeleteWatched(movie.imdbID)}
        >
          X{" "}
        </button>
      </div>
    </li>
  );
}
