import React, { useEffect, useState } from 'react';
import './App.css';

interface Book {
    id: string; 
    title: string;
    author?: string;
    year?: string | number;
    cover?: string;
    sourceId?: string; 
}

function App() {
    const [books, setBooks] = useState<Book[]>(() => {
        const storedBooks = localStorage.getItem('bookTracker.books');
        return storedBooks ? JSON.parse(storedBooks) : [];
    });
    const [title, setTitle] = useState('');
    const [author, setAuthor] = useState('');
    const [year, setYear] = useState('');

    const [query, setQuery] = useState('');
    const [searchResults, setSearchResults] = useState<Book[]>([]);
    const [searchLoading, setSearchLoading] = useState(false);



    useEffect(() => {
        try {
            localStorage.setItem('bookTracker.books', JSON.stringify(books));
        } catch (error) {
            console.error('Failed to save books to localStorage:', error);
        }
    }, [books]);

    function addBookManual() {
        if (!title.trim()) return;
        const b: Book = {
            id: `local-${Date.now()}`,
            title: title.trim(),
            author: author.trim() || undefined,
            year: year ? year.trim() : undefined
        };
        setBooks(prev => Array.isArray(prev) ? [b, ...prev] : [b]);
        setTitle(''); setAuthor(''); setYear('');
    }

    function addBookFromSearch(b: Book) {
        const exists = books.some(x => (b.sourceId && x.sourceId === b.sourceId) || (x.title === b.title && x.author === b.author));
        if (exists) return;
        setBooks(prev => Array.isArray(prev) ? [{ ...b, id: `ol-${Date.now()}` }, ...prev] : [{ ...b, id: `ol-${Date.now()}` }]);
    }

    function removeBook(id: string) {
        setBooks(prev => prev.filter(b => b.id !== id));
    }

    async function searchOpenLibrary(q: string) {
        if (!q.trim()) return;
        setSearchLoading(true);
        try {
            const resp = await fetch(`https://openlibrary.org/search.json?q=${encodeURIComponent(q)}&limit=12`);
            if (!resp.ok) {
                setSearchResults([]);
                return;
            }
            const data = await resp.json();
            const results: Book[] = (data.docs || []).map((doc: any) => ({
                id: doc.key || `${doc.title}-${doc.first_publish_year || ''}`,
                title: doc.title || 'Unknown',
                author: Array.isArray(doc.author_name) ? doc.author_name[0] : doc.author_name || undefined,
                year: doc.first_publish_year,
                cover: doc.cover_i ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-M.jpg` : undefined,
                sourceId: doc.key
            }));
            setSearchResults(results);
        } catch (e) {
            setSearchResults([]);
        } finally {
            setSearchLoading(false);
        }
    }

    return (
        <div
            className="container"
            style={{
                maxWidth: '1000px',
                margin: '0 auto',
                padding: '2rem',
                fontFamily: 'Arial, sans-serif',
                color: '#222'
            }}
        >
            <header style={{ marginBottom: '2rem' }}>
                <h1 style={{ marginBottom: '0.25rem' }}>📚 Book Tracker</h1>
                <p style={{ color: '#666' }}>
                    Add books manually or search Open Library and save them to your
                    collection.
                </p>
            </header>

            <section
                style={{
                    background: '#fff',
                    padding: '1.5rem',
                    borderRadius: '12px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                    marginBottom: '2rem'
                }}
            >
                <h2 style={{ marginBottom: '1rem' }}>Add a Book</h2>

                <div
                    style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr 120px auto',
                        gap: '0.75rem'
                    }}
                >
                    <input
                        placeholder="Title"
                        value={title}
                        onChange={e => setTitle(e.target.value)}
                        style={inputStyle}
                    />

                    <input
                        placeholder="Author"
                        value={author}
                        onChange={e => setAuthor(e.target.value)}
                        style={inputStyle}
                    />

                    <input
                        placeholder="Year"
                        value={year}
                        onChange={e => setYear(e.target.value)}
                        style={inputStyle}
                    />

                    <button onClick={addBookManual} style={primaryButton}>
                        Add Book
                    </button>
                </div>
            </section>

            {/* SEARCH */}
            <section
                style={{
                    background: '#fff',
                    padding: '1.5rem',
                    borderRadius: '12px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                    marginBottom: '2rem'
                }}
            >
                <h2 style={{ marginBottom: '1rem' }}>Search Open Library</h2>

                <div
                    style={{
                        display: 'flex',
                        gap: '0.75rem'
                    }}
                >
                    <input
                        placeholder="Search title, author, ISBN..."
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                        style={{
                            ...inputStyle,
                            flex: 1
                        }}
                    />

                    <button
                        onClick={() => searchOpenLibrary(query)}
                        disabled={searchLoading}
                        style={{
                            ...primaryButton,
                            opacity: searchLoading ? 0.7 : 1
                        }}
                    >
                        {searchLoading ? 'Searching...' : 'Search'}
                    </button>
                </div>

                <div style={{ marginTop: '1.5rem' }}>
                    {searchResults.length === 0 && !searchLoading ? (
                        <p style={{ color: '#777' }}>No results yet.</p>
                    ) : (
                        <div
                            style={{
                                display: 'grid',
                                gap: '1rem'
                            }}
                        >
                            {searchResults.map(r => (
                                <div
                                    key={r.id}
                                    style={{
                                        display: 'flex',
                                        gap: '1rem',
                                        alignItems: 'center',
                                        padding: '1rem',
                                        border: '1px solid #eee',
                                        borderRadius: '10px'
                                    }}
                                >
                                    {r.cover ? (
                                        <img
                                            src={r.cover}
                                            alt={r.title}
                                            style={{
                                                width: '60px',
                                                height: '90px',
                                                objectFit: 'cover',
                                                borderRadius: '6px'
                                            }}
                                        />
                                    ) : (
                                        <div
                                            style={{
                                                width: '60px',
                                                height: '90px',
                                                background: '#eee',
                                                borderRadius: '6px'
                                            }}
                                        />
                                    )}

                                    <div style={{ flex: 1 }}>
                                        <div
                                            style={{
                                                fontWeight: 'bold',
                                                marginBottom: '0.25rem'
                                            }}
                                        >
                                            {r.title}
                                        </div>

                                        <div style={{ color: '#666' }}>
                                            {r.author}
                                            {r.year ? ` • ${r.year}` : ''}
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => addBookFromSearch(r)}
                                        style={successButton}
                                    >
                                        Add
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </section>

            <section
                style={{
                    background: '#fff',
                    padding: '1.5rem',
                    borderRadius: '12px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
                }}
            >
                <h2 style={{ marginBottom: '1rem' }}>
                    Your Collection ({books.length})
                </h2>

                {books.length === 0 ? (
                    <p style={{ color: '#777' }}>No books added yet.</p>
                ) : (
                    <div
                        style={{
                            display: 'grid',
                            gap: '1rem'
                        }}
                    >
                        {books.map(b => (
                            <div
                                key={b.id}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '1rem',
                                    padding: '1rem',
                                    border: '1px solid #eee',
                                    borderRadius: '10px'
                                }}
                            >
                                {b.cover ? (
                                    <img
                                        src={b.cover}
                                        alt={b.title}
                                        style={{
                                            width: '50px',
                                            height: '75px',
                                            objectFit: 'cover',
                                            borderRadius: '6px'
                                        }}
                                    />
                                ) : (
                                    <div
                                        style={{
                                            width: '50px',
                                            height: '75px',
                                            background: '#eee',
                                            borderRadius: '6px'
                                        }}
                                    />
                                )}

                                <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: 'bold' }}>{b.title}</div>

                                    <div style={{ color: '#666', marginTop: '0.25rem' }}>
                                        {b.author}
                                        {b.year ? ` • ${b.year}` : ''}
                                    </div>
                                </div>

                                <button
                                    onClick={() => removeBook(b.id)}
                                    style={dangerButton}
                                >
                                    Remove
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </section>
        </div>
    )
}

    const inputStyle = {
        padding: '0.75rem',
        borderRadius: '8px',
        border: '1px solid #ccc',
        fontSize: '0.95rem'
    }

    const primaryButton = {
        padding: '0.75rem 1.25rem',
        border: 'none',
        borderRadius: '8px',
        background: '#2563eb',
        color: '#fff',
        fontWeight: 600,
        cursor: 'pointer'
    }

    const successButton = {
        padding: '0.6rem 1rem',
        border: 'none',
        borderRadius: '8px',
        background: '#16a34a',
        color: '#fff',
        fontWeight: 600,
        cursor: 'pointer'
    }

    const dangerButton = {
        padding: '0.6rem 1rem',
        border: 'none',
        borderRadius: '8px',
        background: '#dc2626',
        color: '#fff',
        fontWeight: 600,
        cursor: 'pointer'
    }


export default App;
