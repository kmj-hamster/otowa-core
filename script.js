// Debug mode - show page nav when URL contains #debug or ?debug
if (window.location.hash === '#debug' || window.location.search.includes('debug')) {
    document.querySelector('.page-nav').classList.add('debug');
}

// Location visit tracking
let forestVisited = false;
let hotspringVisited = false;
let ryoteiVisited = false;
let hotspringExplored = false;
let ryoteiExplored = false;

// Inventory system
let inventoryOpen = false;
let selectedInventorySlot = -1;

const inventoryItems = [
    { id: 'mash', name: 'Mushroom', from: 'Ryotei', labels: ['???', '???', '???'], unlocked: false },
    { id: 'sake', name: 'Senbonzuru Sake', from: 'Ryotei', labels: ['???', '???', '???'], unlocked: false },
    { id: 'o', name: 'Amulet', from: 'Hot Spring', labels: ['???', '???', '???'], unlocked: false },
    { id: 'stone', name: 'Onsen Stone', from: 'Station', labels: ['???', '???', '???'], unlocked: false },
    { id: 'bi', name: 'Binoculars', from: 'Station', labels: ['???', '???', '???'], unlocked: false }
];

function toggleInventory() {
    inventoryOpen = !inventoryOpen;
    document.getElementById('inventory-panel').classList.toggle('open', inventoryOpen);
    document.getElementById('inventory-overlay').classList.toggle('open', inventoryOpen);
    if (inventoryOpen) {
        updateInventoryDisplay();
    }
}

function updateInventoryDisplay() {
    let unlockedCount = 0;
    inventoryItems.forEach((item, index) => {
        const slot = document.getElementById('inv-slot-' + index);
        if (item.unlocked) {
            slot.classList.add('unlocked');
            unlockedCount++;
        } else {
            slot.classList.remove('unlocked');
        }
    });
    document.getElementById('inventory-count').textContent = unlockedCount;
}

function hoverInventoryItem(slotIndex) {
    if (slotIndex >= inventoryItems.length) return;

    // Remove active from previous
    document.querySelectorAll('.inventory-slot').forEach(slot => slot.classList.remove('active'));

    // Add active to current
    document.getElementById('inv-slot-' + slotIndex).classList.add('active');
    selectedInventorySlot = slotIndex;

    const item = inventoryItems[slotIndex];
    const detail = document.getElementById('inventory-detail');

    if (!item.unlocked) {
        // Show locked state
        detail.innerHTML = `
            <div class="inventory-detail-img">
                <span style="color: #3a5a3a; font-size: 2.5rem;">?</span>
            </div>
            <div class="inventory-detail-name">???</div>
            <div class="inventory-detail-from">Not yet obtained</div>
            <div class="inventory-labels">
                <span class="inventory-label">???</span>
                <span class="inventory-label">???</span>
                <span class="inventory-label">???</span>
            </div>
        `;
    } else {
        // Show unlocked state
        let labelsHtml = item.labels.map(label =>
            `<span class="inventory-label">${label}</span>`
        ).join('');

        detail.innerHTML = `
            <div class="inventory-detail-img">
                <img src="${item.id}.png" alt="${item.name}">
            </div>
            <div class="inventory-detail-name">${item.name}</div>
            <div class="inventory-detail-from">Obtained from: ${item.from}</div>
            <div class="inventory-labels">${labelsHtml}</div>
        `;
    }
}

function unlockInventoryItem(itemId) {
    const index = inventoryItems.findIndex(item => item.id === itemId);
    if (index !== -1 && !inventoryItems[index].unlocked) {
        inventoryItems[index].unlocked = true;
        updateInventoryDisplay();
    }
}

// Close inventory when clicking outside (handled by overlay onclick)

// Note pagination
let currentNotePage = 1;
const totalNotePages = 4;

function visitLocation(location) {
    const closedLocations = ['station', 'pub', 'playground'];
    if (closedLocations.includes(location)) {
        showToast();
        return;
    }
    if (location === 'forest') {
        forestVisited = true;
        updateNoteContent();
        goToPage('forest');
        return;
    }
    if (location === 'hotspring') {
        hotspringVisited = true;
        updateNoteContent();
        if (hotspringExplored) {
            showHotspringExplored();
        } else {
            resetHotspring();
        }
        goToPage('hotspring');
        return;
    }
    if (location === 'ryotei') {
        ryoteiVisited = true;
        updateNoteContent();
        if (ryoteiExplored) {
            showRyoteiExplored();
        } else {
            resetRyotei();
        }
        goToPage('ryotei');
        return;
    }
    console.log('Visiting:', location);
}

