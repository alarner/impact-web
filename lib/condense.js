let _ = require('lodash');

function hasCapitalLetter(word, skipFirstLetter) {
	let start = 0;
	let letter = null;
	if(skipFirstLetter) {
		start++;
	}
	for(let i=start; i<word.length; i++) {
		letter = word.charAt(i);
		if(letter.toUpperCase() == letter && letter >= 'A' && letter <= 'Z') {
			return true;
		}
	}
	return false;
}

function normalizeWord(word) {
	if(word.substr(-2) === '\'s') {
		return word.substr(0, word.length-2);
	}
	if(word.substr(-2) === '’s') {
		return word.substr(0, word.length-2);
	}
	return word.replace('’', '\'');
}

function isEndOfSentence(i, scrubbed) {
	let char = scrubbed.charAt(i);
	
	if(char === '\n' || char === '!' || char === '?' || char === '"' || char === '“' || char === '”' || char === '‘' || char === '(' || char === ')' || char === '[' || char === ']' || char === ';') {
		return i+1;
	}

	if(char === '.') {
		if(i >= scrubbed.length-1) {
			return i;
		}

		let current = i+1;
		while(current < scrubbed.length && /[\s\n]/.test(scrubbed.charAt(current))) current++;

		if(current >= scrubbed.length-1 || (current - i > 1 && !/[a-z]/.test(scrubbed.charAt(current)))) {
			return current;
		}
	}

	if(char === ',' || char === '\'' || char === '’') {
		if(i >= scrubbed.length-1) {
			return i;
		}

		let current = i+1;
		while(current < scrubbed.length && /[\s\n]/.test(scrubbed.charAt(current))) current++;

		if(current >= scrubbed.length-1 || current - i > 1) {
			return current;
		}
	}

	return false;
}

module.exports = function(scrubbed) {
	let start = 0;
	let sentences = [];
	let nextStart = null;

	for(let i=0; i<scrubbed.length; i++) {
		if(nextStart = isEndOfSentence(i, scrubbed)) {
			sentences.push(scrubbed.substring(start, i));
			start = nextStart;
		}
	}
	sentences.push(scrubbed.substring(start));

	let phraseMap = {};

	for(let i=0; i<sentences.length; i++) {
		let words = sentences[i].split(/\s/);
		let streak = [];
		for(let j=0; j < words.length; j++) {
			let skipFirst = (j === 0) && ((words.length === 1) || !hasCapitalLetter(words[1]));
			if(hasCapitalLetter(words[j], skipFirst) && words[j] != 'I' && words[j] != 'A' && words[j].toUpperCase() != 'CEO') {
				streak.push(words[j]);
			}
			else if(streak.length) {
				if(words[j] === 'of' || words[j] === 'the') {
					streak.push(words[j]);
				}
				else if(streak.length > 1 && words[j] === 'and') {
					streak.push(words[j]);
				}
				// else if(streak[streak.length-1] === 'of' && words[j] === 'the') {
				// 	streak.push(words[j]);
				// }
				else {
					let tmp = normalizeWord(streak.join(' '));
					if(!phraseMap.hasOwnProperty(tmp)) {
						phraseMap[tmp] = 0;
					}
					phraseMap[tmp]++;
					streak = [];
				}
			}
		}
		if(streak.length) {
			let tmp = normalizeWord(streak.join(' '));
			if(!phraseMap.hasOwnProperty(tmp)) {
				phraseMap[tmp] = 0;
			}
			phraseMap[tmp]++;
		}
	}

	let phrases = [];
	for(let word in phraseMap) {
		phrases.push({
			text: word,
			count: phraseMap[word]
		});
	}

	return _.sortBy(phrases, function(info) {
		return -1*info.count;
	});
};