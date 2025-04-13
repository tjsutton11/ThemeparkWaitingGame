import { useState, useEffect } from 'react';
import { Destination, DestinationsResponse, Park, LiveResponse, LiveData } from '../types/themeParks';

const ThemeParkSelector = () => {
    const [destinations, setDestinations] = useState<Destination[]>([]);
    const [selectedPark, setSelectedPark] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [validationError, setValidationError] = useState<string | null>(null);
    const [attractions, setAttractions] = useState<LiveData[]>([]);
    const [isFetchingAttractions, setIsFetchingAttractions] = useState<boolean>(false);
    const [currentAttractionIndex, setCurrentAttractionIndex] = useState<number>(0);
    const [guess, setGuess] = useState<string>('');
    const [isClosedOrDown, setIsClosedOrDown] = useState<boolean>(false);
    const [score, setScore] = useState<number>(0);
    const [showResult, setShowResult] = useState<boolean>(false);
    const [isCorrect, setIsCorrect] = useState<boolean>(false);
    const [resultMessage, setResultMessage] = useState<string>('');

    useEffect(() => {
        const fetchParks = async () => {
            try {
                const response = await fetch('https://api.themeparks.wiki/v1/destinations');
                if (!response.ok) {
                    throw new Error(`Failed to fetch parks: ${response.status} ${response.statusText}`);
                }
                const data: DestinationsResponse = await response.json();
                
                // Filter out destinations without parks and sort them
                const validDestinations = data.destinations
                    .filter(dest => dest.parks && dest.parks.length > 0)
                    .sort((a, b) => a.name.localeCompare(b.name));
                
                setDestinations(validDestinations);
                console.log('Destinations:', validDestinations);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'An error occurred while fetching parks');
                console.error('Error fetching parks:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchParks();
    }, []);

    const handleParkChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const value = e.target.value;
        setSelectedPark(value);
        setValidationError(null);
    };

    const handlePlayClick = async () => {
        if (!selectedPark) return;

        try {
            setIsFetchingAttractions(true);
            setError(null);
            const response = await fetch(`https://api.themeparks.wiki/v1/entity/${selectedPark}/live`);
            
            if (!response.ok) {
                throw new Error(`Failed to fetch live data: ${response.status} ${response.statusText}`);
            }

            const data: LiveResponse = await response.json();
            
            // Filter for attractions only and ensure they have a queue property
            const attractions = data.liveData.filter(item => 
                item.entityType === "ATTRACTION" && 
                item.queue !== undefined
            );
            
            setAttractions(attractions);
            setCurrentAttractionIndex(0);
            setScore(0);
            setGuess('');
            setIsClosedOrDown(false);
            setShowResult(false);
            console.log('Attractions:', attractions);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred while fetching live data');
            console.error('Error fetching live data:', err);
        } finally {
            setIsFetchingAttractions(false);
        }
    };

    const handleGuessSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const currentAttraction = attractions[currentAttractionIndex];
        const isActuallyDownOrClosed = currentAttraction.status === 'DOWN' || 
                                     currentAttraction.status === 'CLOSED' || 
                                     currentAttraction.status === 'REFURBISHMENT';
        const actualWaitTime = isActuallyDownOrClosed 
            ? 0 
            : currentAttraction.queue.STANDBY?.waitTime ?? 0;
        
        let points = 0;
        let message = '';
        
        if (isClosedOrDown) {
            // User checked the closed/down checkbox
            if (isActuallyDownOrClosed) {
                points = 12;
                message = 'Correct! Ride is down/closed. +12 points';
            } else {
                points = 0;
                message = 'Incorrect. Ride is operating. No points';
            }
        } else {
            // User is guessing wait time
            if (isActuallyDownOrClosed) {
                points = 0;
                message = 'Incorrect. Ride is down/closed. No points';
            } else {
                const guessedWaitTime = parseInt(guess);
                const difference = Math.abs(guessedWaitTime - actualWaitTime);
                
                if (difference === 0) {
                    points = 10;
                    message = 'Perfect guess! +10 points';
                } else if (difference <= 5) {
                    points = 7;
                    message = 'Close! Within 5 minutes. +7 points';
                } else if (difference <= 10) {
                    points = 5;
                    message = 'Good guess! Within 10 minutes. +5 points';
                } else if (difference <= 15) {
                    points = 3;
                    message = 'Not bad! Within 15 minutes. +3 points';
                } else if (difference <= 30) {
                    points = 1;
                    message = 'Within 30 minutes. +1 point';
                } else {
                    points = 0;
                    message = 'Off by more than 30 minutes. No points';
                }
            }
        }
        
        setScore(prevScore => prevScore + points);
        setIsCorrect(points > 0);
        setShowResult(true);
        setResultMessage(message);
    };

    const handleNextAttraction = () => {
        if (currentAttractionIndex < attractions.length - 1) {
            setCurrentAttractionIndex(prev => prev + 1);
            setGuess('');
            setIsClosedOrDown(false);
            setShowResult(false);
        } else {
            // This is the last attraction, show final score
            setCurrentAttractionIndex(prev => prev + 1);
        }
    };

    const handlePlayAgain = () => {
        setAttractions([]);
        setCurrentAttractionIndex(0);
        setScore(0);
        setGuess('');
        setIsClosedOrDown(false);
        setShowResult(false);
    };

    if (loading) {
        return (
            <div className="loading-state">
                <p>Loading theme parks...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="error-state">
                <p>Error: {error}</p>
                <button onClick={() => window.location.reload()}>Try Again</button>
            </div>
        );
    }

    return (
        <div className="theme-park-selector">
            {!attractions.length && (
                <>
                    <label htmlFor="park-select">Select a Theme Park:</label>
                    <select
                        id="park-select"
                        value={selectedPark}
                        onChange={handleParkChange}
                        className="park-dropdown"
                        required
                    >
                        <option value="">-- Select a Theme Park --</option>
                        {destinations.map((destination) => (
                            <optgroup key={destination.id} label={destination.name}>
                                {destination.parks.map((park) => (
                                    <option key={park.id} value={park.id} style={{ color: '#000000' }}>
                                        {park.name}
                                    </option>
                                ))}
                            </optgroup>
                        ))}
                    </select>
                    {validationError && (
                        <div className="validation-error">
                            <p>{validationError}</p>
                        </div>
                    )}
                    <button 
                        className="play-button"
                        onClick={handlePlayClick}
                        disabled={isFetchingAttractions}
                    >
                        {isFetchingAttractions ? 'Loading...' : 'Play!'}
                    </button>
                </>
            )}

            {attractions.length > 0 && currentAttractionIndex < attractions.length && (
                <div className="game-container">
                    <div className="score">Score: {score}</div>
                    <div className="current-attraction">
                        <h3>{attractions[currentAttractionIndex].name}</h3>
                        {!showResult ? (
                            <form onSubmit={handleGuessSubmit}>
                                <div className="guess-input">
                                    <label htmlFor="wait-time">Wait Time (minutes):</label>
                                    <input
                                        type="number"
                                        id="wait-time"
                                        value={guess}
                                        onChange={(e) => setGuess(e.target.value)}
                                        min="0"
                                        required={!isClosedOrDown}
                                        disabled={isClosedOrDown}
                                    />
                                    <div className="status-checkbox">
                                        <input
                                            type="checkbox"
                                            id="closed-down"
                                            checked={isClosedOrDown}
                                            onChange={(e) => {
                                                setIsClosedOrDown(e.target.checked);
                                                if (e.target.checked) {
                                                    setGuess('');
                                                }
                                            }}
                                        />
                                        <label htmlFor="closed-down">Closed/Down</label>
                                    </div>
                                </div>
                                <button type="submit">Submit Guess</button>
                            </form>
                        ) : (
                            <div className="result">
                                <p className={isCorrect ? 'correct' : 'incorrect'}>
                                    {resultMessage}
                                </p>
                                <p>{
                                    attractions[currentAttractionIndex].status === 'DOWN' || 
                                    attractions[currentAttractionIndex].status === 'CLOSED' ||
                                    attractions[currentAttractionIndex].status === 'REFURBISHMENT'
                                        ? attractions[currentAttractionIndex].status === 'REFURBISHMENT'
                                            ? 'Ride is currently being refurbished'
                                            : `Ride is ${attractions[currentAttractionIndex].status.toLowerCase()}`
                                        : `Actual wait time: ${attractions[currentAttractionIndex].queue.STANDBY?.waitTime ?? 0} minutes`
                                }</p>
                                <button onClick={handleNextAttraction}>
                                    {currentAttractionIndex < attractions.length - 1 ? 'Next Attraction' : 'Finish Game'}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {attractions.length > 0 && currentAttractionIndex >= attractions.length && (
                <div className="game-container">
                    <div className="final-score">
                        <h2>Game Over!</h2>
                        <p>Congrats, you scored {score} points!</p>
                        <button onClick={handlePlayAgain}>Play Again?</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ThemeParkSelector; 