'use client';

import { useState } from 'react';
import EarthGlobe from './earth-globe';
import { COUNTRIES } from './countries';

function CountryFlag({ country }) {
    return (
        <span className={`country-flag flag-${country.code.toLowerCase()}`} aria-hidden="true">
            {country.code}
        </span>
    );
}

function Overview() {
    return (
        <section className="overview-section" aria-labelledby="overview-heading">
            <div className="section-heading">
                <h2 id="overview-heading">All countries</h2>
                <p>Example values for the three demo countries.</p>
            </div>
            <div className="table-scroll">
                <table className="country-table">
                    <thead>
                        <tr>
                            <th scope="col">Country</th>
                            <th scope="col">Population</th>
                            <th scope="col">Area (km²)</th>
                            <th scope="col">GDP (USD bn)</th>
                        </tr>
                    </thead>
                    <tbody>
                        {COUNTRIES.map((country) => (
                            <tr key={country.code}>
                                <th scope="row">
                                    <span className="table-country">
                                        <CountryFlag country={country} />
                                        {country.name}
                                    </span>
                                </th>
                                {country.metrics.map((metric) => (
                                    <td key={metric.label}>{metric.value}</td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <p className="sample-note">Sample data and placeholder flags. Replace them with verified country data.</p>
        </section>
    );
}

function Countries({ selectedCountry, onSelectCountry }) {
    return (
        <section className="countries-section" aria-label="Country map and details">
            <div className="globe-panel">
                <EarthGlobe
                    countries={COUNTRIES}
                    selectedCountry={selectedCountry}
                    onSelectCountry={onSelectCountry}
                />
            </div>
            <aside className="country-details">
                <div className="selected-country">
                    <CountryFlag country={selectedCountry} />
                    <div>
                        <h2>{selectedCountry.name}</h2>
                        <p>Demo country · {selectedCountry.code}</p>
                    </div>
                </div>
                <dl className="detail-list">
                    {selectedCountry.metrics.map((metric) => (
                        <div className="detail-row" key={metric.label}>
                            <dt>{metric.label}</dt>
                            <dd>{metric.value}</dd>
                        </div>
                    ))}
                </dl>
                <div className="map-key">
                    <h3>Map flags</h3>
                    {COUNTRIES.map((country) => (
                        <button
                            className={`map-key-item${country.code === selectedCountry.code ? ' is-selected' : ''}`}
                            key={country.code}
                            type="button"
                            onClick={() => onSelectCountry(country.code)}
                        >
                            <CountryFlag country={country} />
                            <span>{country.name}</span>
                        </button>
                    ))}
                </div>
                <p className="map-help">Drag the globe to rotate it, or select a flag to view that country.</p>
            </aside>
        </section>
    );
}

export default function HomePage() {
    const [section, setSection] = useState('overview');
    const [selectedCode, setSelectedCode] = useState(COUNTRIES[0].code);
    const selectedCountry = COUNTRIES.find((country) => country.code === selectedCode) ?? COUNTRIES[0];

    return (
        <div className="app-shell">
            <aside className="sidebar">
                <a className="app-title" href="/" aria-label="Country dashboard home">Country dashboard</a>
                <nav className="side-nav" aria-label="Main navigation">
                    <button
                        className={`nav-item${section === 'overview' ? ' is-active' : ''}`}
                        type="button"
                        aria-current={section === 'overview' ? 'page' : undefined}
                        onClick={() => setSection('overview')}
                    >
                        Overview
                    </button>
                    <button
                        className={`nav-item${section === 'countries' ? ' is-active' : ''}`}
                        type="button"
                        aria-current={section === 'countries' ? 'page' : undefined}
                        onClick={() => setSection('countries')}
                    >
                        Countries
                    </button>
                </nav>
            </aside>

            <main className="main-content">
                <header className="page-header">
                    <div>
                        <p className="page-label">DASHBOARD</p>
                        <h1>{section === 'overview' ? 'Overview' : 'Countries'}</h1>
                    </div>
                    {section === 'countries' && (
                        <label className="country-select-label">
                            <span>Country</span>
                            <select
                                value={selectedCode}
                                onChange={(event) => setSelectedCode(event.target.value)}
                            >
                                {COUNTRIES.map((country) => (
                                    <option key={country.code} value={country.code}>{country.name}</option>
                                ))}
                            </select>
                        </label>
                    )}
                </header>

                {section === 'overview' ? (
                    <Overview />
                ) : (
                    <Countries selectedCountry={selectedCountry} onSelectCountry={setSelectedCode} />
                )}
            </main>
        </div>
    );
}