function showToast() {
    const toast = document.getElementById('map-toast');
    toast.classList.add('show');
    setTimeout(() => {
        toast.classList.remove('show');
    }, 2000);
}

// Hot Spring branch state
let hotspringBranch1Read = false;
let hotspringBranch2Read = false;

function resetHotspring() {
    hotspringBranch1Read = false;
    hotspringBranch2Read = false;
    document.getElementById('hotspring-branch1').style.display = 'none';
    document.getElementById('hotspring-branch2').style.display = 'none';
    document.getElementById('hotspring-btn1').style.display = '';
    document.getElementById('hotspring-btn2').style.display = '';
    document.getElementById('hotspring-btn1').textContent = 'TALK TO HER';
    document.getElementById('hotspring-btn2').textContent = 'INVESTIGATE';
    document.getElementById('hotspring-btn1').onclick = function() { hotspringChoice(1); };
    document.getElementById('hotspring-btn2').onclick = function() { hotspringChoice(2); };
}

function showHotspringExplored() {
    document.getElementById('hotspring-branch1').style.display = 'block';
    document.getElementById('hotspring-branch2').style.display = 'block';
    document.getElementById('hotspring-btn1').style.display = 'none';
    document.getElementById('hotspring-btn2').style.display = '';
    document.getElementById('hotspring-btn2').textContent = 'RETURN TO MAP';
    document.getElementById('hotspring-btn2').onclick = function() { goToPage(9); };
    unlockInventoryItem('o');
}

function hotspringChoice(choice) {
    const nav = document.getElementById('hotspring-nav');
    const branch = document.getElementById('hotspring-branch' + choice);

    // Move branch before nav buttons so it appears in selection order
    nav.parentNode.insertBefore(branch, nav);
    branch.style.display = 'block';

    if (choice === 1) {
        hotspringBranch1Read = true;
        unlockInventoryItem('o');
    } else if (choice === 2) {
        hotspringBranch2Read = true;
    }

    updateHotspringNav(choice);
    branch.scrollIntoView({ behavior: 'smooth' });
}

function updateHotspringNav(justRead) {
    const btn1 = document.getElementById('hotspring-btn1');
    const btn2 = document.getElementById('hotspring-btn2');

    if (hotspringBranch1Read && hotspringBranch2Read) {
        // Both read - mark as explored and show return to map
        hotspringExplored = true;
        btn1.style.display = 'none';
        btn2.style.display = '';
        btn2.textContent = 'RETURN TO MAP';
        btn2.onclick = function() { goToPage(9); };
    } else if (justRead === 1) {
        // Just read branch 1 - show branch 2 option
        btn1.style.display = 'none';
        btn2.style.display = '';
        btn2.textContent = 'INVESTIGATE';
        btn2.onclick = function() { hotspringChoice(2); };
    } else if (justRead === 2) {
        // Just read branch 2 - show branch 1 option
        btn2.style.display = 'none';
        btn1.style.display = '';
        btn1.textContent = 'TALK TO HER';
        btn1.onclick = function() { hotspringChoice(1); };
    }
}

// Ryotei branch state
let ryoteiBranch1Read = false;
let ryoteiBranch2Read = false;
let ryoteiBranch3Read = false;

function resetRyotei() {
    ryoteiBranch1Read = false;
    ryoteiBranch2Read = false;
    ryoteiBranch3Read = false;
    document.getElementById('ryotei-branch1').style.display = 'none';
    document.getElementById('ryotei-branch2').style.display = 'none';
    document.getElementById('ryotei-branch3').style.display = 'none';
    document.getElementById('ryotei-btn1').style.display = '';
    document.getElementById('ryotei-btn2').style.display = '';
    document.getElementById('ryotei-btn3').style.display = '';
    document.getElementById('ryotei-btn1').textContent = 'TASTE FOOD';
    document.getElementById('ryotei-btn2').textContent = 'EXAMINE SAKE';
    document.getElementById('ryotei-btn3').textContent = 'LOOK AROUND';
    document.getElementById('ryotei-btn1').onclick = function() { ryoteiChoice(1); };
    document.getElementById('ryotei-btn2').onclick = function() { ryoteiChoice(2); };
    document.getElementById('ryotei-btn3').onclick = function() { ryoteiChoice(3); };
}

