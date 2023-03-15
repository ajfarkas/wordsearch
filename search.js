const $ = selector => document.querySelector(selector);
const $$ = selector => document.querySelectorAll(selector);
const getById = id => document.getElementById(id);
let mainWordList = '';
const gridMatrix = [];
const letterDistros = {};

fetch('./wordlist.json', {
	headers: {'Content-Type': 'text/json'},
	mode: 'same-origin'
}).then(res => res.json())
	.then(words => {
		mainWordList = words;
	})
	.catch(console.error);

const widthInput = getById('input-width');
const heightInput = getById('input-height');
const grid = getById('grid');
const generateBtn = getById('btn-generate');
const suggestions = getById('suggestions');
const wordList = getById('wordlist');
const wordInput = getById('add-word');
const addWordBtn = getById('btn-addword');
const fillSelect = getById('autofill-opts');
const fillBtn = getById('btn-autofill');

let width = 0;
let height = 0;

const findCell = ({x, y}) => $(`[data-coords="${x},${y}"]`);

const letterDistroAsArray = value => {
	if (letterDistros[value]) return letterDistros[value];
	// define chosen frequency as array
	const distro = Object.entries(DISTRIBUTIONS).map(([letter, vals]) =>
		[letter, vals[value] / 100]
	);
	distro.sort((a, b) => a[1] < b[1] ? 1 : -1);
	distro.reduce((acc, curr, dIndex) => {
		const freq = curr[1];
		const max = acc + freq;
		distro[dIndex][2] = max;

		return max;
	}, 0);
	letterDistros[value] = distro;

	return distro;
}

const fillEmptyCells = () => {
	const distro = letterDistroAsArray(fillSelect.value);
	// walk through each empty cell
	gridMatrix.forEach((row, y) => {
		row.forEach((cell, x) => {
			if (!cell || cell === ' ') {
				const random = Math.random();
				const setLetter = l => {
					gridMatrix[y][x] = l;
					findCell({ x, y}).innerText = l;
				};
				const letterFound = distro.some(([letter, freq, max]) => {
					if (random <= max) {
						setLetter(letter);
						return true;
					}
					return false;
				});
				if (!letterFound) {
					setLetter('S');
				}
			}
		})
	});
};

const highlightWord = ev => {
	const wordLoc = ev.target.dataset.location;
	if (!wordLoc) return console.warn('TODO: ask person to highlight word');

	const [start, end] = wordLoc.split(';');
	const [startX, startY] = start.split(',');
	const [endX, endY] = end.split(',');
	for (let y = startY; y <= endY; y++) {
		for (let x = startX; x <= endX; x++) {
			findCell({x, y}).classList.add('isSelected');
		}
	}
};

const clearHighlight = () => {
	$$('.isSelected').forEach(el => el.classList.remove('isSelected'));
};

const isInWordList = word => !!wordList.querySelector(`[data-word="${word}"]`);

const removeFromWordList = word => {
	$(`[data-word="${word}"]`).remove();
};

const addToWordList = ({word, location}) => {
	const wordCap = word.toUpperCase();
	if (isInWordList(wordCap)) return;

	const wordItem = document.createElement('li');
	wordItem.classList.add('word-item');
	wordItem.setAttribute('tabIndex', '0');
	wordItem.textContent = wordCap;
	wordItem.dataset.word = wordCap;
	wordItem.dataset.location = location || '';
	wordList.appendChild(wordItem);
	// Remove from list
	wordItem.addEventListener('click', () => {
		removeFromWordList(wordCap);
	});
	wordItem.addEventListener('keydown', ev => {
		if (ev.key === 'Enter') removeFromWordList(wordCap);
	});
	// Highlight in grid
	wordItem.addEventListener('mouseover', highlightWord);
	wordItem.addEventListener('mouseout', clearHighlight);
	wordItem.addEventListener('focus', highlightWord);
	wordItem.addEventListener('blur', clearHighlight);
};

const addSuggestion = ({word, location}) => {
	const suggestionItem = document.createElement('li');
	const suggestionBox = document.createElement('input');
	const suggestionText = document.createElement('p');

	suggestionItem.classList.add('suggestion');
	suggestionBox.setAttribute('type', 'checkbox');
	suggestionBox.setAttribute('aria-labelledby', `suggest-${word}`);
	suggestionText.id = `suggest-${word}`;
	suggestionText.innerText = word;

	suggestionItem.appendChild(suggestionBox);
	suggestionItem.appendChild(suggestionText);
	suggestions.appendChild(suggestionItem);

	suggestionBox.addEventListener('click', ev => {
		if (ev.target.checked) {
			addToWordList({word, location});
			suggestionItem.remove();
		}
	});
};

