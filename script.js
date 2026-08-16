const symbols = ["🍕", "🍔", "🌭", "🥨", "🍖"];
let balance = 1000;
let isSpinning = false;

const balanceDisplay = document.getElementById('balance');
const betInput = document.getElementById('bet-amount');
const spinButton = document.getElementById('spin-button');
const messageArea = document.getElementById('message');
const reels = [
    document.getElementById('reel-1').querySelector('.reel-inner'),
    document.getElementById('reel-2').querySelector('.reel-inner'),
    document.getElementById('reel-3').querySelector('.reel-inner')
];

// Initialize reels
function initReels() {
    reels.forEach(reel => {
        reel.innerHTML = `<span class="symbol">${symbols[Math.floor(Math.random() * symbols.length)]}</span>`;
    });
}

function updateBalance(amount) {
    balance = amount;
    balanceDisplay.textContent = `$${balance.toLocaleString()}`;

    // Animate balance change
    balanceDisplay.classList.add('pulse');
    setTimeout(() => balanceDisplay.classList.remove('pulse'), 500);
}

function setBet(amount) {
    if (isSpinning) return;
    betInput.value = amount;
}

document.getElementById('max-bet').onclick = () => {
    if (isSpinning) return;
    betInput.value = balance;
};

async function spin() {
    if (isSpinning) return;

    const bet = parseInt(betInput.value);

    // Validation
    if (isNaN(bet) || bet <= 0) {
        showMessage("Please enter a valid bet!", "error");
        return;
    }

    if (bet > balance) {
        showMessage("Insufficient funds!", "error");
        return;
    }

    // Start Spin
    isSpinning = true;
    spinButton.disabled = true;
    updateBalance(balance - bet);
    showMessage("Spinning...", "info");

    const results = [];
    const reelAnimations = reels.map((reel, index) => {
        reel.parentElement.classList.add('spinning'); // Add blur effect
        return animateReel(reel, index).then(res => {
            reel.parentElement.classList.remove('spinning'); // Remove blur effect
            return res;
        });
    });

    const finalSymbols = await Promise.all(reelAnimations);

    const payout = calculatePayout(finalSymbols, bet);

    if (payout > 0) {
        updateBalance(balance + payout);
        showMessage(`WINNER! You won $${payout}!`, "success");
        highlightWin(finalSymbols);
    } else {
        showMessage("Sorry, try again!", "info");
    }

    isSpinning = false;
    spinButton.disabled = false;
}

function animateReel(reel, index) {
    return new Promise(resolve => {
        const symbolCount = 15 + (index * 5); // Reduced from 20+10 to reduce DOM nodes
        const spinSymbols = [];

        for (let i = 0; i < symbolCount; i++) {
            spinSymbols.push(symbols[Math.floor(Math.random() * symbols.length)]);
        }

        const finalSymbol = spinSymbols[spinSymbols.length - 1];

        // Build the vertical strip
        reel.innerHTML = spinSymbols.map(s => `<span class="symbol">${s}</span>`).join('');

        // Reset position instantly
        reel.style.transition = 'none';
        reel.style.transform = 'translateY(0)';

        // Force reflow
        void reel.offsetHeight;

        // Animate using a cleaner duration
        const duration = 1 + (index * 0.4);
        reel.style.transition = `transform ${duration}s cubic-bezier(0.25, 0.1, 0.25, 1)`;
        const symbolHeight = window.innerWidth <= 480 ? 120 : 180;
        const offset = (symbolCount - 1) * symbolHeight;
        reel.style.transform = `translateY(-${offset}px)`;

        setTimeout(() => {
            reel.style.transition = 'none';
            reel.innerHTML = `<span class="symbol">${finalSymbol}</span>`;
            reel.style.transform = 'translateY(0)';
            resolve(finalSymbol);
        }, duration * 1000);
    });
}

function calculatePayout(row, bet) {
    // 3 of a kind
    if (row[0] === row[1] && row[1] === row[2]) {
        switch (row[0]) {
            case "🍕": return bet * 3;
            case "🍔": return bet * 4;
            case "🌭": return bet * 5;
            case "🥨": return bet * 10;
            case "🍖": return bet * 30;
            default: return 0;
        }
    }
    // 2 of a kind (adjacent) - Logic from Java
    else if (row[0] === row[1]) {
        switch (row[0]) {
            case "🍕": return bet * 2;
            case "🍔": return bet * 3;
            case "🌭": return bet * 4;
            case "🥨": return bet * 5;
            case "🍖": return bet * 15;
            default: return 0;
        }
    }
    else if (row[1] === row[2]) {
        switch (row[1]) {
            case "🍕": return bet * 2;
            case "🍔": return bet * 3;
            case "🌭": return bet * 4;
            case "🥨": return bet * 5;
            case "🍖": return bet * 15;
            default: return 0;
        }
    }
    return 0;
}

function showMessage(text, type) {
    messageArea.textContent = text;
    messageArea.style.color = type === "error" ? "#ff4d4d" : (type === "success" ? "#f5d142" : "rgba(255,255,255,0.6)");

    if (type === "success") {
        messageArea.style.textShadow = "0 0 10px rgba(245, 209, 66, 0.5)";
    } else {
        messageArea.style.textShadow = "none";
    }
}

function highlightWin(row) {
    const reelContainers = [
        document.getElementById('reel-1'),
        document.getElementById('reel-2'),
        document.getElementById('reel-3')
    ];

    if (row[0] === row[1] && row[1] === row[2]) {
        reelContainers.forEach(r => r.classList.add('winning-reel'));
    } else if (row[0] === row[1]) {
        reelContainers[0].classList.add('winning-reel');
        reelContainers[1].classList.add('winning-reel');
    } else if (row[1] === row[2]) {
        reelContainers[1].classList.add('winning-reel');
        reelContainers[2].classList.add('winning-reel');
    }

    setTimeout(() => {
        reelContainers.forEach(r => r.classList.remove('winning-reel'));
    }, 2000);
}

// Modal Handlers
const depositModal = document.getElementById('deposit-modal');
const depositAmountInput = document.getElementById('deposit-amount');

document.getElementById('deposit-btn').onclick = () => {
    depositModal.style.display = 'flex';
    depositAmountInput.focus();
};

function closeDeposit() {
    depositModal.style.display = 'none';
    depositAmountInput.value = '';
}

function confirmDeposit() {
    const amount = parseInt(depositAmountInput.value);
    if (isNaN(amount) || amount <= 0) {
        alert("Please enter a valid amount!");
        return;
    }

    updateBalance(balance + amount);
    showMessage(`Successfully added $${amount}!`, "success");
    closeDeposit();
}

// Close modal when clicking outside
window.onclick = (event) => {
    if (event.target === depositModal) {
        closeDeposit();
    }
};

// Low Spec Toggle
const lowSpecToggle = document.getElementById('low-spec-toggle');
lowSpecToggle.onclick = () => {
    document.body.classList.toggle('low-spec');
    lowSpecToggle.textContent = document.body.classList.contains('low-spec') ? '✨' : '💨';
};

spinButton.addEventListener('click', spin);

// Initialize
initReels();