function showRyoteiExplored() {
    document.getElementById('ryotei-branch1').style.display = 'block';
    document.getElementById('ryotei-branch2').style.display = 'block';
    document.getElementById('ryotei-branch3').style.display = 'block';
    document.getElementById('ryotei-btn1').style.display = 'none';
    document.getElementById('ryotei-btn2').style.display = 'none';
    document.getElementById('ryotei-btn3').style.display = '';
    document.getElementById('ryotei-btn3').textContent = 'RETURN TO MAP';
    document.getElementById('ryotei-btn3').onclick = function() { goToPage(9); };
    unlockInventoryItem('mash');
    unlockInventoryItem('sake');
}

function ryoteiChoice(choice) {
    const nav = document.getElementById('ryotei-nav');
    const branch = document.getElementById('ryotei-branch' + choice);

    // Move branch before nav buttons so it appears in selection order
    nav.parentNode.insertBefore(branch, nav);
    branch.style.display = 'block';

    if (choice === 1) {
        ryoteiBranch1Read = true;
        unlockInventoryItem('mash');
    } else if (choice === 2) {
        ryoteiBranch2Read = true;
        unlockInventoryItem('sake');
    } else if (choice === 3) {
        ryoteiBranch3Read = true;
    }

    branch.scrollIntoView({ behavior: 'smooth' });
    updateRyoteiNav();
}

function updateRyoteiNav() {
    const btn1 = document.getElementById('ryotei-btn1');
    const btn2 = document.getElementById('ryotei-btn2');
    const btn3 = document.getElementById('ryotei-btn3');

    // Hide buttons for branches already read
    btn1.style.display = ryoteiBranch1Read ? 'none' : '';
    btn2.style.display = ryoteiBranch2Read ? 'none' : '';
    btn3.style.display = ryoteiBranch3Read ? 'none' : '';

    // If all read, mark as explored and show return to map
    if (ryoteiBranch1Read && ryoteiBranch2Read && ryoteiBranch3Read) {
        ryoteiExplored = true;
        btn1.style.display = 'none';
        btn2.style.display = 'none';
        btn3.style.display = '';
        btn3.textContent = 'RETURN TO MAP';
        btn3.onclick = function() { goToPage(9); };
    }
}

// Note content
const noteContents = {
    forest: `<div class="note-section-title">The Forest</div>
        <p class="note-text">I accidentally scared away an old man's bird in the forest today. How embarrassing... He's been staking out the mountains searching for a "rare bird," and his binoculars barely leave his eyes. He said this bird is incredibly cautious; I wonder if I'll ever get the chance to see it for myself.</p>`,
    hotspring: `<div class="note-section-title">The Hot Springs</div>
        <p class="note-text">I went to the hot springs after dark, but unfortunately, they were already closed. I met Mizuki there, and she even gave me an amulet as a welcoming gift. According to her, it's been years since an outsider settled down in the village.</p>
        <p class="note-text">I saw some "onsen stones" by the water. Mizuki said they just look like ordinary black stones at first, but a very knowledgeable man named Grandpa Rintaro told everyone that if you polish them, they will reflect all the colors of the rainbow.</p>`,
    ryotei: `<div class="note-section-title">The Ryotei</div>
        <p class="note-text">The welcome banquet tonight was a lavish feast. Chief Junko and Mr. Yuji from the pub are both such wonderful people. They came clean about the station facing permanent closure, but their genuine kindness makes it impossible for me to just walk away and leave them in a bind.</p>
        <p class="note-text">Chef Jiro is a very serious man. His mushroom dish truly has a natural, traditional aroma.</p>
        <p class="note-text">The sake served at dinner is Mr. Yuji's pride and joy—even though Chef Jiro scoffed at it for having an "altered recipe." Mr. Yuji joked that whether it's his sake or Jiro's cooking, the core secret actually lies in Otowa Village's mountain spring water.</p>
        <p class="note-text">I saw an old newspaper clipping: Otowa Village swept the top two spots in a local specialty competition with the sake and the mushroom dish. The judges were deeply torn, but ultimately cast their winning votes for the side representing innovation.</p>`,
    self: `<div class="note-section-title">Note to Self</div>
        <p class="note-text">Seven days. 2,000 passengers. It sounds like an impossible mission. But maybe this village really has the magic to prove itself. Anyway, work starts tomorrow. Do your best, Rin!</p>`
};

function updateNoteContent() {
    // Forest
    if (forestVisited) {
        document.getElementById('note-forest-content').innerHTML = noteContents.forest;
    }
    // Hot Spring
    if (hotspringVisited) {
        document.getElementById('note-hotspring-content').innerHTML = noteContents.hotspring;
    }
    // Ryotei
    if (ryoteiVisited) {
        document.getElementById('note-ryotei-content').innerHTML = noteContents.ryotei;
    }
    // Note to Self - only when all visited
    if (forestVisited && hotspringVisited && ryoteiVisited) {
        document.getElementById('note-self-content').innerHTML = noteContents.self;
        // Make journal button blink
        document.querySelector('.note-btn').classList.add('blink');
        // Show next day button
        document.getElementById('next-day-btn').style.display = 'flex';
    }
}