const checkForWords = ({x, y}) => {
	suggestions.replaceChildren();
	const rowLetters = gridMatrix[y];
	const colLetters = gridMatrix.map(row => row[x]);

	[rowLetters, colLetters].forEach((letterArray, laIndex) => {
		const wordCandidates = [];

		letterArray.forEach((letter, li) => {
			const candidates = mainWordList[letter] || [];
			const letterSet = letterArray.slice(li).join('');

			candidates.forEach(candidate => {
				if (letterSet.match(candidate)
					&& !wordCandidates.includes(candidate)) {
					const startCoord = laIndex
						? `${x},${li}`
						: `${li},${y}`;
					const endCoord = laIndex
						? `${x},${li + candidate.length - 1}`
						: `${li + candidate.length - 1},${y}`;
					const location = `${startCoord};${endCoord}`;

					wordCandidates.push([candidate, location]);
				}
			});
		});

		wordCandidates.forEach(word => {
			addSuggestion({word: word[0], location: word[1]});
		});
	});
};

const onInput = ev => {
	if (ev.metaKey && !ev.key.match('Arrow')
		|| ev.key === 'Tab') return;
	ev.preventDefault();
	const { key, target, metaKey } = ev;
	const { dataset: { coords }} = target;
	const [w, h] = coords.split(',');
	const x = parseInt(w);
	const y = parseInt(h);

	switch (key) {
		case 'ArrowUp':
			if (metaKey) {
				findCell({ x, y: 0 }).focus();
			} else if (y > 0) {
				findCell({ x, y: y - 1 }).focus();
			}
			break;
		case 'ArrowRight':
			if (metaKey) {
				findCell({ x: width - 1, y }).focus();
			} else if (x < width - 1) {
				findCell({ x: x +1, y }).focus();
			}
			break;
		case 'ArrowDown':
			if (metaKey) {
				findCell({ x, y: height - 1 }).focus();
			} else if (y < height - 1) {
				findCell({ x, y: y + 1 }).focus();
			}
			break;
		case 'ArrowLeft':
			if (metaKey) {
				findCell({ x: 0, y }).focus();
			} else if (x > 0) {
				findCell({ x: x - 1, y }).focus();
			}
			break;
		case 'Enter':
			if (y < height - 1) {
				findCell({ x: 0, y: y + 1 }).focus();
			}
			break;
		default:
			if (metaKey) {
				break;
			} else if (key === 'Backspace') {
				gridMatrix[y][x] = ' ';
				target.textContent = '';
				target.classList.remove('overwrite');
				checkForWords({x, y});
			} else if (key.match(/^[a-z]$/i)) {
				if (target.textContent && target.textContent !== key) {
					target.classList.add('overwrite');
				}
				const displayKey = key.toUpperCase();
				gridMatrix[y][x] = displayKey;
				target.textContent = displayKey;

				if (key.match(/[a-z]/) && x < width - 1) {
					findCell({ x: x + 1, y }).focus();
				} else if (key.match(/[A-Z]/) && y < height - 1) {
					findCell({ x, y: y + 1}).focus();
				}
				checkForWords({x, y});
			}
			break;
	}
};

const createGridCell = ({y, x}) => {
	gridMatrix[y].push(' ');

	const el = document.createElement('div');
	el.setAttribute('contentEditable', true);
	el.classList.add('cell');
	el.dataset.col = x;
	el.dataset.coords = `${x},${y}`;
	el.addEventListener('keydown', onInput);

	return el;
};

const generateGrid = () => {
	grid.replaceChildren();
	gridMatrix.splice(0, gridMatrix.length);

	width = widthInput.value;
	height = heightInput.value;

	for (let y = 0; y < height; y++) {
		gridMatrix.push([]);

		const row = document.createElement('div');
		row.classList.add('row');
		row.dataset.row = y;
		grid.appendChild(row);
		for (let x = 0; x < width; x++) {
			row.appendChild(createGridCell({x, y}));
		}
	}
};

generateGrid();
generateBtn.addEventListener('click', generateGrid);

$$('.size-input').forEach(input => {
	input.addEventListener('keydown', ev => {
		if (ev.key === 'Enter') generateBtn.click();
	});
})
wordInput.addEventListener('keydown', ev => {
	if (ev.key === 'Enter') addWordBtn.click();
});
addWordBtn.addEventListener('click', () => {
	if (!wordInput.checkValidity()) return;

	addToWordList({word: wordInput.value});
	// TODO: ask person to highlight word
	wordInput.value = '';
});
fillBtn.addEventListener('click', fillEmptyCells);
