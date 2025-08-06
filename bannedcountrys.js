const bannedCountries = [
    'IR', // Iran
    'KP', // North Korea
    'SY', // Syria
    'CU'
    // Add more country codes as needed
];

// Helper to get user's country code (using browser locale or IP-based API)
function getUserCountryCode() {
    // Try navigator.language (not always accurate)
    if (navigator.language) {
        return navigator.language.split('-')[1] || '';
    }
    // Fallback: always allow if unknown
    return '';
}

function isBannedCountry() {
    const countryCode = getUserCountryCode().toUpperCase();
    return bannedCountries.includes(countryCode);
}

function showBanMessage() {
    document.body.innerHTML = `
        <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;">
            <h1>GAMERYT Calendar is not available in your country or region</h1>
        </div>
    `;
}

// Main logic
if (isBannedCountry()) {
    showBanMessage();
}