function goToNextDay() {
    goToPage('tutorial');
}

// Day 2 Journal pagination
let currentDay2JournalPage = 1;
const totalDay2JournalPages = 4;

function changeDay2JournalPage(delta) {
    const newPage = currentDay2JournalPage + delta;
    if (newPage < 1 || newPage > totalDay2JournalPages) return;

    document.getElementById('day2-journal-page-' + currentDay2JournalPage).classList.remove('active');
    currentDay2JournalPage = newPage;
    document.getElementById('day2-journal-page-' + currentDay2JournalPage).classList.add('active');

    // Update navigation buttons
    document.getElementById('day2-journal-prev').disabled = currentDay2JournalPage === 1;
    document.getElementById('day2-journal-next').disabled = currentDay2JournalPage === totalDay2JournalPages;

    // Update indicator
    document.getElementById('day2-journal-indicator').textContent = currentDay2JournalPage + ' / ' + totalDay2JournalPages;
}

// Tutorial system
let currentTutorialStep = 1;
const totalTutorialSteps = 8;
let tutorialItemSelected = false;
let tutorialSelectedItemId = null;
let draggedLabel = null;

function updateTutorialNav() {
    const prevBtn = document.getElementById('tutorial-prev-btn');
    const nextBtn = document.getElementById('tutorial-btn');

    // Show/hide previous button
    prevBtn.style.display = currentTutorialStep === 1 ? 'none' : '';

    // Update next button text on last step
    if (currentTutorialStep === totalTutorialSteps) {
        nextBtn.textContent = 'Begin Day 2';
    } else {
        nextBtn.textContent = 'Continue';
    }
}

function tutorialPrev() {
    if (currentTutorialStep > 1) {
        document.getElementById('tutorial-step-' + currentTutorialStep).classList.remove('active');
        currentTutorialStep--;
        document.getElementById('tutorial-step-' + currentTutorialStep).classList.add('active');
        updateTutorialNav();
    }
}

function tutorialNext() {
    // Special handling for step 3 - reveal labels first
    if (currentTutorialStep === 3) {
        const labels = ['Hot spring', 'Mizuki', 'Rintaro'];
        const label1 = document.getElementById('label-reveal-1');
        const label2 = document.getElementById('label-reveal-2');
        const label3 = document.getElementById('label-reveal-3');
        const hint = document.getElementById('reveal-hint');

        if (label1.classList.contains('hidden')) {
            // First click - reveal labels one by one
            hint.textContent = '';

            setTimeout(() => {
                label1.textContent = labels[0];
                label1.classList.remove('hidden');
                label1.classList.add('revealed');
            }, 0);

            setTimeout(() => {
                label2.textContent = labels[1];
                label2.classList.remove('hidden');
                label2.classList.add('revealed');
            }, 400);

            setTimeout(() => {
                label3.textContent = labels[2];
                label3.classList.remove('hidden');
                label3.classList.add('revealed');
            }, 800);

            return; // Don't advance step yet
        }
    }

    // Special handling for step 7 - require correct selection
    if (currentTutorialStep === 7 && !tutorialItemSelected) {
        document.getElementById('tutorial-feedback').textContent = 'Please select an item first.';
        return;
    }

    // Advance to next step
    if (currentTutorialStep < totalTutorialSteps) {
        document.getElementById('tutorial-step-' + currentTutorialStep).classList.remove('active');
        currentTutorialStep++;

        // Update step 8 content based on selected item
        if (currentTutorialStep === 8) {
            updateSuccessPage();
        }

        document.getElementById('tutorial-step-' + currentTutorialStep).classList.add('active');
        updateTutorialNav();
    } else {
        // Tutorial complete - start Day 2
        startDay2();
    }
}

