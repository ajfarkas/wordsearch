const $ = selector => document.querySelector(selector);
const $$ = selector => document.querySelectorAll(selector);
const getById = id => document.getElementById(id);
let mainWordList = '';

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
const addWordBtn =getById('btn-addword');

let width = 0;
let height = 0;

const findCell = ({x, y}) => $(`[data-coords="${x},${y}"]`);

const highlightWord = () => {

};

const removeFromWordList = word => {
	$(`[data-word="${word}"]`).remove();
};

const addToWordList = word => {
	const wordCap = word.toUpperCase();

	const wordItem = document.createElement('li');
	wordItem.classList.add('word-item');
	wordItem.setAttribute('tabIndex', '0');
	wordItem.textContent = wordCap;
	wordItem.dataset.word = wordCap;
	wordList.appendChild(wordItem);

	wordItem.addEventListener('click', () => {
		removeFromWordList(wordCap);
	});
	wordItem.addEventListener('keydown', ev => {
		if (ev.key === 'Enter') removeFromWordList(wordCap);
	});
};

const addSuggestion = word => {
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
			addToWordList(word);
			suggestionItem.remove();
		}
	});
};

const checkForWords = ({x, y}) => {
	suggestions.replaceChildren();
	const rowLetters = [];
	for (const rowChar of $(`[data-row="${y}"]`).children) {
		rowLetters.push(rowChar.textContent || ' ');
	}
	const colLetters = new Array(
		...$$(`[data-col="${x}"]`)
	).map(el => el.textContent || ' ');
	// TODO this ignores spaces, giving invalid words

	[rowLetters, colLetters].forEach(letterArray => {
		const wordCandidates = [];

		letterArray.forEach((letter, li) => {
			const candidates = mainWordList[letter] || [];
			const letterSet = letterArray.slice(li).join('');

			candidates.forEach(candidate => {
				if (letterSet.match(candidate)
					&& !wordCandidates.includes(candidate)) {
					wordCandidates.push(candidate);
				}
			});
		});
		// let wordCandidates = mainWordList.filter(word => {
		// 	const wordRegex = new RegExp(word, 'gi');
		// 	const matchList = letters.match(wordRegex)
		// 	return matchList ? matchList[0]: false;
		// });
		// wordCandidates = wordCandidates.filter(word => {
		// 	let subset = false;
		// 	wordCandidates.some(wc => {
		// 		if (wc !== word && wc.match(word)) {
		// 			return subset = true;
		// 		}
		// 	})
		// 	return !subset;
		// });
		wordCandidates.forEach(word => {
			addSuggestion(word);
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
				target.textContent = '';
				target.classList.remove('overwrite');
				checkForWords({x, y});
			} else if (key.match(/^[a-z]$/i)) {
				if (target.textContent && target.textContent !== key) {
					target.classList.add('overwrite');
				}
				target.textContent = key.toUpperCase();
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

	width = widthInput.value;
	height = heightInput.value;

	for (let y = 0; y < height; y++) {
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

	addToWordList(wordInput.value);
	wordInput.value = '';
});