function tutorialSelectItem(itemId) {
    const correctAnswers = ['stone', 'o']; // Both Stone and Omamori have "Hot spring" label
    const feedback = document.getElementById('tutorial-feedback');
    const items = document.querySelectorAll('#tutorial-clickable-items .tutorial-item');

    // Remove previous states
    items.forEach(item => {
        item.classList.remove('wrong', 'selected');
    });

    const clickedItem = event.currentTarget;

    if (correctAnswers.includes(itemId)) {
        // Correct!
        clickedItem.classList.add('selected');
        if (itemId === 'stone') {
            feedback.textContent = 'Correct! The onsen stone is connected to the Hot spring.';
        } else {
            feedback.textContent = 'Correct! The amulet is connected to the Hot spring.';
        }
        feedback.classList.add('success');
        tutorialItemSelected = true;
        tutorialSelectedItemId = itemId;
    } else {
        // Wrong answer
        clickedItem.classList.add('wrong');
        feedback.textContent = 'Not quite... Think about which items are related to the hot spring.';
        feedback.classList.remove('success');

        // Remove wrong class after animation
        setTimeout(() => {
            clickedItem.classList.remove('wrong');
        }, 500);
    }
}

function updateSuccessPage() {
    const img = document.getElementById('success-item-img');
    const labelsContainer = document.getElementById('success-labels');

    if (tutorialSelectedItemId === 'stone') {
        img.src = 'stone.png';
        img.alt = 'Stone';
        labelsContainer.innerHTML = `
            <span class="tutorial-label fixed">Hot spring</span>
            <span class="tutorial-label">Mizuki</span>
            <span class="tutorial-label">Rintaro</span>
        `;
    } else if (tutorialSelectedItemId === 'o') {
        img.src = 'o.png';
        img.alt = 'Omamori';
        labelsContainer.innerHTML = `
            <span class="tutorial-label fixed">Hot spring</span>
            <span class="tutorial-label hidden">???</span>
            <span class="tutorial-label hidden">???</span>
        `;
    }
}

function resetTutorial() {
    currentTutorialStep = 1;
    tutorialItemSelected = false;
    tutorialSelectedItemId = null;

    // Hide all steps, show first
    for (let i = 1; i <= totalTutorialSteps; i++) {
        document.getElementById('tutorial-step-' + i).classList.remove('active');
    }
    document.getElementById('tutorial-step-1').classList.add('active');

    // Reset buttons
    document.getElementById('tutorial-btn').textContent = 'Continue';
    document.getElementById('tutorial-prev-btn').style.display = 'none';

    // Reset step 3 labels
    const label1 = document.getElementById('label-reveal-1');
    const label2 = document.getElementById('label-reveal-2');
    const label3 = document.getElementById('label-reveal-3');
    const hint = document.getElementById('reveal-hint');

    label1.textContent = '???';
    label1.classList.add('hidden');
    label1.classList.remove('revealed');
    label2.textContent = '???';
    label2.classList.add('hidden');
    label2.classList.remove('revealed');
    label3.textContent = '???';
    label3.classList.add('hidden');
    label3.classList.remove('revealed');
    hint.textContent = '(Click "Continue" to reveal the labels)';

    // Reset step 6 items
    const items = document.querySelectorAll('#tutorial-clickable-items .tutorial-item');
    items.forEach((item, index) => {
        item.classList.remove('selected', 'wrong');
        item.classList.add('clickable');
        const itemIds = ['bi', 'sake', 'o', 'mash', 'stone'];
        item.onclick = function() { tutorialSelectItem(itemIds[index]); };
    });

    // Reset feedback
    const feedback = document.getElementById('tutorial-feedback');
    feedback.textContent = '';
    feedback.classList.remove('success');

    // Reset drag and drop step
    resetDragDropStep();
}

// Drag and Drop functions
function dragStart(event) {
    draggedLabel = event.target;
    event.target.classList.add('dragging');
    event.dataTransfer.setData('text/plain', event.target.dataset.label);
    event.dataTransfer.effectAllowed = 'move';
}

function dragEnd(event) {
    event.target.classList.remove('dragging');
    // Remove drag-over from all slots
    document.querySelectorAll('.tutorial-slot').forEach(slot => {
        slot.classList.remove('drag-over');
    });
}

function dragOver(event) {
    event.preventDefault();
    const slot = event.target.closest('.tutorial-slot');
    if (slot && !slot.classList.contains('filled')) {
        slot.classList.add('drag-over');
    }
}

function dropLabel(event) {
    event.preventDefault();
    const slot = event.target.closest('.tutorial-slot');
    if (!slot || slot.classList.contains('filled')) return;

    slot.classList.remove('drag-over');

    const labelText = event.dataTransfer.getData('text/plain');
    if (!labelText) return;

    // Fill the slot
    slot.classList.add('filled');
    slot.innerHTML = `<span class="tutorial-slot-label">${labelText}</span>`;
    slot.dataset.labelText = labelText;

    // Hide the label in the pool
    if (draggedLabel) {
        draggedLabel.classList.add('in-slot');
    }
}

function removeLabel(event) {
    const slot = event.target.closest('.tutorial-slot');
    if (!slot || !slot.classList.contains('filled')) return;

    const labelText = slot.dataset.labelText;

    // Clear the slot
    slot.classList.remove('filled');
    slot.innerHTML = '';
    slot.dataset.labelText = '';

    // Show the label back in the pool
    const poolLabels = document.querySelectorAll('#drag-label-pool .tutorial-label');
    poolLabels.forEach(label => {
        if (label.dataset.label === labelText) {
            label.classList.remove('in-slot');
        }
    });
}

function resetDragDropStep() {
    // Reset all slots
    document.querySelectorAll('.tutorial-drag-area .tutorial-slot').forEach(slot => {
        slot.classList.remove('filled', 'drag-over');
        slot.innerHTML = '';
        slot.dataset.labelText = '';
    });

    // Show all labels in pool
    document.querySelectorAll('#drag-label-pool .tutorial-label').forEach(label => {
        label.classList.remove('in-slot', 'dragging');
    });
}

// ==================== DAY 2 GAMEPLAY ====================

const day2Passengers = [
    {
        emoji: '🐦',
        label: 'Bird watching',
        answer: 'bi',
        dialogue: 'Hello, Stationmaster. I am a bird enthusiast. If I can see rare birds here, I would love to stay for a few days.'
    },
    {
        emoji: '🦊',
        label: 'Gold medal',
        answer: 'sake',
        dialogue: 'Hello, I heard there is an amazing local specialty that won a gold medal. As a connoisseur, I absolutely must try it!'
    },
    {
        emoji: '🐰',
        label: 'Health',
        answer: 'o',
        dialogue: "I've heard that living here brings health and longevity. Is that true?"
    },
    {
        emoji: '🐻',
        label: 'Hot spring',
        answer: 'o',
        dialogue: "Work has been so exhausting lately. I'd love nothing more than a good soak in a hot spring. An authentic, open-air bath would be the absolute best!"
    },
    {
        emoji: '🐱',
        label: 'Pub',
        answer: 'sake',
        dialogue: "Hello! After such a long train ride, I'd really love to find a lively spot to grab a drink and unwind. Is there anything in the village that might catch my interest?"
    },
    {
        emoji: '🦌',
        label: 'Spring',
        answer: 'mash',
        dialogue: 'Hello. I heard some local specialties here use the mountain spring. Do you have anything that showcases this?'
    },
    {
        emoji: '🐶',
        label: 'Jiro',
        answer: 'mash',
        dialogue: "I've heard there is a master named Jiro here who strictly preserves traditional techniques from centuries ago. I would very much like to interview him."
    },
    {
        emoji: '🦉',
        label: 'Rintaro',
        answer: 'bi',
        dialogue: 'Excuse me, Stationmaster. I am looking for a retired scholar named Rintaro. Do you have anything that might belong to him?'
    }
];

let day2State = {
    currentPassenger: 0,
    score: 0,
    attempts: 0,
    fixedLabels: {}, // { itemId: [label1, label2, ...] }
    draggedLabel: null,
    gameEnded: false,
    clickCooldown: false
};

function startDay2() {
    // Reset state
    day2State = {
        currentPassenger: 0,
        score: 0,
        attempts: 0,
        fixedLabels: {},
        draggedLabel: null,
        gameEnded: false,
        clickCooldown: false
    };

    // Reset UI
    document.getElementById('day2-score').textContent = '0';
    document.getElementById('day2-game-area').style.display = 'block';
    document.getElementById('day2-summary').style.display = 'none';
    document.getElementById('day2-feedback').textContent = '';
    document.getElementById('day2-feedback').className = 'day2-feedback';

    // Reset all slots
    document.querySelectorAll('.day2-slot').forEach(slot => {
        slot.classList.remove('filled', 'fixed', 'drag-over');
        slot.innerHTML = '';
        slot.dataset.labelText = '';
    });

    // Reset all labels in pool
    document.querySelectorAll('#day2-label-pool .day2-label').forEach(label => {
        label.classList.remove('in-slot', 'fixed', 'dragging');
    });

    // Show first passenger
    showPassenger(0);

    // Navigate to day2 page
    goToPage('day2');
}

function showPassenger(index) {
    if (index >= day2Passengers.length) {
        endDay2();
        return;
    }

    const passenger = day2Passengers[index];
    document.getElementById('day2-passenger-avatar').textContent = passenger.emoji;
    document.getElementById('day2-passenger-num').textContent = index + 1;
    document.getElementById('day2-dialogue').textContent = passenger.dialogue;
    document.getElementById('day2-request-label').textContent = passenger.label;
    day2State.attempts = 0;

    // Reset feedback and show content
    document.getElementById('day2-feedback').textContent = '';
    document.getElementById('day2-feedback').className = 'day2-feedback';
    document.getElementById('day2-passenger-content').classList.remove('hidden');
}

function showPlusOneAnimation() {
    const plusOne = document.getElementById('day2-plus-one');
    // Reset animation
    plusOne.classList.remove('animate');
    // Trigger reflow to restart animation
    void plusOne.offsetWidth;
    // Start animation
    plusOne.classList.add('animate');
}

function day2SelectItem(itemId) {
    if (day2State.gameEnded) return;
    if (day2State.clickCooldown) return;

    // Set cooldown
    day2State.clickCooldown = true;
    setTimeout(() => {
        day2State.clickCooldown = false;
    }, 1000);

    const passenger = day2Passengers[day2State.currentPassenger];
    const feedback = document.getElementById('day2-feedback');
    const content = document.getElementById('day2-passenger-content');

    if (itemId === passenger.answer) {
        // Correct! - Show feedback in passenger box
        content.classList.add('hidden');
        feedback.textContent = 'The passenger is delighted and decides to stay!';
        feedback.className = 'day2-feedback success show';
        day2State.score++;
        document.getElementById('day2-score').textContent = day2State.score;

        // Trigger +1 animation
        showPlusOneAnimation();

        // Fix the label on the item
        fixLabelOnItem(itemId, passenger.label);

        // Next passenger after delay
        setTimeout(() => {
            day2State.currentPassenger++;
            showPassenger(day2State.currentPassenger);
        }, 1500);
    } else {
        // Wrong
        day2State.attempts++;
        if (day2State.attempts >= 2) {
            // Second wrong - passenger leaves
            content.classList.add('hidden');
            feedback.textContent = 'The passenger left disappointed...';
            feedback.className = 'day2-feedback error show';
            setTimeout(() => {
                day2State.currentPassenger++;
                showPassenger(day2State.currentPassenger);
            }, 1500);
        } else {
            // First wrong - try again (keep content visible)
            content.classList.add('hidden');
            feedback.textContent = 'Not quite... Try again!';
            feedback.className = 'day2-feedback error show';
            // Show content again after brief moment
            setTimeout(() => {
                feedback.className = 'day2-feedback';
                content.classList.remove('hidden');
            }, 1000);
        }
    }
}

function fixLabelOnItem(itemId, label) {
    // First, remove this label from any OTHER item it might be on
    document.querySelectorAll('.day2-item-slots').forEach(itemSlots => {
        const otherItemId = itemSlots.dataset.item;
        if (otherItemId !== itemId) {
            itemSlots.querySelectorAll('.day2-slot').forEach(slot => {
                if (slot.dataset.labelText === label) {
                    // Remove the label from this wrong slot
                    slot.classList.remove('filled', 'fixed');
                    slot.innerHTML = '';
                    slot.dataset.labelText = '';
                }
            });
        }
    });

    // Find an empty slot on the correct item and fix the label
    const slots = document.querySelectorAll(`.day2-item-slots[data-item="${itemId}"] .day2-slot`);
    let slotToFix = null;

    // First check if label is already in a slot on this item
    slots.forEach(slot => {
        if (slot.dataset.labelText === label) {
            slotToFix = slot;
        }
    });

    // If not, find empty slot
    if (!slotToFix) {
        slots.forEach(slot => {
            if (!slotToFix && !slot.classList.contains('filled') && !slot.classList.contains('fixed')) {
                slotToFix = slot;
            }
        });
    }

    if (slotToFix) {
        slotToFix.classList.remove('filled');
        slotToFix.classList.add('fixed');
        slotToFix.innerHTML = `<span class="day2-slot-text">${label}</span>`;
        slotToFix.dataset.labelText = label;
    }

    // Hide label from pool
    document.querySelectorAll('#day2-label-pool .day2-label').forEach(labelEl => {
        if (labelEl.dataset.label === label) {
            labelEl.classList.add('fixed');
        }
    });

    // Track fixed labels
    if (!day2State.fixedLabels[itemId]) {
        day2State.fixedLabels[itemId] = [];
    }
    if (!day2State.fixedLabels[itemId].includes(label)) {
        day2State.fixedLabels[itemId].push(label);
    }
}

function endDay2() {
    day2State.gameEnded = true;
    document.getElementById('day2-game-area').style.display = 'none';
    document.getElementById('day2-summary').style.display = 'block';
    document.getElementById('day2-final-score').textContent =
        `${day2State.score}/8 passengers decided to stay.`;
}

// Day 2 Drag and Drop
function day2DragStart(event) {
    day2State.draggedLabel = event.target;
    event.target.classList.add('dragging');
    event.dataTransfer.setData('text/plain', event.target.dataset.label);
    event.dataTransfer.effectAllowed = 'move';
}

function day2DragEnd(event) {
    event.target.classList.remove('dragging');
    document.querySelectorAll('.day2-slot').forEach(slot => {
        slot.classList.remove('drag-over');
    });
}

function day2DragOver(event) {
    event.preventDefault();
    event.stopPropagation();
    const slot = event.target.closest('.day2-slot');
    if (slot && !slot.classList.contains('filled') && !slot.classList.contains('fixed')) {
        slot.classList.add('drag-over');
    }
}

function day2DragLeave(event) {
    event.preventDefault();
    const slot = event.target.closest('.day2-slot');
    if (slot) {
        slot.classList.remove('drag-over');
    }
}

function day2Drop(event) {
    event.preventDefault();
    event.stopPropagation();
    const slot = event.target.closest('.day2-slot');
    if (!slot || slot.classList.contains('filled') || slot.classList.contains('fixed')) return;

    slot.classList.remove('drag-over');

    const labelText = event.dataTransfer.getData('text/plain');
    if (!labelText) return;

    // Fill the slot
    slot.classList.add('filled');
    slot.innerHTML = `<span class="day2-slot-text">${labelText}</span>`;
    slot.dataset.labelText = labelText;

    // Hide the label in pool
    if (day2State.draggedLabel) {
        day2State.draggedLabel.classList.add('in-slot');
    }
}

function day2RemoveLabel(event) {
    event.stopPropagation();
    const slot = event.target.closest('.day2-slot');
    if (!slot || !slot.classList.contains('filled') || slot.classList.contains('fixed')) return;

    const labelText = slot.dataset.labelText;

    // Clear the slot
    slot.classList.remove('filled');
    slot.innerHTML = '';
    slot.dataset.labelText = '';

    // Show the label back in pool
    document.querySelectorAll('#day2-label-pool .day2-label').forEach(label => {
        if (label.dataset.label === labelText) {
            label.classList.remove('in-slot');
        }
    });
}

function changeNotePage(direction) {
    const newPage = currentNotePage + direction;
    if (newPage < 1 || newPage > totalNotePages) return;

    // Hide current page
    document.getElementById('note-page-' + currentNotePage).classList.remove('active');

    // Show new page
    currentNotePage = newPage;
    document.getElementById('note-page-' + currentNotePage).classList.add('active');

    // Update indicator
    document.getElementById('note-indicator').textContent = 'Page ' + currentNotePage + ' / ' + totalNotePages;

    // Update button states
    document.getElementById('note-prev').disabled = currentNotePage === 1;
    document.getElementById('note-next').disabled = currentNotePage === totalNotePages;
}

function resetNotePage() {
    currentNotePage = 1;
    for (let i = 1; i <= totalNotePages; i++) {
        document.getElementById('note-page-' + i).classList.remove('active');
    }
    document.getElementById('note-page-1').classList.add('active');
    document.getElementById('note-indicator').textContent = 'Page 1 / ' + totalNotePages;
    document.getElementById('note-prev').disabled = true;
    document.getElementById('note-next').disabled = false;
}

function goToPage(pageId) {
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });
    document.getElementById(`page-${pageId}`).classList.add('active');

    document.querySelectorAll('.page-nav-btn').forEach((btn, index) => {
        if (typeof pageId === 'number') {
            btn.classList.toggle('active', index + 1 === pageId);
        } else if (pageId === 'tutorial') {
            btn.classList.toggle('active', index === 9); // 10th button (index 9)
        } else if (pageId === 'day2') {
            btn.classList.toggle('active', index === 10); // 11th button (index 10)
        } else {
            btn.classList.remove('active');
        }
    });

    // Reset note page when entering
    if (pageId === 'note') {
        resetNotePage();
        // Stop blinking when journal is opened
        document.querySelector('.note-btn').classList.remove('blink');
    }

    // Reset tutorial when entering
    if (pageId === 'tutorial') {
        resetTutorial();
    }

    // Unlock station items on page 8
    if (pageId === 8) {
        unlockInventoryItem('bi');
        unlockInventoryItem('stone');
    }

    window.scrollTo(0, 0);
}
